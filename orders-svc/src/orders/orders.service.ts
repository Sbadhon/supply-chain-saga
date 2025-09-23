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

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly repo: Repository<Order>,

    @InjectDataSource()
    private readonly ds: DataSource,
  ) {}

  //  Creates a new order with items
  // or returns the existing one if the idempotency key is reused.
  async create(
    dto: CreateOrderDto,
    idempotencyKey?: string,
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
            supplierId: item.supplierId ?? null
          }),
        );
        await itemRepo.save(items);
        return await orderRepo.findOne({ where: { id: saved.id }, relations: ['items'] }); // hydrate
      });
    }  catch (err) {
      if (err instanceof NotFoundException || err instanceof BadRequestException) throw err;
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
    }  catch (err) {
      if (err instanceof NotFoundException || err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException('Could not find order');
    }
  }

  async approve(id: string): Promise<Order | null> {
    try {
      const order = await this.repo.findOne({ where: { id }, relations: ['items'] });
      if (!order) throw new NotFoundException('Order not found');

      if (order.status !== 'PENDING' && order.status !== 'RESERVED') {
        throw new BadRequestException(`Cannot approve from ${order.status}`);
      }
      order.status = OrderStatusEnum.PAID;
      await this.repo.save(order);
      return await this.repo.findOne({ where: { id }, relations: ['items'] });
    }  catch (err) {
      if (err instanceof NotFoundException || err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException('Could not approve order');
    }
  }

  async cancel(id: string): Promise<Order | null> {
    try {
      const order = await this.repo.findOne({ where: { id }, relations: ['items'] });
      if (!order) throw new NotFoundException('Order not found');

      order.status = OrderStatusEnum.CANCELED
      order.updatedAt = new Date();
      await this.repo.save(order);
      return await this.repo.findOne({ where: { id }, relations: ['items'] });
    } catch (err) {
      if (err instanceof NotFoundException || err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException('Could not cancel order');
    }
  }

}
