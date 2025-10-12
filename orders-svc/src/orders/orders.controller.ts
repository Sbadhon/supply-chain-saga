import {
  Body,
  Controller,
  Get,
  Headers,
  NotFoundException,
  Param,
  Post,
  HttpCode,
  BadRequestException,
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

function normalizeHeaders(
  headers: Record<string, string | string[] | undefined>,
): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(headers)) {
    const key = k.toLowerCase();
    out[key] = Array.isArray(v) ? v[0] : v;
  }
  return out;
}

function readTraceId(
  lower: Record<string, string | undefined>,
): string | undefined {
  // support both x-trace-id and trace-id variants
  return lower['x-trace-id'] ?? lower['trace-id'];
}

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
    @Headers() rawHeaders: Record<string, string | string[] | undefined>,
  ): Promise<OrderResponseDto> {
    const headers = normalizeHeaders(rawHeaders);
    const idemKey = headers['idempotency-key'];
    const traceId = readTraceId(headers);

    const order = await this.ordersService.create(dto, idemKey, traceId);
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
    name: 'Idempotency-Key',
    description: 'Required for idempotent approve.',
    required: true,
  })
  @ApiOkResponse({ description: 'Order approved', type: OrderResponseDto })
  async approve(
    @Param('id') id: string,
    @Headers() rawHeaders: Record<string, string | string[] | undefined>,
  ): Promise<OrderResponseDto> {
    const headers = normalizeHeaders(rawHeaders);
    const idemKey = headers['idempotency-key'];
    if (!idemKey) throw new BadRequestException('Missing Idempotency-Key');

    const traceId = readTraceId(headers);
    const order = await this.ordersService.approve(id, idemKey, traceId);
    return plainToInstance(OrderResponseDto, order, {
      excludeExtraneousValues: true,
    });
  }

  @Post(':id/cancel')
  @HttpCode(200)
  @ApiOperation({ summary: 'Cancel order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiHeader({
    name: 'Idempotency-Key',
    description: 'Required for idempotent cancel.',
    required: true,
  })
  @ApiOkResponse({ description: 'Order canceled', type: OrderResponseDto })
  async cancel(
    @Param('id') id: string,
    @Headers() rawHeaders: Record<string, string | string[] | undefined>,
  ): Promise<OrderResponseDto> {
    const headers = normalizeHeaders(rawHeaders);
    const idemKey = headers['idempotency-key'];
    if (!idemKey) throw new BadRequestException('Missing Idempotency-Key');

    const traceId = readTraceId(headers);
    const order = await this.ordersService.cancel(id, idemKey, traceId);
    return plainToInstance(OrderResponseDto, order, {
      excludeExtraneousValues: true,
    });
  }
}
