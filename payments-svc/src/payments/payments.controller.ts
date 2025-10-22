import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import {
  ApiCreatedResponse,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentResponseDto } from './dto/response-payment.dto';
import { Payment } from './entities/payment.entity';
import { TransitionPaymentDto } from './dto/transition-payment.dto';

type HeaderValue = string | string[] | undefined;
type HeaderBag = Record<string, HeaderValue>;

function readHeader(headers: HeaderBag, name: string): string | undefined {
  const v = headers[name];
  return Array.isArray(v) ? v[0] : v;
}

@ApiTags('payments')
@Controller('v1/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Create a payment' })
  @ApiHeader({
    name: 'Idempotency-Key',
    description:
      'Idempotency key for safely retrying requests (alias: X-Idempotency-Key)',
    required: true,
  })
  @ApiHeader({
    name: 'X-Trace-Id',
    description: 'Optional trace identifier for distributed tracing',
    required: false,
  })
  @ApiCreatedResponse({
    description: 'Payment created',
    type: PaymentResponseDto,
  })
  async create(
    @Body() dto: CreatePaymentDto,
    @Headers() headers: HeaderBag,
  ): Promise<PaymentResponseDto> {
    const idempotencyKey =
      readHeader(headers, 'idempotency-key') ??
      readHeader(headers, 'x-idempotency-key') ??
      '';
    const traceId =
      readHeader(headers, 'x-trace-id') ?? readHeader(headers, 'traceparent');

    const sanitized: CreatePaymentDto = {
      ...dto,
      amount: typeof dto.amount === 'string' ? Number(dto.amount) : dto.amount,
    };

    const payment = await this.paymentsService.create(
      sanitized,
      idempotencyKey,
      traceId,
    );
    return this.toResponse(payment);
  }

  @Get()
  @ApiOperation({ summary: 'Get all payments' })
  @ApiOkResponse({ description: 'Payments list', type: [PaymentResponseDto] })
  async getAll(): Promise<PaymentResponseDto[]> {
    const payments = await this.paymentsService.getAll();
    return payments.map((p) => this.toResponse(p));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiOkResponse({ description: 'Selected payment', type: PaymentResponseDto })
  async getById(@Param('id') id: string): Promise<PaymentResponseDto> {
    const payment = await this.paymentsService.getById(id);
    if (!payment) throw new NotFoundException('Payment not found');
    return this.toResponse(payment);
  }

  @Get(':id/events')
  @ApiOperation({ summary: 'List events for a payment' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiOkResponse({ description: 'Event stream for the payment' })
  async events(@Param('id') id: string) {
    return this.paymentsService.getEvents(id);
  }

  @Post(':id/retry')
  @HttpCode(200)
  @ApiOperation({ summary: 'Retry payment' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiOkResponse({ description: 'Payment retried', type: PaymentResponseDto })
  async retry(@Param('id') id: string): Promise<PaymentResponseDto> {
    const payment: Payment = await this.paymentsService.retry(id);
    if (!payment) throw new NotFoundException('Payment retry failed');
    return this.toResponse(payment);
  }

  @Post(':id/void')
  @HttpCode(200)
  @ApiOperation({ summary: 'Void payment' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiOkResponse({ description: 'Payment voided', type: PaymentResponseDto })
  async voidAuth(@Param('id') id: string): Promise<PaymentResponseDto> {
    const payment: Payment = await this.paymentsService.void(id);
    return this.toResponse(payment);
  }

  @Post(':id/transition')
  @HttpCode(200)
  @ApiOperation({ summary: 'Transition payment (unified endpoint)' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiOkResponse({ description: 'Payment updated', type: PaymentResponseDto })
  async transition(
    @Param('id') id: string,
    @Body() dto: TransitionPaymentDto,
    @Headers() headers: HeaderBag,
  ): Promise<PaymentResponseDto> {
    const idempotencyKey =
      readHeader(headers, 'idempotency-key') ??
      readHeader(headers, 'x-idempotency-key') ??
      '';
    const traceId =
      readHeader(headers, 'x-trace-id') ?? readHeader(headers, 'traceparent');

    const payment = await this.paymentsService.transition(
      id,
      dto,
      idempotencyKey,
      traceId,
    );
    return this.toResponse(payment);
  }

  private toResponse(payment: Payment): PaymentResponseDto {
    return plainToInstance(
      PaymentResponseDto,
      {
        id: payment.id,
        orderId: payment.orderId,
        amount: Number(payment.amount),
        currency: payment.currency,
        status: payment.status,
        authorizedAmount: payment.authorizedAmount ?? null,
        capturedAmount: payment.capturedAmount ?? null,
        refundedAmount: payment.refundedAmount ?? null,
        methodSummary: payment.methodSummary ?? null,
        provider: payment.provider ?? null,
        providerPaymentId: payment.providerPaymentId ?? null,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      },
      { excludeExtraneousValues: true },
    );
  }
}
