import { Controller, UsePipes, ValidationPipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller()
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class OrdersMessageController {
  constructor(private readonly orders: OrdersService) {}

  @MessagePattern({ cmd: 'orders.create' })
  async create(
    @Payload()
    data: {
      dto: CreateOrderDto;
      traceId: string;
      idempotencyKey?: string;
    },
  ) {
    const { dto, traceId, idempotencyKey } = data;
    console.log(`[traceId=${traceId}] orders.create`);
    return this.orders.create(dto, idempotencyKey);
  }

  @MessagePattern({ cmd: 'orders.getById' })
  async getById(@Payload() data: { id: string; traceId: string }) {
    const { id, traceId } = data;
    console.log(`[traceId=${traceId}] orders.getById ${id}`);
    return this.orders.getById(id);
  }

  @MessagePattern({ cmd: 'orders.approve' })
  async approve(
    @Payload() data: { id: string; traceId: string; idempotencyKey?: string },
  ) {
    const { id } = data;
    return this.orders.approve(id);
  }

  @MessagePattern({ cmd: 'orders.cancel' })
  async cancel(
    @Payload() data: { id: string; traceId: string; idempotencyKey?: string },
  ) {
    const { id } = data;
    return this.orders.cancel(id);
  }
}
