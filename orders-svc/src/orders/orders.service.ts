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

  //  Creates a new order with items
  // or returns the existing one if the idempotency key is reused.
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
          },
          headers: { traceId, idempotencyKey },
          idempotencyKey,
        });
        return await orderRepo.findOne({
          where: { id: saved.id },
          relations: ['items'],
        }); // hydrate
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

  async approve(
    id: string,
    idempotencyKey?: string,
    traceId?: string,
  ): Promise<Order | null> {
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

        order.status = OrderStatusEnum.PAID;
        await orderRepo.save(order);

        await this.outbox.enqueue(trx, {
          aggregateType: 'Order',
          aggregateId: order.id,
          type: 'OrderPaid', // named OrderPaid to reflect final state
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
          headers: { traceId, idempotencyKey },
          idempotencyKey,
        });

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

  async cancel(
    id: string,
    idempotencyKey?: string,
    traceId?: string,
  ): Promise<Order | null> {
    try {
      return await this.ds.transaction(async (trx) => {
        const orderRepo = trx.getRepository(Order);
        const order = await orderRepo.findOne({
          where: { id },
          relations: ['items'],
        });
        if (!order) throw new NotFoundException('Order not found');

        order.status = OrderStatusEnum.CANCELED;
        order.updatedAt = new Date();
        await orderRepo.save(order);

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
          headers: { traceId, idempotencyKey },
          idempotencyKey,
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
