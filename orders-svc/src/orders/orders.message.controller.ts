import { Controller, UsePipes, ValidationPipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller()
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class OrdersMessageController {
  constructor(private readonly ordersService: OrdersService) {}

  @MessagePattern('orders.create')
  create(@Payload() data: { dto: CreateOrderDto; traceId: string; idempotencyKey?: string }) {
    const { dto, traceId, idempotencyKey } = data;
    console.log(`[traceId=${traceId}] orders.create`);
    return this.ordersService.create(dto, idempotencyKey);
  }

  @MessagePattern('orders.getAll')
  getAll(@Payload() data: { traceId: string }) {
    const { traceId } = data;
    console.log(`[traceId=${traceId}] orders.getAll`);
    return this.ordersService.getAll();
  }

  @MessagePattern('orders.getById')
  getById(@Payload() data: { id: string; traceId: string }) {
    const { id, traceId } = data;
    console.log(`[traceId=${traceId}] orders.getById ${id}`);
    return this.ordersService.getById(id);
  }

  @MessagePattern('orders.approve')
  approve(@Payload() data: { id: string; traceId: string; idempotencyKey?: string }) {
    const { id } = data;
    return this.ordersService.approve(id);
  }

  @MessagePattern('orders.cancel')
  cancel(@Payload() data: { id: string; traceId: string; idempotencyKey?: string }) {
    const { id } = data;
    return this.ordersService.cancel(id);
  }
}
