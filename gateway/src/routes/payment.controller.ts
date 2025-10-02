import { Controller, Get, Post, Body, Param, Inject, Req, Headers } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Controller('payments')
export class PaymentsController {
  constructor(@Inject('PAYMENTS') private readonly payments: ClientProxy) {}

  @Get()
  getAll(@Req() req: any) {
    return firstValueFrom(this.payments.send('payments.getAll', { traceId: req.traceId }));
  }

  @Get(':id')
  getById(@Param('id') id: string, @Req() req: any) {
    return firstValueFrom(this.payments.send('payments.getById', { id, traceId: req.traceId }));
  }

  @Get(':id/events')
  getEvents(@Param('id') id: string, @Req() req: any) {
    return firstValueFrom(this.payments.send('payments.getEvents', { id, traceId: req.traceId }));
  }

  @Post()
  create(
    @Body() dto: any,
    @Req() req: any,
    @Headers() headers: Record<string, string | undefined>
  ) {
    const idempotencyKey =
      headers['idempotency-key'] ||
      headers['x-idempotency-key'] ||
      headers['Idempotency-Key'] ||
      headers['X-Idempotency-Key'];

    return firstValueFrom(
      this.payments.send('payments.create', { dto, traceId: req.traceId, idempotencyKey })
    );
  }

  @Post(':id/retry')
  retry(
    @Param('id') id: string,
    @Req() req: any,
    @Headers() headers: Record<string, string | undefined>
  ) {
    const idempotencyKey =
      headers['idempotency-key'] ||
      headers['x-idempotency-key'] ||
      headers['Idempotency-Key'] ||
      headers['X-Idempotency-Key'];

    return firstValueFrom(
      this.payments.send('payments.retry', { id, traceId: req.traceId, idempotencyKey })
    );
  }

  @Post(':id/void')
  voidPayment(
    @Param('id') id: string,
    @Req() req: any,
    @Headers() headers: Record<string, string | undefined>
  ) {
    const idempotencyKey =
      headers['idempotency-key'] ||
      headers['x-idempotency-key'] ||
      headers['Idempotency-Key'] ||
      headers['X-Idempotency-Key'];

    return firstValueFrom(
      this.payments.send('payments.void', { id, traceId: req.traceId, idempotencyKey })
    );
  }
}

