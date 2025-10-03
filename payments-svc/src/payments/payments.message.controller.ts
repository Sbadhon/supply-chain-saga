import {
  ClassSerializerInterceptor,
  Controller,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { plainToInstance, instanceToPlain } from 'class-transformer';

import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentResponseDto } from './dto/response-payment.dto';

@Controller()
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@UseInterceptors(ClassSerializerInterceptor)
export class PaymentsMessageController {
  constructor(private readonly paymentsService: PaymentsService) {}

  private toResponse(o: any) {
    const toPlain = (x: any) =>
      instanceToPlain(
        plainToInstance(PaymentResponseDto, x, {
          excludeExtraneousValues: true,
        }),
      );
    return Array.isArray(o) ? o.map(toPlain) : toPlain(o);
  }

  @MessagePattern('payments.create')
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
    const p = await this.paymentsService.create(dto, idempotencyKey);
    return this.toResponse(p);
  }

  @MessagePattern('payments.getById')
  async getById(@Payload() data: { id: string; traceId: string }) {
    const { id, traceId } = data;
    console.log(`[traceId=${traceId}] payments.getById ${id}`);
    const p = await this.paymentsService.getById(id);
    return p ? this.toResponse(p) : null;
  }

  @MessagePattern('payments.getAll')
  async getAll(@Payload() data: { traceId: string }) {
    const { traceId } = data;
    console.log(`[traceId=${traceId}] payments.getAll`);
    const list = await this.paymentsService.getAll();
    return this.toResponse(list);
  }

  @MessagePattern('payments.getEvents')
  async getEvents(@Payload() data: { id: string; traceId: string }) {
    const { id } = data;
    return this.paymentsService.getEvents(id);
  }

  @MessagePattern('payments.retry')
  async retry(
    @Payload() data: { id: string; traceId: string; idempotencyKey?: string },
  ) {
    const { id } = data;
    const p = await this.paymentsService.retry(id);
    return this.toResponse(p);
  }

  @MessagePattern('payments.void')
  async voidPayment(
    @Payload() data: { id: string; traceId: string; idempotencyKey?: string },
  ) {
    const { id } = data;
    const p = await this.paymentsService.void(id);
    return this.toResponse(p);
  }
}
