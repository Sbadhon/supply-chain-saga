import {
  Controller,
  UsePipes,
  ValidationPipe,
  UseInterceptors,
  ClassSerializerInterceptor,
  BadRequestException,
} from '@nestjs/common';
import { MessagePattern, Payload, EventPattern, Ctx, NatsContext } from '@nestjs/microservices';
import { plainToInstance, instanceToPlain } from 'class-transformer';
import { DataSource } from 'typeorm';

import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { Order, OrderStatusEnum } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderCommitProgress } from './entities/order-commit-progress.entity';
import { OutboxService } from 'src/outbox/outbox.service';

@Controller()
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@UseInterceptors(ClassSerializerInterceptor)
export class OrdersMessageController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly ds: DataSource,
    private readonly outbox: OutboxService,
  ) {}

  private toResponse(o: any) {
    const toPlain = (x: any) =>
      instanceToPlain(
        plainToInstance(OrderResponseDto, x, { excludeExtraneousValues: true }),
      );
    return Array.isArray(o) ? o.map(toPlain) : toPlain(o);
  }

  @MessagePattern('orders.create')
  async create(
    @Payload()
    data: {
      dto: CreateOrderDto;
      traceId: string;
      idempotencyKey?: string;
    },
  ) {
    const { dto, traceId, idempotencyKey } = data;
    if (!idempotencyKey) throw new BadRequestException('Missing Idempotency-Key');
    const order = await this.ordersService.create(dto, idempotencyKey, traceId);
    return this.toResponse(order);
  }

  @MessagePattern('orders.getAll')
  async getAll(@Payload() _data: { traceId: string }) {
    const orders = await this.ordersService.getAll();
    return this.toResponse(orders);
  }

  @MessagePattern('orders.getById')
  async getById(@Payload() data: { id: string; traceId: string }) {
    const order = await this.ordersService.getById(data.id);
    return order ? this.toResponse(order) : null;
  }

  @MessagePattern('orders.approve')
  async approve(
    @Payload() data: { id: string; traceId: string; idempotencyKey?: string },
  ) {
    const order = await this.ordersService.approve(data.id, data.idempotencyKey, data.traceId);
    return this.toResponse(order);
  }

  @MessagePattern('orders.cancel')
  async cancel(
    @Payload() data: { id: string; traceId: string; idempotencyKey?: string },
  ) {
    const order = await this.ordersService.cancel(data.id, data.idempotencyKey, data.traceId);
    return this.toResponse(order);
  }

  @EventPattern('payments-svc.events.v1')
  async onPaymentEvent(@Payload() evt: any, @Ctx() _ctx: NatsContext) {
    try {
      const { type, payload, headers } = evt || {};
      const traceId = headers?.traceId as string | undefined;

      if (type === 'PaymentCaptured') {
        const orderId = payload?.orderId;
        if (!orderId) return;

        await this.ds.transaction(async (trx) => {
          const repo = trx.getRepository(Order);
          const order = await repo.findOne({ where: { id: orderId }, relations: ['items'] });
          if (!order) return;

          if (order.status === OrderStatusEnum.PENDING || order.status === OrderStatusEnum.RESERVED) {
            order.status = OrderStatusEnum.PAID;
            await repo.save(order);

            await this.outbox.enqueue(trx, {
              aggregateType: 'Order',
              aggregateId: order.id,
              type: 'OrderPaid',
              payload: {
                id: order.id,
                status: order.status,
                items: order.items?.map(i => ({ sku: i.sku, quantity: i.quantity, unitPrice: i.unitPrice })),
                customerId: order.customerId ?? null,
              },
              headers: { traceId, source: 'payments-svc' },
            });
          }
        });
      }
    } catch {}
  }

  @EventPattern('shipping-svc.events.v1')
  async onShippingEvent(@Payload() evt: any, @Ctx() _ctx: NatsContext) {
    try {
      const { type, payload, headers } = evt || {};
      const traceId = headers?.traceId as string | undefined;

      if (type === 'ShipmentShipped') {
        const orderId = payload?.orderId;
        if (!orderId) return;

        await this.ds.transaction(async (trx) => {
          const repo = trx.getRepository(Order);
          const order = await repo.findOne({ where: { id: orderId }, relations: ['items'] });
          if (!order) return;

          // emit a projection event for UI timelines
          await this.outbox.enqueue(trx, {
            aggregateType: 'Order',
            aggregateId: order.id,
            type: 'OrderShipmentShipped',
            payload: {
              id: order.id,
              shipmentId: payload?.shipmentId,
              shippedAt: payload?.shippedAt ?? new Date().toISOString(),
            },
            headers: { traceId, source: 'shipping-svc' },
          });
        });
      }
    } catch { }
  }

  @EventPattern('inventory-svc.events.v1')
  async onInventoryEvent(@Payload() evt: any, @Ctx() _ctx: NatsContext) {
    try {
      const { type, payload, headers } = evt || {};
      const traceId = headers?.traceId as string | undefined;

      if (type !== 'InventoryCommitted') return;

      const orderId: string | undefined = payload?.orderId;
      const sku: string | undefined = payload?.sku;
      const qty: number | undefined = payload?.quantity;

      if (!orderId || !sku || !Number.isFinite(qty)) return;

      await this.ds.transaction(async (trx) => {
        // Load order + items to derive required qty per SKU
        const orderRepo = trx.getRepository(Order);
        const itemRepo = trx.getRepository(OrderItem);
        const progRepo = trx.getRepository(OrderCommitProgress);

        const order = await orderRepo.findOne({ where: { id: orderId }, relations: ['items'] });
        if (!order) return;

        // required total for this SKU on the order
        const itemsForSku = order.items?.filter(i => i.sku === sku);
        const requiredQty = itemsForSku?.reduce((sum, i) => sum + (i.quantity ?? 0), 0);
        if (requiredQty && requiredQty <= 0) {
          // unknown SKU for this order — ignore (or log)
          return;
        }

        // Upsert progress row and increment committed
        let progress = await progRepo.findOne({ where: { orderId, sku } });
        if (!progress) {
          progress = progRepo.create({ orderId, sku, requiredQty, committedQty: 0 });
        } else if (progress.requiredQty !== requiredQty) {
          // keep required in sync if order items changed (rare)
          progress.requiredQty = requiredQty ?? 0;
        }

        // increment committed but cap at required
        const nextCommitted = Math.min(progress.committedQty + Number(qty), requiredQty ?? 0);
        // idempotency: if no change, short-circuit
        if (nextCommitted === progress.committedQty) {
          return;
        }
        progress.committedQty = nextCommitted;
        await progRepo.save(progress);

        // Check if ALL SKUs are fully committed now
        const allProgress = await progRepo.find({ where: { orderId } });
        // ensure progress rows exist for any SKU not yet touched:
        const bySku = new Map<string, { required: number; committed: number }>();
        for (const it of order.items ?? []) {
          const r = bySku.get(it.sku) ?? { required: 0, committed: 0 };
          r.required += it.quantity ?? 0;
          bySku.set(it.sku, r);
        }
        for (const p of allProgress) {
          const r = bySku.get(p.sku);
          if (r) r.committed = p.committedQty;
        }
        const allCommitted = Array.from(bySku.values()).every(r => r.required > 0 && r.committed >= r.required);

        if (allCommitted) {
          // Emit OrderReadyToShip (your shipping-svc can react / or gateway can call shipping REST)
          await this.outbox.enqueue(trx, {
            aggregateType: 'Order',
            aggregateId: order.id,
            type: 'OrderReadyToShip',
            payload: {
              id: order.id,
              items: order.items?.map(i => ({ sku: i.sku, quantity: i.quantity })),
              committedAt: new Date().toISOString(),
            },
            headers: { traceId, source: 'inventory-svc' },
          });
        }
      });
    } catch {
      // swallow; rely on at-least-once stream + idempotent accumulator
    }
  }
}
