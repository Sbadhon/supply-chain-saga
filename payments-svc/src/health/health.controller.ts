import { Controller, Get, HttpCode } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as os from 'os';

@Controller('v1/health')
export class HealthController {
  private readonly service = process.env.SERVICE_NAME || 'payments-svc';

  constructor(private readonly ds: DataSource) {}

  @Get('live')
  @HttpCode(200)
  live() {
    return {
      status: 'UP',
      service: this.service,
      pid: process.pid,
      uptimeSec: Math.round(process.uptime()),
      hostname: os.hostname(),
      now: new Date().toISOString(),
    };
  }

  @Get('ready')
  async ready() {
    try {
      await this.ds.query('SELECT 1');
      return {
        status: 'READY',
        service: this.service,
        deps: { db: { ok: true } },
        now: new Date().toISOString(),
      };
    } catch (e: any) {
      return {
        status: 'DEGRADED',
        service: this.service,
        deps: { db: { ok: false, error: e?.message ?? String(e) } },
        now: new Date().toISOString(),
      };
    }
  }

  @Get()
  async full() {
    let dbOk = true,
      dbErr: string | undefined;
    try {
      await this.ds.query('SELECT 1');
    } catch (e: any) {
      dbOk = false;
      dbErr = e?.message ?? String(e);
    }
    return {
      status: dbOk ? 'UP' : 'ISSUES',
      service: this.service,
      deps: { db: { ok: dbOk, error: dbErr } },
      env: {
        port: process.env.PORT,
        dbHost: process.env.DB_HOST,
        dbName: process.env.DB_NAME,
      },
      now: new Date().toISOString(),
    };
  }
}
