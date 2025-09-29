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
  
  @Controller('v1/payments')
  export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) {}
  
    @Post()
    async create(
      @Body() dto: CreatePaymentDto,
      @Headers('idempotency-key') idemKey?: string,
    ): Promise<PaymentResponseDto> {
      const payment = await this.paymentsService.create(dto, idemKey);
      return plainToInstance(PaymentResponseDto, payment, {
        excludeExtraneousValues: true,
      });
    }
  
    @Get()
    async getAll(): Promise<PaymentResponseDto[]> {
      const payments = await this.paymentsService.getAll();
      return plainToInstance(PaymentResponseDto, payments, {
        excludeExtraneousValues: true,
      });
    }
  
    @Get(':id')
    async getById(@Param('id') id: string): Promise<PaymentResponseDto> {
      const payment = await this.paymentsService.getById(id);
      if (!payment) throw new NotFoundException('Payment not found');
  
      return plainToInstance(PaymentResponseDto, payment, {
        excludeExtraneousValues: true,
      });
    }
  
    // --- match frontend effects ---
  
    // GET /v1/payments/:id/events
    @Get(':id/events')
    async getEvents(@Param('id') id: string) {
      return this.paymentsService.getEvents(id);
    }
  
    // POST /v1/payments/:id/retry
    @Post(':id/retry')
    async retry(@Param('id') id: string): Promise<PaymentResponseDto> {
      const payment = await this.paymentsService.retry(id);
      return plainToInstance(PaymentResponseDto, payment, {
        excludeExtraneousValues: true,
      });
    }
  
    // POST /v1/payments/:id/void
    @Post(':id/void')
    async voidAuth(@Param('id') id: string): Promise<PaymentResponseDto> {
      const payment = await this.paymentsService.void(id);
      return plainToInstance(PaymentResponseDto, payment, {
        excludeExtraneousValues: true,
      });
    }
  }
  