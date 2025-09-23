import {
  Body,
  Controller,
  Get,
  Headers,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { OrdersService } from './orders.service';

@Controller('v1/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async create(
    @Body() dto: CreateOrderDto,
    @Headers('idempotency-key') idemKey?: string,
  ): Promise<OrderResponseDto> {
    const order = await this.ordersService.create(dto, idemKey);
    return plainToInstance(OrderResponseDto, order, {
      excludeExtraneousValues: true,
    });
    // Why use plainToInstance with excludeExtraneousValues: true?
    // Ensures only fields decorated with @Expose() are included in the JSON response.
    // Protects internal/private properties from leaking.
    // Handles nested DTOs with @Type().
  }

  @Get()
  async getAll(): Promise<OrderResponseDto[]> {
    const orders = await this.ordersService.getAll();
    return plainToInstance(OrderResponseDto, orders, {
      excludeExtraneousValues: true,
    });
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<OrderResponseDto> {
    const order = await this.ordersService.getById(id);
    if (!order) throw new NotFoundException('Order not found');

    return plainToInstance(OrderResponseDto, order, {
      excludeExtraneousValues: true,
    });
  }

  @Post(':id/approve')
  async approve(@Param('id') id: string): Promise<OrderResponseDto> {
    const order = await this.ordersService.approve(id);
    return plainToInstance(OrderResponseDto, order, { excludeExtraneousValues: true });
  }
  
  @Post(':id/cancel')
  async cancel(@Param('id') id: string): Promise<OrderResponseDto> {
    const order = await this.ordersService.cancel(id);
    return plainToInstance(OrderResponseDto, order, { excludeExtraneousValues: true });
  }
}
