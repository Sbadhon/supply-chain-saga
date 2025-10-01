import { Controller, Get, Post, Body, Param, Inject, Req, Headers } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Controller('orders')
export class OrdersController {
  constructor(@Inject('ORDERS') private readonly orders: ClientProxy) {}

  @Get()
  async getAll(@Req() req: any) {
    return firstValueFrom(
      this.orders.send({ cmd: 'orders.getAll' }, { traceId: req.traceId })
    );
  }

  @Get(':id')
  async getById(@Param('id') id: string, @Req() req: any) {
    return firstValueFrom(
      this.orders.send({ cmd: 'orders.getById' }, { id, traceId: req.traceId })
    );
  }

  @Post()
  async create(
    @Body() dto: any,
    @Req() req: any,
    @Headers() headers: Record<string, string | undefined>,
  ) {
    const idempotencyKey =
      headers['idempotency-key'] ||
      headers['x-idempotency-key'] ||
      headers['Idempotency-Key'] ||
      headers['X-Idempotency-Key'];

    return firstValueFrom(
      this.orders.send(
        { cmd: 'orders.create' },
        { dto, traceId: req.traceId, idempotencyKey }
      )
    );
  }

  @Post(':id/approve')
  async approve(
    @Param('id') id: string,
    @Req() req: any,
    @Headers() headers: Record<string, string | undefined>,
  ) {
    const idempotencyKey =
      headers['idempotency-key'] ||
      headers['x-idempotency-key'] ||
      headers['Idempotency-Key'] ||
      headers['X-Idempotency-Key'];

    return firstValueFrom(
      this.orders.send(
        { cmd: 'orders.approve' },
        { id, traceId: req.traceId, idempotencyKey }
      )
    );
  }

  @Post(':id/cancel')
  async cancel(
    @Param('id') id: string,
    @Req() req: any,
    @Headers() headers: Record<string, string | undefined>,
  ) {
    const idempotencyKey =
      headers['idempotency-key'] ||
      headers['x-idempotency-key'] ||
      headers['Idempotency-Key'] ||
      headers['X-Idempotency-Key'];

    return firstValueFrom(
      this.orders.send(
        { cmd: 'orders.cancel' },
        { id, traceId: req.traceId, idempotencyKey }
      )
    );
  }
}
