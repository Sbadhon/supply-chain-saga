import { Controller, Get, Post, Body, Param, Inject, Req, Headers } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Controller('payments')
export class PaymentsController {
  constructor(@Inject('PAYMENTS') private readonly payments: ClientProxy) {}

  @Get()
  async getAll(@Req() req: any) {
    return firstValueFrom(
      this.payments.send({ cmd: 'payments.getAll' }, { traceId: req.traceId })
    );
  }

  @Get(':id')
  async getById(@Param('id') id: string, @Req() req: any) {
    return firstValueFrom(
      this.payments.send({ cmd: 'payments.getById' }, { id, traceId: req.traceId })
    );
  }

  @Get(':id/events')
  async getEvents(@Param('id') id: string, @Req() req: any) {
    return firstValueFrom(
      this.payments.send({ cmd: 'payments.getEvents' }, { id, traceId: req.traceId })
    );
  }

  @Post()
  async create(
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
      this.payments.send(
        { cmd: 'payments.create' },
        { dto, traceId: req.traceId, idempotencyKey }
      )
    );
  }

  @Post(':id/retry')
  async retry(
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
      this.payments.send(
        { cmd: 'payments.retry' },
        { id, traceId: req.traceId, idempotencyKey }
      )
    );
  }

  @Post(':id/void')
  async voidPayment(
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
      this.payments.send(
        { cmd: 'payments.void' },
        { id, traceId: req.traceId, idempotencyKey }
      )
    );
  }
}
