import { Controller, Get, Post, Param, Body, Req, Headers } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

const BASE = process.env.INVENTORY_URL || 'http://localhost:3002/v1/inventory';

function pickIdem(h: Record<string,string|undefined>) {
  return h['idempotency-key'] || h['x-idempotency-key'] || h['Idempotency-Key'] || h['X-Idempotency-Key'];
}

@Controller('inventory')
export class InventoryController {
  constructor(private readonly http: HttpService) {}

  @Get()
  async list(@Req() req: any) {
    const r = await firstValueFrom(this.http.get(`${BASE}`, { headers: { 'X-Trace-Id': req.traceId } }));
    return r.data;
  }

  @Get(':sku')
  async getBySku(@Param('sku') sku: string, @Req() req: any) {
    const r = await firstValueFrom(this.http.get(`${BASE}/${encodeURIComponent(sku)}`, { headers: { 'X-Trace-Id': req.traceId } }));
    return r.data;
  }

  @Post('reserve')
  async reserve(@Body() dto: any, @Req() req: any, @Headers() h: Record<string,string|undefined>) {
    const r = await firstValueFrom(this.http.post(`${BASE}/reserve`, dto, {
      headers: { 'X-Trace-Id': req.traceId, 'Idempotency-Key': pickIdem(h) || '' },
    }));
    return r.data;
  }

  @Post('commit')
  async commit(@Body() dto: any, @Req() req: any, @Headers() h: Record<string,string|undefined>) {
    const r = await firstValueFrom(this.http.post(`${BASE}/commit`, dto, {
      headers: { 'X-Trace-Id': req.traceId, 'Idempotency-Key': pickIdem(h) || '' },
    }));
    return r.data;
  }

  @Post('release')
  async release(@Body() dto: any, @Req() req: any, @Headers() h: Record<string,string|undefined>) {
    const r = await firstValueFrom(this.http.post(`${BASE}/release`, dto, {
      headers: { 'X-Trace-Id': req.traceId, 'Idempotency-Key': pickIdem(h) || '' },
    }));
    return r.data;
  }

  @Post('adjust')
  async adjust(@Body() dto: any, @Req() req: any, @Headers() h: Record<string,string|undefined>) {
    const r = await firstValueFrom(this.http.post(`${BASE}/adjust`, dto, {
      headers: { 'X-Trace-Id': req.traceId, 'Idempotency-Key': pickIdem(h) || '' },
    }));
    return r.data;
  }

  @Post('move')
  async move(@Body() dto: any, @Req() req: any, @Headers() h: Record<string,string|undefined>) {
    const r = await firstValueFrom(this.http.post(`${BASE}/move`, dto, {
      headers: { 'X-Trace-Id': req.traceId, 'Idempotency-Key': pickIdem(h) || '' },
    }));
    return r.data;
  }

  @Get(':id/history')
  async history(@Param('id') id: string, @Req() req: any) {
    const r = await firstValueFrom(this.http.get(`${BASE}/${encodeURIComponent(id)}/history`, {
      headers: { 'X-Trace-Id': req.traceId },
    }));
    return r.data;
  }
}
