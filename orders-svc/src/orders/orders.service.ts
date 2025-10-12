import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order, OrderStatusEnum } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OutboxService } from 'src/outbox/outbox.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly repo: Repository<Order>,
    private readonly outbox: OutboxService,
    @InjectDataSource()
    private readonly ds: DataSource,
  ) {}

  private computeTotal(
    items: Pick<OrderItem, 'quantity' | 'unitPrice'>[] = [],
  ): number {
    return items.reduce(
      (sum, it) => sum + (Number(it.unitPrice) || 0) * (it.quantity || 0),
      0,
    );
  }

  // Creates a new order with items (idempotent by idempotencyKey)
  async create(
    dto: CreateOrderDto,
    idempotencyKey?: string,
    traceId?: string,
  ): Promise<Order | null> {
    if (!idempotencyKey) {
      throw new BadRequestException('Missing Idempotency-Key header');
    }

    try {
      const existing = await this.repo.findOne({
        where: { idempotencyKey },
        relations: ['items'],
      });
      if (existing) return existing;

      return await this.ds.transaction(async (trx) => {
        const orderRepo = trx.getRepository(Order);
        const itemRepo = trx.getRepository(OrderItem);

        const order = orderRepo.create({
          customerId: dto.customerId ?? undefined,
          status: OrderStatusEnum.PENDING,
          idempotencyKey,
          metadata: dto.metadata ?? null,
        });
        const saved = await orderRepo.save(order);

        const items = dto.items.map((item) =>
          itemRepo.create({
            order: saved,
            sku: item.sku,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            supplierId: item.supplierId ?? null,
          }),
        );
        await itemRepo.save(items);

        await this.outbox.enqueue(trx, {
          aggregateType: 'Order',
          aggregateId: saved.id,
          type: 'OrderCreated',
          payload: {
            id: saved.id,
            status: saved.status,
            items: items.map((i) => ({
              sku: i.sku,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
            })),
            customerId: saved.customerId ?? null,
            total: this.computeTotal(items),
          },
          headers: { traceId, idempotencyKey },
          idempotencyKey, // base key is fine (single row)
        });

        return await orderRepo.findOne({
          where: { id: saved.id },
          relations: ['items'],
        });
      });
    } catch (err) {
      if (
        err instanceof NotFoundException ||
        err instanceof BadRequestException
      )
        throw err;
      throw new InternalServerErrorException('Could not create order');
    }
  }

  async getAll(): Promise<Order[]> {
    return this.repo.find({ relations: ['items'] });
  }

  async getById(id: string): Promise<Order | null> {
    try {
      return await this.repo.findOne({
        where: { id },
        relations: ['items'],
      });
    } catch (err) {
      if (
        err instanceof NotFoundException ||
        err instanceof BadRequestException
      )
        throw err;
      throw new InternalServerErrorException('Could not find order');
    }
  }

  // Approve: request inventory reserve + payment charge (idempotent by idempotencyKey)
  async approve(
    id: string,
    idempotencyKey?: string,
    traceId?: string,
  ): Promise<Order | null> {
    if (!idempotencyKey)
      throw new BadRequestException('Missing Idempotency-Key header');

    try {
      return await this.ds.transaction(async (trx) => {
        const orderRepo = trx.getRepository(Order);
        const order = await orderRepo.findOne({
          where: { id },
          relations: ['items'],
        });
        if (!order) throw new NotFoundException('Order not found');

        if (
          order.status !== OrderStatusEnum.PENDING &&
          order.status !== OrderStatusEnum.RESERVED
        ) {
          throw new BadRequestException(`Cannot approve from ${order.status}`);
        }

        // Move to RESERVED when approve is initiated
        if (order.status === OrderStatusEnum.PENDING) {
          order.status = OrderStatusEnum.RESERVED;
          await orderRepo.save(order);
        }

        const total = this.computeTotal(order.items ?? []);
        const baseKey = idempotencyKey;

        // Inventory reservations — one message per SKU, each with a unique derived key
        for (const it of order.items ?? []) {
          await this.outbox.enqueue(trx, {
            aggregateType: 'Order',
            aggregateId: order.id,
            type: 'InventoryReserveRequested',
            payload: {
              orderId: order.id,
              sku: it.sku,
              quantity: it.quantity,
            },
            headers: { traceId, idempotencyKey: baseKey },
            idempotencyKey: `${baseKey}:inv:${it.sku}`,
          });
        }

        // Payment charge — unique derived key
        await this.outbox.enqueue(trx, {
          aggregateType: 'Order',
          aggregateId: order.id,
          type: 'PaymentChargeRequested',
          payload: {
            orderId: order.id,
            amount: total,
            currency: 'USD',
            customerId: order.customerId ?? null,
          },
          headers: { traceId, idempotencyKey: baseKey },
          idempotencyKey: `${baseKey}:pay`,
        });

        // Return fresh
        return await orderRepo.findOne({ where: { id }, relations: ['items'] });
      });
    } catch (err) {
      if (
        err instanceof NotFoundException ||
        err instanceof BadRequestException
      )
        throw err;
      throw new InternalServerErrorException('Could not approve order');
    }
  }

  // Cancel: mark canceled and request compensation (release/refund)
  async cancel(
    id: string,
    idempotencyKey?: string,
    traceId?: string,
  ): Promise<Order | null> {
    if (!idempotencyKey)
      throw new BadRequestException('Missing Idempotency-Key header');

    try {
      return await this.ds.transaction(async (trx) => {
        const orderRepo = trx.getRepository(Order);

        const order = await orderRepo.findOne({
          where: { id },
          relations: ['items'],
        });
        if (!order) throw new NotFoundException('Order not found');

        // If already final, short-circuit (idempotent)
        if (order.status === OrderStatusEnum.CANCELED) {
          return order;
        }
        if (order.status === OrderStatusEnum.SHIPPED) {
          throw new BadRequestException('Cannot cancel a shipped order');
        }

        const baseKey = idempotencyKey;

        // Compensation intents based on current status
        if (
          order.status === OrderStatusEnum.RESERVED ||
          order.status === OrderStatusEnum.PENDING
        ) {
          for (const it of order.items ?? []) {
            await this.outbox.enqueue(trx, {
              aggregateType: 'Order',
              aggregateId: order.id,
              type: 'InventoryReleaseRequested',
              payload: {
                orderId: order.id,
                sku: it.sku,
                quantity: it.quantity,
              },
              headers: { traceId, idempotencyKey: baseKey },
              idempotencyKey: `${baseKey}:invrel:${it.sku}`,
            });
          }
        }

        if (order.status === OrderStatusEnum.PAID) {
          const total = this.computeTotal(order.items ?? []);
          await this.outbox.enqueue(trx, {
            aggregateType: 'Order',
            aggregateId: order.id,
            type: 'PaymentRefundRequested',
            payload: { orderId: order.id, amount: total, currency: 'USD' },
            headers: { traceId, idempotencyKey: baseKey },
            idempotencyKey: `${baseKey}:refund`,
          });
        }

        // Persist final state
        order.status = OrderStatusEnum.CANCELED;
        order.updatedAt = new Date();
        await orderRepo.save(order);

        // Canonical event for projections
        await this.outbox.enqueue(trx, {
          aggregateType: 'Order',
          aggregateId: order.id,
          type: 'OrderCanceled',
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
          headers: { traceId, idempotencyKey: baseKey },
          idempotencyKey: `${baseKey}:ordercanceled`,
        });

        return await orderRepo.findOne({ where: { id }, relations: ['items'] });
      });
    } catch (err) {
      if (
        err instanceof NotFoundException ||
        err instanceof BadRequestException
      )
        throw err;
      throw new InternalServerErrorException('Could not cancel order');
    }
  }
}
