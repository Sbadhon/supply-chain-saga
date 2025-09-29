import {
    Body,
    Controller,
    Get,
    Headers,
    NotFoundException,
    Param,
    Post,
  } from '@nestjs/common';
  import { plainToInstance } from 'class-transformer';
  import { PaymentsService } from './payments.service';
  import { CreatePaymentDto } from './dto/create-payment.dto';
  import { PaymentResponseDto } from './dto/response-payment.dto';
  import { Payment } from './entities/payment.entity';
  
  @Controller('v1/payments')
  export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) {}
  
    @Post()
    async create(
      @Body() dto: CreatePaymentDto,
      @Headers('idempotency-key') idemKeyLower?: string,
      @Headers('x-idempotency-key') idemKeyXLower?: string,
      @Headers('Idempotency-Key') idemKey?: string,
      @Headers('X-Idempotency-Key') idemKeyX?: string,
    ): Promise<PaymentResponseDto> {
      const key = idemKeyLower || idemKeyXLower || idemKey || idemKeyX;
      const payment = await this.paymentsService.create(dto, key);
      return this.toResponse(payment);
    }
  
    @Get()
    async getAll(): Promise<PaymentResponseDto[]> {
      const payments = await this.paymentsService.getAll();
      return payments.map(p => this.toResponse(p));
    }
  
    @Get(':id')
    async getById(@Param('id') id: string): Promise<PaymentResponseDto> {
      const payment = await this.paymentsService.getById(id);
      if (!payment) throw new NotFoundException('Payment not found');
      return this.toResponse(payment);
    }
  
    @Get(':id/events')
    async events(@Param('id') id: string) {
      return this.paymentsService.getEvents(id);
    }
  
    @Post(':id/retry')
    async retry(@Param('id') id: string): Promise<PaymentResponseDto> {
      const p = await this.paymentsService.retry(id);
      return this.toResponse(p);
    }
  
    @Post(':id/void')
    async voidAuth(@Param('id') id: string): Promise<PaymentResponseDto> {
      const p = await this.paymentsService.void(id);
      return this.toResponse(p);
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
          authorizedAmount: payment.authorizedAmount != null ? Number(payment.authorizedAmount) : null,
          capturedAmount: payment.capturedAmount != null ? Number(payment.capturedAmount) : null,
          refundedAmount: payment.refundedAmount != null ? Number(payment.refundedAmount) : null,
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
  