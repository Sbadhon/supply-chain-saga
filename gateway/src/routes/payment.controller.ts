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

const PAYMENTS_CLIENT = 'PAYMENTS' as const;

interface TraceRequest extends Request {
  traceId?: string;
}

function pickIdempotencyKey(h: IncomingHttpHeaders): string | undefined {
  const v = h['idempotency-key'] ?? h['x-idempotency-key'];
  return Array.isArray(v) ? v[0] : v;
}

@Controller('payments')
export class PaymentsController {
  constructor(
    @Inject(PAYMENTS_CLIENT) private readonly payments: ClientProxy,
  ) {}

  @Get()
  getAll(@Req() req: TraceRequest): Promise<unknown> {
    return firstValueFrom(
      this.payments.send('payments.getAll', { traceId: req.traceId }),
    );
  }

  @Get(':id')
  getById(@Param('id') id: string, @Req() req: TraceRequest): Promise<unknown> {
    return firstValueFrom(
      this.payments.send('payments.getById', { id, traceId: req.traceId }),
    );
  }

  @Get(':id/events')
  getEvents(
    @Param('id') id: string,
    @Req() req: TraceRequest,
  ): Promise<unknown> {
    return firstValueFrom(
      this.payments.send('payments.getEvents', { id, traceId: req.traceId }),
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
      this.payments.send('payments.create', {
        dto,
        traceId: req.traceId,
        idempotencyKey,
      }),
    );
  }

  @Post(':id/retry')
  retry(
    @Param('id') id: string,
    @Req() req: TraceRequest,
    @Headers() headers: IncomingHttpHeaders,
  ): Promise<unknown> {
    const idempotencyKey = pickIdempotencyKey(headers);
    return firstValueFrom(
      this.payments.send('payments.retry', {
        id,
        traceId: req.traceId,
        idempotencyKey,
      }),
    );
  }

  @Post(':id/void')
  voidPayment(
    @Param('id') id: string,
    @Req() req: TraceRequest,
    @Headers() headers: IncomingHttpHeaders,
  ): Promise<unknown> {
    const idempotencyKey = pickIdempotencyKey(headers);
    return firstValueFrom(
      this.payments.send('payments.void', {
        id,
        traceId: req.traceId,
        idempotencyKey,
      }),
    );
  }
}
