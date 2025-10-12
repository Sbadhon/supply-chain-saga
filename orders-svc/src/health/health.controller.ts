import { Controller, Get, HttpCode } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as os from 'os';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('v1/health')
export class HealthController {
  private readonly service = process.env.SERVICE_NAME || 'nest-svc';

  constructor(private readonly ds: DataSource) {}

  @Get('live')
  @HttpCode(200)
  @ApiOperation({ summary: 'Liveness' })
  @ApiOkResponse({ description: 'Process is up' })
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
  @ApiOperation({ summary: 'Readiness (DB check)' })
  @ApiOkResponse({ description: 'Service readiness with DB status' })
  async ready() {
    try {
      await this.ds.query('SELECT 1');
      return {
        status: 'READY',
        service: this.service,
        deps: { db: { ok: true } },
        now: new Date().toISOString(),
      };
    } catch (err) {
      const error =
        err instanceof Error
          ? err.message
          : typeof err === 'string'
            ? err
            : String(err);

      return {
        status: 'DEGRADED',
        service: this.service,
        deps: { db: { ok: false, error } },
        now: new Date().toISOString(),
      };
    }
  }

  @Get()
  @ApiOperation({ summary: 'Verbose health' })
  @ApiOkResponse({ description: 'Aggregated health info' })
  async full() {
    let dbOk = true;
    let dbErr: string | undefined;

    try {
      await this.ds.query('SELECT 1');
    } catch (err) {
      dbOk = false;
      dbErr =
        err instanceof Error
          ? err.message
          : typeof err === 'string'
            ? err
            : String(err);
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
