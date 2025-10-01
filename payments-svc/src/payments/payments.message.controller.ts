import { Controller, UsePipes, ValidationPipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Controller()
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class PaymentsMessageController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @MessagePattern({ cmd: 'payments.create' })
  async create(
    @Payload()
    data: {
      dto: CreatePaymentDto;
      traceId: string;
      idempotencyKey?: string;
    },
  ) {
    const { dto, traceId, idempotencyKey } = data;
    console.log(`[traceId=${traceId}] payments.create`);
    return this.paymentsService.create(dto, idempotencyKey);
  }

  @MessagePattern({ cmd: 'payments.getById' })
  async getById(@Payload() data: { id: string; traceId: string }) {
    const { id, traceId } = data;
    console.log(`[traceId=${traceId}] payments.getById ${id}`);
    return this.paymentsService.getById(id);
  }

  @MessagePattern({ cmd: 'payments.getAll' })
  async getAll(@Payload() data: { traceId: string }) {
    const { traceId } = data;
    console.log(`[traceId=${traceId}] payments.getAll`);
    return this.paymentsService.getAll();
  }

  @MessagePattern({ cmd: 'payments.getEvents' })
  async getEvents(
    @Payload() data: { id: string; traceId: string; idempotencyKey?: string },
  ) {
    const { id } = data;
    return this.paymentsService.getEvents(id);
  }

  @MessagePattern({ cmd: 'payments.retry' })
  async retry(
    @Payload() data: { id: string; traceId: string; idempotencyKey?: string },
  ) {
    const { id } = data;
    return this.paymentsService.retry(id);
  }

  @MessagePattern({ cmd: 'payments.void' })
  async voidPayment(
    @Payload() data: { id: string; traceId: string; idempotencyKey?: string },
  ) {
    const { id } = data;
    return this.paymentsService.void(id);
  }
}
