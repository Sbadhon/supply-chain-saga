import {
  ClassSerializerInterceptor,
  Controller,
  Logger,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentResponseDto } from './dto/response-payment.dto';
import { TransitionPaymentDto } from './dto/transition-payment.dto';

type CreateMsg = {
  dto: CreatePaymentDto;
  traceId: string;
  idempotencyKey?: string;
};

type IdMsg = { id: string; traceId: string };

type TransitionMsg = {
  id: string;
  dto: TransitionPaymentDto;
  traceId: string;
  idempotencyKey?: string;
};

@Controller()
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@UseInterceptors(ClassSerializerInterceptor)
export class PaymentsMessageController {
  private readonly logger = new Logger(PaymentsMessageController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  private toResponse<T>(input: T | T[]): unknown {
    const toPlain = (x: T) =>
      instanceToPlain(
        plainToInstance(PaymentResponseDto, x as object, {
          excludeExtraneousValues: true,
        }),
      );
    return Array.isArray(input) ? input.map(toPlain) : toPlain(input);
  }

  // -------------------------------------------------------------
  // NATS message patterns
  // -------------------------------------------------------------
  @MessagePattern('payments.create')
  async create(@Payload() data: CreateMsg) {
    const { dto, traceId, idempotencyKey } = data;
    this.logger.log(`[traceId=${traceId}] payments.create`);
    const payment = await this.paymentsService.create(
      dto,
      idempotencyKey ?? '',
      traceId,
    );
    return this.toResponse(payment);
  }

  @MessagePattern('payments.getById')
  async getById(@Payload() data: IdMsg) {
    const { id, traceId } = data;
    this.logger.log(`[traceId=${traceId}] payments.getById ${id}`);
    const payment = await this.paymentsService.getById(id);
    return payment ? this.toResponse(payment) : null;
  }

  @MessagePattern('payments.getAll')
  async getAll(@Payload() data: { traceId: string }) {
    this.logger.log(`[traceId=${data.traceId}] payments.getAll`);
    const list = await this.paymentsService.getAll();
    return this.toResponse(list);
  }

  @MessagePattern('payments.transition')
  async transition(@Payload() data: TransitionMsg) {
    const { id, dto, traceId, idempotencyKey } = data;
    this.logger.log(`[traceId=${traceId}] payments.transition ${id}`);
    const payment = await this.paymentsService.transition(
      id,
      dto,
      idempotencyKey,
      traceId,
    );
    return this.toResponse(payment);
  }
}
