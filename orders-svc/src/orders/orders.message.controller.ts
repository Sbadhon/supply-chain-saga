import {
  Controller,
  UsePipes,
  ValidationPipe,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { plainToInstance, instanceToPlain } from 'class-transformer';

@Controller()
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@UseInterceptors(ClassSerializerInterceptor) // ensure class-transformer runs for microservice context
export class OrdersMessageController {
  constructor(private readonly ordersService: OrdersService) {}

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
    console.log(`[traceId=${traceId}] orders.create`);
    const order = await this.ordersService.create(dto, idempotencyKey);
    return this.toResponse(order);
  }

  @MessagePattern('orders.getAll')
  async getAll(@Payload() data: { traceId: string }) {
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
    const order = await this.ordersService.approve(data.id);
    return this.toResponse(order);
  }

  @MessagePattern('orders.cancel')
  async cancel(
    @Payload() data: { id: string; traceId: string; idempotencyKey?: string },
  ) {
    const order = await this.ordersService.cancel(data.id);
    return this.toResponse(order);
  }
}
