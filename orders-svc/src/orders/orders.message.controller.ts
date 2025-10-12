import {
  Controller,
  UsePipes,
  ValidationPipe,
  UseInterceptors,
  ClassSerializerInterceptor,
  BadRequestException,
} from '@nestjs/common';
import {
  MessagePattern,
  Payload,
  EventPattern,
  Ctx,
  NatsContext,
} from '@nestjs/microservices';
import { plainToInstance, instanceToPlain } from 'class-transformer';
import { DataSource } from 'typeorm';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { Order, OrderStatusEnum } from './entities/order.entity';
import { OrderCommitProgress } from './entities/order-commit-progress.entity';
import { OutboxService } from 'src/outbox/outbox.service';

// ---------- tiny, safe type guards ----------
function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}
function asString(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined;
}
function asNumber(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}
// -------------------------------------------

@Controller()
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@UseInterceptors(ClassSerializerInterceptor)
export class OrdersMessageController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly ds: DataSource,
    private readonly outbox: OutboxService,
  ) {}

  private toResponse(o: unknown) {
    const toPlain = (x: unknown) =>
      instanceToPlain(
        plainToInstance(OrderResponseDto, x as Record<string, unknown>, {
          excludeExtraneousValues: true,
        }),
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
    if (!idempotencyKey)
      throw new BadRequestException('Missing Idempotency-Key');
    const order = await this.ordersService.create(dto, idempotencyKey, traceId);
    return this.toResponse(order);
  }

  @MessagePattern('orders.getAll')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    if (!data.idempotencyKey)
      throw new BadRequestException('Missing Idempotency-Key');
    const order = await this.ordersService.approve(
      data.id,
      data.idempotencyKey,
      data.traceId,
    );
    return this.toResponse(order);
  }

  @MessagePattern('orders.cancel')
  async cancel(
    @Payload() data: { id: string; traceId: string; idempotencyKey?: string },
  ) {
    if (!data.idempotencyKey)
      throw new BadRequestException('Missing Idempotency-Key');
    const order = await this.ordersService.cancel(
      data.id,
      data.idempotencyKey,
      data.traceId,
    );
    return this.toResponse(order);
  }

  // ====== EVENTS ======

  @EventPattern('payments-svc.events.v1')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async onPaymentEvent(@Payload() evt: unknown, @Ctx() _ctx: NatsContext) {
    try {
      if (!isObject(evt)) return;
      const type = asString(evt['type']);
      const payload = isObject(evt['payload']) ? evt['payload'] : undefined;
      const headers = isObject(evt['headers']) ? evt['headers'] : undefined;
      const traceId = headers ? asString(headers['traceId']) : undefined;

      if (type !== 'PaymentCaptured' || !payload) return;
      const orderId = asString(payload['orderId']);
      if (!orderId) return;

      await this.ds.transaction(async (trx) => {
        const repo = trx.getRepository(Order);
        const order = await repo.findOne({
          where: { id: orderId },
          relations: ['items'],
        });
        if (!order) return;

        if (
          order.status === OrderStatusEnum.PENDING ||
          order.status === OrderStatusEnum.RESERVED
        ) {
          order.status = OrderStatusEnum.PAID;
          await repo.save(order);

          await this.outbox.enqueue(trx, {
            aggregateType: 'Order',
            aggregateId: order.id,
            type: 'OrderPaid',
            payload: {
              id: order.id,
              status: order.status,
              items: order.items?.map((i) => ({
                sku: i.sku,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
              })),
              customerId: order.customerId ?? null,
            },
            headers: { traceId, source: 'payments-svc' },
          });
        }
      });
    } catch {
      // swallow; rely on at-least-once & idempotency
    }
  }

  @EventPattern('shipping-svc.events.v1')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async onShippingEvent(@Payload() evt: unknown, @Ctx() _ctx: NatsContext) {
    try {
      if (!isObject(evt)) return;
      const type = asString(evt['type']);
      const payload = isObject(evt['payload']) ? evt['payload'] : undefined;
      const headers = isObject(evt['headers']) ? evt['headers'] : undefined;
      const traceId = headers ? asString(headers['traceId']) : undefined;

      if (type !== 'ShipmentShipped' || !payload) return;
      const orderId = asString(payload['orderId']);
      if (!orderId) return;

      await this.ds.transaction(async (trx) => {
        const repo = trx.getRepository(Order);
        const order = await repo.findOne({
          where: { id: orderId },
          relations: ['items'],
        });
        if (!order) return;

        if (order.status !== OrderStatusEnum.SHIPPED) {
          order.status = OrderStatusEnum.SHIPPED;
          await repo.save(order);
        }

        await this.outbox.enqueue(trx, {
          aggregateType: 'Order',
          aggregateId: order.id,
          type: 'OrderShipmentShipped',
          payload: {
            id: order.id,
            shipmentId: asString(payload['shipmentId']),
            shippedAt:
              asString(payload['shippedAt']) ?? new Date().toISOString(),
          },
          headers: { traceId, source: 'shipping-svc' },
        });
      });
    } catch {
      // swallow
    }
  }

  @EventPattern('inventory-svc.events.v1')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async onInventoryEvent(@Payload() evt: unknown, @Ctx() _ctx: NatsContext) {
    try {
      if (!isObject(evt)) return;
      const type = asString(evt['type']);
      const payload = isObject(evt['payload']) ? evt['payload'] : undefined;
      const headers = isObject(evt['headers']) ? evt['headers'] : undefined;
      const traceId = headers ? asString(headers['traceId']) : undefined;

      if (type !== 'InventoryCommitted' || !payload) return;

      const orderId = asString(payload['orderId']);
      const sku = asString(payload['sku']);
      const qty = asNumber(payload['quantity']);
      if (!orderId || !sku || qty === undefined) return;

      await this.ds.transaction(async (trx) => {
        const orderRepo = trx.getRepository(Order);
        const progRepo = trx.getRepository(OrderCommitProgress);

        const order = await orderRepo.findOne({
          where: { id: orderId },
          relations: ['items'],
        });
        if (!order) return;

        const itemsForSku = (order.items ?? []).filter((i) => i.sku === sku);
        const requiredQty = itemsForSku.reduce(
          (sum, i) => sum + (i.quantity ?? 0),
          0,
        );

        // ignore unknown/zero requirement SKUs
        if (!requiredQty || requiredQty <= 0) return;

        let progress = await progRepo.findOne({ where: { orderId, sku } });
        if (!progress) {
          progress = progRepo.create({
            orderId,
            sku,
            requiredQty,
            committedQty: 0,
          });
        } else if (progress.requiredQty !== requiredQty) {
          progress.requiredQty = requiredQty;
        }

        const nextCommitted = Math.min(
          progress.committedQty + qty,
          requiredQty,
        );
        if (nextCommitted === progress.committedQty) return; // idempotent
        progress.committedQty = nextCommitted;
        await progRepo.save(progress);

        // Check all SKUs committed
        const allProgress = await progRepo.find({ where: { orderId } });
        const bySku = new Map<
          string,
          { required: number; committed: number }
        >();
        for (const it of order.items ?? []) {
          const r = bySku.get(it.sku) ?? { required: 0, committed: 0 };
          r.required += it.quantity ?? 0;
          bySku.set(it.sku, r);
        }
        for (const p of allProgress) {
          const r = bySku.get(p.sku);
          if (r) r.committed = p.committedQty;
        }
        const allCommitted = Array.from(bySku.values()).every(
          (r) => r.required > 0 && r.committed >= r.required,
        );

        if (allCommitted) {
          await this.outbox.enqueue(trx, {
            aggregateType: 'Order',
            aggregateId: order.id,
            type: 'OrderReadyToShip',
            payload: {
              id: order.id,
              items: order.items?.map((i) => ({
                sku: i.sku,
                quantity: i.quantity,
              })),
              committedAt: new Date().toISOString(),
            },
            headers: { traceId, source: 'inventory-svc' },
          });
        }
      });
    } catch {
      // rely on at-least-once + idempotent accumulator
    }
  }
}
