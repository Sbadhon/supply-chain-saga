import { Controller, Get, Post, Body, Param, Inject, Req, Headers } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Controller('orders')
export class OrdersController {
  constructor(@Inject('ORDERS') private readonly orders: ClientProxy) {}

  @Get()
  getAll(@Req() req: any) {
    return firstValueFrom(this.orders.send('orders.getAll', { traceId: req.traceId }));
  }

  @Get(':id')
  getById(@Param('id') id: string, @Req() req: any) {
    return firstValueFrom(this.orders.send('orders.getById', { id, traceId: req.traceId }));
  }

  @Post()
  create(
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
      this.orders.send('orders.create', { dto, traceId: req.traceId, idempotencyKey })
    );
  }

  @Post(':id/approve')
  approve(
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
      this.orders.send('orders.approve', { id, traceId: req.traceId, idempotencyKey })
    );
  }

  @Post(':id/cancel')
  cancel(
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
      this.orders.send('orders.cancel', { id, traceId: req.traceId, idempotencyKey })
    );
  }
}
