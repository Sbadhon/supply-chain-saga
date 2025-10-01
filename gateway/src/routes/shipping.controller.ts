import { Controller, Get, Post, Body, Param, Req, Headers } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

const BASE = process.env.SHIPPING_URL || 'http://localhost:3004/v1/shipping';

function pickIdem(h: Record<string,string|undefined>) {
  return h['idempotency-key'] || h['x-idempotency-key'] || h['Idempotency-Key'] || h['X-Idempotency-Key'];
}

@Controller('shipping')
export class ShippingController {
  constructor(private readonly http: HttpService) {}

  @Get('shipments')
  async getAll(@Req() req: any) {
    const r = await firstValueFrom(this.http.get(`${BASE}/shipments`, { headers: { 'X-Trace-Id': req.traceId } }));
    return r.data;
  }

  @Get('shipments/:id')
  async getById(@Param('id') id: string, @Req() req: any) {
    const r = await firstValueFrom(this.http.get(`${BASE}/shipments/${encodeURIComponent(id)}`, { headers: { 'X-Trace-Id': req.traceId } }));
    return r.data;
  }

  @Post('shipments')
  async create(@Body() dto: any, @Req() req: any, @Headers() h: Record<string,string|undefined>) {
    const r = await firstValueFrom(this.http.post(`${BASE}/shipments`, dto, {
      headers: { 'X-Trace-Id': req.traceId, 'Idempotency-Key': pickIdem(h) || '' },
    }));
    return r.data;
  }

  @Post('shipments/cancel')
  async cancel(@Body() dto: any, @Req() req: any, @Headers() h: Record<string,string|undefined>) {
    const r = await firstValueFrom(this.http.post(`${BASE}/shipments/cancel`, dto, {
      headers: { 'X-Trace-Id': req.traceId, 'Idempotency-Key': pickIdem(h) || '' },
    }));
    return r.data;
  }
}
