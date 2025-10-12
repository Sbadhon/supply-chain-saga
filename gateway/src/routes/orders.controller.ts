import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Inject,
  Req,
  Headers,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import type { Request } from 'express';
import type { IncomingHttpHeaders } from 'http';

const ORDERS_CLIENT = 'ORDERS' as const;

interface TraceRequest extends Request {
  traceId?: string;
}

function pickIdempotencyKey(h: IncomingHttpHeaders): string | undefined {
  const get = (k: string) => {
    const v = h[k.toLowerCase()];
    return Array.isArray(v) ? v[0] : v;
  };
  return get('idempotency-key') ?? get('x-idempotency-key');
}

@Controller('orders')
export class OrdersController {
  constructor(@Inject(ORDERS_CLIENT) private readonly orders: ClientProxy) {}

  @Get()
  getAll(@Req() req: TraceRequest): Promise<unknown> {
    return firstValueFrom(
      this.orders.send('orders.getAll', { traceId: req.traceId }),
    );
  }

  @Get(':id')
  getById(@Param('id') id: string, @Req() req: TraceRequest): Promise<unknown> {
    return firstValueFrom(
      this.orders.send('orders.getById', { id, traceId: req.traceId }),
    );
  }

  @Post()
  create(
    @Body() dto: unknown,
    @Req() req: TraceRequest,
    @Headers() headers: IncomingHttpHeaders,
  ): Promise<unknown> {
    const idempotencyKey = pickIdempotencyKey(headers);

    return firstValueFrom(
      this.orders.send('orders.create', {
        dto,
        traceId: req.traceId,
        idempotencyKey,
      }),
    );
  }

  @Post(':id/approve')
  approve(
    @Param('id') id: string,
    @Req() req: TraceRequest,
    @Headers() headers: IncomingHttpHeaders,
  ): Promise<unknown> {
    const idempotencyKey = pickIdempotencyKey(headers);

    return firstValueFrom(
      this.orders.send('orders.approve', {
        id,
        traceId: req.traceId,
        idempotencyKey,
      }),
    );
  }

  @Post(':id/cancel')
  cancel(
    @Param('id') id: string,
    @Req() req: TraceRequest,
    @Headers() headers: IncomingHttpHeaders,
  ): Promise<unknown> {
    const idempotencyKey = pickIdempotencyKey(headers);

    return firstValueFrom(
      this.orders.send('orders.cancel', {
        id,
        traceId: req.traceId,
        idempotencyKey,
      }),
    );
  }
}
