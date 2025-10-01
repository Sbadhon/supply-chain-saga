import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import * as crypto from 'crypto';

@Injectable()
export class IdempotencyService {
  private redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  private ttlSeconds = 60 * 30; // 30 minutes

  private hash(body: any) {
    return crypto.createHash('sha256').update(JSON.stringify(body || {})).digest('hex');
  }

  key(route: string, idk: string) {
    return `idem:${route}:${idk}`;
  }

  async get(route: string, idk: string) {
    const raw = await this.redis.get(this.key(route, idk));
    return raw ? JSON.parse(raw) : null;
  }

  async set(route: string, idk: string, body: any, status: number) {
    const value = { status, body, bodyHash: this.hash(body) };
    await this.redis.setex(this.key(route, idk), this.ttlSeconds, JSON.stringify(value));
    return value;
  }

  bodyHash(body: any) {
    return this.hash(body);
  }
}
