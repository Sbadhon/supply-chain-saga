import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from './entities/order.entity';
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
  ): Promise<Order> {
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
          status: 'PENDING',
          idempotencyKey,
          metadata: dto.metadata ?? null,
        });

        const saved = await orderRepo.save(order);

        const items = dto.items.map((item) =>
          itemRepo.create({
            order: saved,
            sku: item.sku,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          }),
        );

        await itemRepo.save(items);
        return saved;
      });
    } catch (err) {
      // console.error('Order creation failed:', err);

      if (err instanceof BadRequestException) {
        throw err;
      }

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
      // console.error(`Error loading order ${id}:`, err);
      throw new InternalServerErrorException('Could not load order');
    }
  }
}
