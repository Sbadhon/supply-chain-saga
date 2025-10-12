import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Req,
  Headers,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import type { Request } from 'express';
import type { IncomingHttpHeaders } from 'http';

const BASE = process.env.INVENTORY_URL || 'http://localhost:3002/v1/inventory';

// Extend Request to include traceId set by your middleware
interface TraceRequest extends Request {
  traceId?: string;
}

function pickIdem(h: IncomingHttpHeaders): string | undefined {
  // Normalize possibly array-valued headers
  const get = (k: string) => {
    const v = h[k.toLowerCase()];
    if (Array.isArray(v)) return v[0];
    return v;
  };
  return get('idempotency-key') || get('x-idempotency-key');
}

@Controller('inventory')
export class InventoryController {
  constructor(private readonly http: HttpService) {}

  @Get()
  async list(@Req() req: TraceRequest): Promise<unknown> {
    const r = await firstValueFrom(
      this.http.get(`${BASE}`, {
        headers: { 'X-Trace-Id': req.traceId ?? '' },
      }),
    );
    return r.data;
  }

  @Get(':sku')
  async getBySku(
    @Param('sku') sku: string,
    @Req() req: TraceRequest,
  ): Promise<unknown> {
    const r = await firstValueFrom(
      this.http.get(`${BASE}/${encodeURIComponent(sku)}`, {
        headers: { 'X-Trace-Id': req.traceId ?? '' },
      }),
    );
    return r.data;
  }

  @Post('reserve')
  async reserve(
    @Body() dto: unknown,
    @Req() req: TraceRequest,
    @Headers() h: IncomingHttpHeaders,
  ): Promise<unknown> {
    const r = await firstValueFrom(
      this.http.post(`${BASE}/reserve`, dto, {
        headers: {
          'X-Trace-Id': req.traceId ?? '',
          'Idempotency-Key': pickIdem(h) ?? '',
        },
      }),
    );
    return r.data;
  }

  @Post('commit')
  async commit(
    @Body() dto: unknown,
    @Req() req: TraceRequest,
    @Headers() h: IncomingHttpHeaders,
  ): Promise<unknown> {
    const r = await firstValueFrom(
      this.http.post(`${BASE}/commit`, dto, {
        headers: {
          'X-Trace-Id': req.traceId ?? '',
          'Idempotency-Key': pickIdem(h) ?? '',
        },
      }),
    );
    return r.data;
  }

  @Post('release')
  async release(
    @Body() dto: unknown,
    @Req() req: TraceRequest,
    @Headers() h: IncomingHttpHeaders,
  ): Promise<unknown> {
    const r = await firstValueFrom(
      this.http.post(`${BASE}/release`, dto, {
        headers: {
          'X-Trace-Id': req.traceId ?? '',
          'Idempotency-Key': pickIdem(h) ?? '',
        },
      }),
    );
    return r.data;
  }

  @Post('adjust')
  async adjust(
    @Body() dto: unknown,
    @Req() req: TraceRequest,
    @Headers() h: IncomingHttpHeaders,
  ): Promise<unknown> {
    const r = await firstValueFrom(
      this.http.post(`${BASE}/adjust`, dto, {
        headers: {
          'X-Trace-Id': req.traceId ?? '',
          'Idempotency-Key': pickIdem(h) ?? '',
        },
      }),
    );
    return r.data;
  }

  @Post('move')
  async move(
    @Body() dto: unknown,
    @Req() req: TraceRequest,
    @Headers() h: IncomingHttpHeaders,
  ): Promise<unknown> {
    const r = await firstValueFrom(
      this.http.post(`${BASE}/move`, dto, {
        headers: {
          'X-Trace-Id': req.traceId ?? '',
          'Idempotency-Key': pickIdem(h) ?? '',
        },
      }),
    );
    return r.data;
  }

  @Get(':id/history')
  async history(
    @Param('id') id: string,
    @Req() req: TraceRequest,
  ): Promise<unknown> {
    const r = await firstValueFrom(
      this.http.get(`${BASE}/${encodeURIComponent(id)}/history`, {
        headers: { 'X-Trace-Id': req.traceId ?? '' },
      }),
    );
    return r.data;
  }
}
