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

  /** Build outgoing headers from the inbound request safely */
  private headersFrom(req: Request): { headers: Record<string, string> } {
    const pick = (key: string): string | undefined => {
      const v = req.headers[key];
      return Array.isArray(v) ? v[0] : v;
    };

    const headers: Record<string, string> = {};

    const traceparent = pick('traceparent');
    const idempotency = pick('idempotency-key');
    const authorization = pick('authorization');

    if (traceparent) headers['traceparent'] = traceparent;
    if (idempotency) headers['idempotency-key'] = idempotency;
    if (authorization) headers['authorization'] = authorization;

    return { headers };
  }

  get inventoryBase(): string | undefined {
    return this.cfg.get<string>('INVENTORY_BASE_URL');
  }

  get shippingBase(): string | undefined {
    return this.cfg.get<string>('SHIPPING_BASE_URL');
  }

  async get<T = unknown>(url: string, req: Request): Promise<T> {
    const { data } = await this.http.axiosRef.get<T>(
      url,
      this.headersFrom(req),
    );
    return data;
  }

  async post<T = unknown>(
    url: string,
    body: unknown,
    req: Request,
  ): Promise<T> {
    const { data } = await this.http.axiosRef.post<T>(
      url,
      body,
      this.headersFrom(req),
    );
    return data;
  }
}
