import {
  Body,
  Controller,
  Get,
  Headers,
  NotFoundException,
  Param,
  Post,
  HttpCode,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { OrdersService } from './orders.service';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiHeader,
} from '@nestjs/swagger';

@ApiTags('orders')
@Controller('v1/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Create an order' })
  @ApiHeader({
    name: 'Idempotency-Key',
    description: 'Uniquely identifies this create request for idempotency.',
    required: true,
  })
  @ApiCreatedResponse({ description: 'Order created', type: OrderResponseDto })
  async create(
    @Body() dto: CreateOrderDto,
    @Headers('idempotency-key') idemKey?: string,
  ): Promise<OrderResponseDto> {
    const order = await this.ordersService.create(dto, idemKey);
    return plainToInstance(OrderResponseDto, order, {
      excludeExtraneousValues: true,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders' })
  @ApiOkResponse({ description: 'Orders list', type: [OrderResponseDto] })
  async getAll(): Promise<OrderResponseDto[]> {
    const orders = await this.ordersService.getAll();
    return plainToInstance(OrderResponseDto, orders, {
      excludeExtraneousValues: true,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by id' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiOkResponse({ description: 'Selected order', type: OrderResponseDto })
  async getById(@Param('id') id: string): Promise<OrderResponseDto> {
    const order = await this.ordersService.getById(id);
    if (!order) throw new NotFoundException('Order not found');
    return plainToInstance(OrderResponseDto, order, {
      excludeExtraneousValues: true,
    });
  }

  @Post(':id/approve')
  @HttpCode(200)
  @ApiOperation({ summary: 'Approve order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiHeader({
    name: 'X-Trace-Id',
    description: 'Unique request trace identifier for distributed tracing.',
    required: false,
  })
  @ApiOkResponse({ description: 'Order approved', type: OrderResponseDto })
  async approve(
    @Param('id') id: string,
    @Headers('x-trace-id') traceIdLower?: string,
    @Headers('trace-id') traceIdAltLower?: string,
    @Headers('X-Trace-Id') traceId?: string,
    @Headers('Trace-Id') traceIdAlt?: string,
  ): Promise<OrderResponseDto> {
    const traceIdValue =
      traceIdLower || traceIdAltLower || traceId || traceIdAlt;
    console.log(`[approve] traceId=${traceIdValue ?? '(none)'}`);
    const order = await this.ordersService.approve(id, traceIdValue);
    return plainToInstance(OrderResponseDto, order, {
      excludeExtraneousValues: true,
    });
  }

  @Post(':id/cancel')
  @HttpCode(200)
  @ApiOperation({ summary: 'Cancel order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiHeader({
    name: 'X-Trace-Id',
    description: 'Unique request trace identifier for distributed tracing.',
    required: false,
  })
  @ApiOkResponse({ description: 'Order canceled', type: OrderResponseDto })
  async cancel(
    @Param('id') id: string,
    @Headers('x-trace-id') traceIdLower?: string,
    @Headers('trace-id') traceIdAltLower?: string,
    @Headers('X-Trace-Id') traceId?: string,
    @Headers('Trace-Id') traceIdAlt?: string,
  ): Promise<OrderResponseDto> {
    const traceIdValue =
      traceIdLower || traceIdAltLower || traceId || traceIdAlt;
    console.log(`[cancel] traceId=${traceIdValue ?? '(none)'}`);
    const order = await this.ordersService.cancel(id, traceIdValue);
    return plainToInstance(OrderResponseDto, order, {
      excludeExtraneousValues: true,
    });
  }
}
