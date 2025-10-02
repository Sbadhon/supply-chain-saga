import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import * as crypto from 'crypto';

type IdemState = 'pending' | 'done' | 'failed';

interface IdemRecord {
  state: IdemState;
  reqHash: string;
  status?: number;
  body?: any;
  updatedAt: number;
}

@Injectable()
export class IdempotencyService {
  private redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  private ttlSeconds = 60 * 30; // 30 minutes

  reqHash(payload: any) {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(payload ?? {}))
      .digest('hex');
  }

  key(method: string, route: string, idemKey: string) {
    return `idem:${method}:${route}:${idemKey}`;
  }

  async reserve(
    method: string,
    route: string,
    idemKey: string,
    reqHash: string,
  ) {
    const k = this.key(method, route, idemKey);

    const existingRaw = await this.redis.get(k);
    if (existingRaw) {
      const existing: IdemRecord = JSON.parse(existingRaw);
      if (existing.reqHash !== reqHash) {
        return { kind: 'hash_conflict' as const };
      }
      if (existing.state === 'done')
        return { kind: 'already_done' as const, record: existing };
      if (existing.state === 'pending')
        return { kind: 'already_pending' as const };
      // failed => allow new reservation
    }

    // Reserve atomically with NX so only one request proceeds
    const reserved: IdemRecord = {
      state: 'pending',
      reqHash,
      updatedAt: Date.now(),
    };
    const ok = await this.redis.set(
      k,
      JSON.stringify(reserved),
      'EX',
      this.ttlSeconds,
      'NX',
    );
    if (ok === 'OK') return { kind: 'reserved' as const };
    return { kind: 'already_pending' as const };
  }

  async finalize(
    method: string,
    route: string,
    idemKey: string,
    reqHash: string,
    status: number,
    body: any,
  ) {
    const k = this.key(method, route, idemKey);
    const record: IdemRecord = {
      state: 'done',
      reqHash,
      status,
      body,
      updatedAt: Date.now(),
    };
    await this.redis.set(k, JSON.stringify(record), 'EX', this.ttlSeconds);
    return record;
  }

  async read(method: string, route: string, idemKey: string) {
    const raw = await this.redis.get(this.key(method, route, idemKey));
    return raw ? (JSON.parse(raw) as IdemRecord) : null;
  }
}
