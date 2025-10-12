import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  Headers,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import type { Request } from 'express';
import type { IncomingHttpHeaders } from 'http';

const BASE = process.env.SHIPPING_URL || 'http://localhost:3004/v1/shipping';

interface TraceRequest extends Request {
  traceId?: string;
}

function pickIdempotencyKey(h: IncomingHttpHeaders): string | undefined {
  const v = h['idempotency-key'] ?? h['x-idempotency-key'];
  return Array.isArray(v) ? v[0] : v;
}

@Controller('shipping')
export class ShippingController {
  constructor(private readonly http: HttpService) {}

  @Get('shipments')
  async getAll(@Req() req: TraceRequest): Promise<unknown> {
    const r = await firstValueFrom(
      this.http.get(`${BASE}/shipments`, {
        headers: { 'x-trace-id': req.traceId ?? '' },
      }),
    );
    return r.data;
  }

  @Get('shipments/:id')
  async getById(
    @Param('id') id: string,
    @Req() req: TraceRequest,
  ): Promise<unknown> {
    const r = await firstValueFrom(
      this.http.get(`${BASE}/shipments/${encodeURIComponent(id)}`, {
        headers: { 'x-trace-id': req.traceId ?? '' },
      }),
    );
    return r.data;
  }

  @Post('shipments')
  async create(
    @Body() dto: unknown,
    @Req() req: TraceRequest,
    @Headers() h: IncomingHttpHeaders,
  ): Promise<unknown> {
    const r = await firstValueFrom(
      this.http.post(`${BASE}/shipments`, dto, {
        headers: {
          'x-trace-id': req.traceId ?? '',
          'idempotency-key': pickIdempotencyKey(h) ?? '',
        },
      }),
    );
    return r.data;
  }

  @Post('shipments/cancel')
  async cancel(
    @Body() dto: unknown,
    @Req() req: TraceRequest,
    @Headers() h: IncomingHttpHeaders,
  ): Promise<unknown> {
    const r = await firstValueFrom(
      this.http.post(`${BASE}/shipments/cancel`, dto, {
        headers: {
          'x-trace-id': req.traceId ?? '',
          'idempotency-key': pickIdempotencyKey(h) ?? '',
        },
      }),
    );
    return r.data;
  }
}
