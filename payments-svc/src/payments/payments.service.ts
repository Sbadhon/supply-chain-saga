import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
  } from '@nestjs/common';
  import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
  import { DataSource, Repository } from 'typeorm';
  import { Payment, PaymentStatusEnum } from './entities/payment.entity';
  import { CreatePaymentDto } from './dto/create-payment.dto';
  
  type TimelineEvent = {
    id: string;
    paymentId: string;
    type: string;
    status: PaymentStatusEnum;
    message?: string;
    at: string; // ISO
  };
  
  @Injectable()
  export class PaymentsService {
    constructor(
      @InjectRepository(Payment)
      private readonly repo: Repository<Payment>,
      @InjectDataSource()
      private readonly ds: DataSource,
    ) {}
  
    async create(dto: CreatePaymentDto, idempotencyKey?: string): Promise<Payment> {
      if (!idempotencyKey) {
        throw new BadRequestException('Missing Idempotency-Key header');
      }
  
      try {
        const existing = await this.repo.findOne({ where: { idempotencyKey } });
        if (existing) return existing;
  
        return await this.ds.transaction(async (trx) => {
          const paymentRepo = trx.getRepository(Payment);
  
          const payment = paymentRepo.create({
            orderId: dto.orderId,
            amount: dto.amount,
            currency: dto.currency,
            methodSummary: dto.methodSummary ?? null,
            provider: dto.provider ?? null,
            provider_ref: dto.provider_ref ?? null,
            status: (dto.status as PaymentStatusEnum) || PaymentStatusEnum.NEW,
            authorizedAmount: null,
            capturedAmount: null,
            refundedAmount: null,
            idempotencyKey,
          });
  
          const saved = await paymentRepo.save(payment);
          return saved;
        });
      } catch (err) {
        if (err instanceof NotFoundException || err instanceof BadRequestException) throw err;
        throw new InternalServerErrorException('Could not create payment');
      }
    }
  
    async getAll(): Promise<Payment[]> {
      return this.repo.find();
    }
  
    async getById(id: string): Promise<Payment | null> {
      try {
        return await this.repo.findOne({ where: { id } });
      } catch (err) {
        if (err instanceof NotFoundException || err instanceof BadRequestException) throw err;
        throw new InternalServerErrorException('Could not find payment');
      }
    }
  
    async getEvents(paymentId: string): Promise<TimelineEvent[]> {
      const exists = await this.repo.findOne({ where: { id: paymentId } });
      if (!exists) throw new NotFoundException('Payment not found');
  
      //TO DO:  plug  outbox/events table here. For now, return a minimal synthetic timeline.
      return [
        {
          id: `${paymentId}-created`,
          paymentId,
          type: 'payment.created',
          status: exists.status,
          message: 'Payment created',
          at: exists.createdAt.toISOString(),
        },
      ];
    }
    
    async retry(paymentId: string): Promise<Payment> {
      const payment = await this.repo.findOne({ where: { id: paymentId } });
      if (!payment) throw new NotFoundException('Payment not found');
  
      if (this.isTerminal(payment.status)) {
        return payment;
      }
  
      payment.status = PaymentStatusEnum.PROCESSING;
      payment.updatedAt = new Date();
      return this.repo.save(payment);
    }
  
    async void(paymentId: string): Promise<Payment> {
      const payment = await this.repo.findOne({ where: { id: paymentId } });
      if (!payment) throw new NotFoundException('Payment not found');
  
      if (
        payment.status === PaymentStatusEnum.CAPTURED ||
        payment.status === PaymentStatusEnum.REFUNDED
      ) {
        return payment;
      }
  
      payment.status = PaymentStatusEnum.VOIDED;
      payment.updatedAt = new Date();
      return this.repo.save(payment);
    }
  
    private isTerminal(status: PaymentStatusEnum) {
      return [
        PaymentStatusEnum.CAPTURED,
        PaymentStatusEnum.REFUNDED,
        PaymentStatusEnum.PARTIALLY_REFUNDED,
        PaymentStatusEnum.VOIDED,
        PaymentStatusEnum.FAILED,
        PaymentStatusEnum.CANCELED,
        PaymentStatusEnum.DISPUTED,
      ].includes(status);
    }
  }
  