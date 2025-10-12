import { Injectable } from '@nestjs/common';
import Redis, { Redis as RedisClient } from 'ioredis';
import * as crypto from 'crypto';

type IdemState = 'pending' | 'done' | 'failed';

type Json = string | number | boolean | null | { [k: string]: Json } | Json[];

interface IdemRecord {
  state: IdemState;
  reqHash: string;
  status?: number;
  body?: Json;
  updatedAt: number;
}

type ReserveResult =
  | { kind: 'hash_conflict' }
  | { kind: 'already_done'; record: IdemRecord }
  | { kind: 'already_pending' }
  | { kind: 'reserved' };

function isIdemState(x: unknown): x is IdemState {
  return x === 'pending' || x === 'done' || x === 'failed';
}

function isJson(x: unknown): x is Json {
  if (
    x === null ||
    typeof x === 'string' ||
    typeof x === 'number' ||
    typeof x === 'boolean'
  )
    return true;
  if (Array.isArray(x)) return x.every(isJson);
  if (typeof x === 'object') {
    return Object.values(x as Record<string, unknown>).every(isJson);
  }
  return false;
}

function isIdemRecord(x: unknown): x is IdemRecord {
  if (typeof x !== 'object' || x === null) return false;
  const o = x as Record<string, unknown>;
  if (!isIdemState(o.state)) return false;
  if (typeof o.reqHash !== 'string') return false;
  if (typeof o.updatedAt !== 'number') return false;
  if (o.status !== undefined && typeof o.status !== 'number') return false;
  if (o.body !== undefined && !isJson(o.body)) return false;
  return true;
}

@Injectable()
export class IdempotencyService {
  private readonly redis: RedisClient;
  private readonly ttlSeconds = 60 * 30; // 30 minutes

  constructor() {
    const url = process.env.REDIS_URL ?? 'redis://localhost:6379';
    this.redis = new Redis(url);
  }

  reqHash(payload: unknown): string {
    // stringify unknown safely
    const json = JSON.stringify(payload ?? {});
    return crypto.createHash('sha256').update(json).digest('hex');
  }

  key(method: string, route: string, idemKey: string): string {
    return `idem:${method}:${route}:${idemKey}`;
  }

  async reserve(
    method: string,
    route: string,
    idemKey: string,
    reqHash: string,
  ): Promise<ReserveResult> {
    const k = this.key(method, route, idemKey);

    const existingRaw = await this.redis.get(k);
    if (existingRaw) {
      const parsed: unknown = JSON.parse(existingRaw);
      if (isIdemRecord(parsed)) {
        const existing = parsed;
        if (existing.reqHash !== reqHash) {
          return { kind: 'hash_conflict' as const };
        }
        if (existing.state === 'done') {
          return { kind: 'already_done' as const, record: existing };
        }
        if (existing.state === 'pending') {
          return { kind: 'already_pending' as const };
        }
        // failed => allow new reservation
      } else {
        // Corrupt value in cache: overwrite below via NX miss handling or explicit set
      }
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
    body: unknown, // was: any
  ): Promise<IdemRecord> {
    const k = this.key(method, route, idemKey);
    const safeBody: Json | undefined = isJson(body) ? body : undefined;

    const record: IdemRecord = {
      state: 'done',
      reqHash,
      status,
      body: safeBody,
      updatedAt: Date.now(),
    };
    await this.redis.set(k, JSON.stringify(record), 'EX', this.ttlSeconds);
    return record;
  }

  async read(
    method: string,
    route: string,
    idemKey: string,
  ): Promise<IdemRecord | null> {
    const raw = await this.redis.get(this.key(method, route, idemKey));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isIdemRecord(parsed) ? parsed : null;
  }
}
