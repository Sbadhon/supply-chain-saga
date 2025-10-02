import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class DownstreamHttpService {
  constructor(
    private readonly http: HttpService,
    private readonly cfg: ConfigService,
  ) {}

  private headersFrom(req: Request) {
    const h: Record<string, string> = {};
    const tp = req.headers['traceparent'];
    const ide = req.headers['idempotency-key'];
    const auth = req.headers['authorization'];
    if (tp) h['traceparent'] = String(tp);
    if (ide) h['Idempotency-Key'] = String(ide);
    if (auth) h['Authorization'] = String(auth);
    return { headers: h };
  }

  get inventoryBase() {
    return this.cfg.get<string>('INVENTORY_BASE_URL');
  }
  get shippingBase() {
    return this.cfg.get<string>('SHIPPING_BASE_URL');
  }

  async get(url: string, req: Request) {
    const { data } = await this.http.axiosRef.get(url, this.headersFrom(req));
    return data;
  }
  async post(url: string, body: any, req: Request) {
    const { data } = await this.http.axiosRef.post(
      url,
      body,
      this.headersFrom(req),
    );
    return data;
  }
}
