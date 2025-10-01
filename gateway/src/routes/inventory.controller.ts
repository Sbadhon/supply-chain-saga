import { Controller, Get, Post, Body, Param, Inject, Req, Headers } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { TRACE_ID_HEADER } from '../common/tracing.constants';

@Controller('inventory')
export class InventoryController {
  constructor(@Inject('INVENTORY') private readonly inventory: ClientProxy) {}

  @Get(':id')
  async getById(@Param('id') id: string, @Req() req: any) {
    return firstValueFrom(
      this.inventory.send({ cmd: 'inventory.getById' }, { id, traceId: req.traceId })
    );
  }

  @Post()
  async create(@Body() dto: any, @Req() req: any, @Headers() headers: Record<string,string>) {
    return firstValueFrom(
      this.inventory.send(
        { cmd: 'inventory.create' },
        { dto, traceId: req.traceId, idempotencyKey: headers['idempotency-key'] }
      )
    );
  }
}
