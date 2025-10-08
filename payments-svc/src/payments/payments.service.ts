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
import { OutboxService } from 'src/outbox/outbox.service';
  
  type PaymentEventDto = {
    id: string;
    paymentId: string;
    type: string;
    status: PaymentStatusEnum;
    message?: string;
    at: string;
  };
  
  @Injectable()
  export class PaymentsService {
    constructor(
      @InjectRepository(Payment) private readonly repo: Repository<Payment>,
      @InjectDataSource() private readonly ds: DataSource,
      private readonly outbox: OutboxService,
    ) {}
  
    async create(dto: CreatePaymentDto, idempotencyKey?: string): Promise<Payment> {
      if (!idempotencyKey) throw new BadRequestException('Missing Idempotency-Key header');
  
      try {
        const existing = await this.repo.findOne({ where: { idempotencyKey } });
        if (existing) return existing;
  
        return await this.ds.transaction(async trx => {
          const r = trx.getRepository(Payment);
          const p = r.create({
            orderId: dto.orderId,
            amount: dto.amount,
            currency: dto.currency,
            methodSummary: dto.methodSummary ?? null,
            provider: dto.provider ?? null,
            providerPaymentId: dto.providerPaymentId ?? null,
            status: (dto.status as PaymentStatusEnum) ?? PaymentStatusEnum.NEW,
            authorizedAmount: null,
            capturedAmount: null,
            refundedAmount: null,
            idempotencyKey,
          });
          return await r.save(p);
        });
      } catch (err) {
        if (err instanceof BadRequestException || err instanceof NotFoundException) throw err;
        throw new InternalServerErrorException('Could not create payment');
      }
    }
  
    getAll(): Promise<Payment[]> {
      return this.repo.find();
    }
  
    async getById(id: string): Promise<Payment | null> {
      return this.repo.findOne({ where: { id } });
    }
  
    async getEvents(paymentId: string): Promise<PaymentEventDto[]> {
      const exists = await this.repo.findOne({ where: { id: paymentId } });
      if (!exists) throw new NotFoundException('Payment not found');
      //TO DO:  stub timeline; replace with outbox/events store
      return [{
        id: `${paymentId}-created`,
        paymentId,
        type: 'payment.created',
        status: exists.status,
        message: 'Payment created',
        at: exists.createdAt.toISOString(),
      }];
    }
  
    async retry(paymentId: string): Promise<Payment> {
      const p = await this.repo.findOne({ where: { id: paymentId } });
      if (!p) throw new NotFoundException('Payment not found');
  
      if (this.isTerminal(p.status)) return p;
      p.status = PaymentStatusEnum.PROCESSING;
      p.updatedAt = new Date();
      return this.repo.save(p);
    }
  
    async void(paymentId: string): Promise<Payment> {
      const p = await this.repo.findOne({ where: { id: paymentId } });
      if (!p) throw new NotFoundException('Payment not found');
  
      if (p.status === PaymentStatusEnum.CAPTURED || p.status === PaymentStatusEnum.REFUNDED) {
        return p;
      }
      p.status = PaymentStatusEnum.VOIDED;
      p.updatedAt = new Date();
      return this.repo.save(p);
    }
  
    private isTerminal(s: PaymentStatusEnum) {
      return [
        PaymentStatusEnum.CAPTURED,
        PaymentStatusEnum.REFUNDED,
        PaymentStatusEnum.PARTIALLY_REFUNDED,
        PaymentStatusEnum.VOIDED,
        PaymentStatusEnum.FAILED,
        PaymentStatusEnum.CANCELED,
        PaymentStatusEnum.DISPUTED,
      ].includes(s);
    }

    async capture(orderId: string, amount: number, idempotencyKey?: string, traceId?: string) {
      if (!idempotencyKey) throw new BadRequestException('Missing Idempotency-Key');
  
      return this.ds.transaction(async (trx) => {
        const repo = trx.getRepository(Payment);
  
        // Do payment gateway call, persist row, mark as CAPTURED...
        let payment = repo.create({
          orderId,
          amount,
          status: 'CAPTURED',
          idempotencyKey,
        } as Payment);
        await repo.save(payment);
        const p = await this.repo.findOne({ where: { id: payment.id } });
        if (!p) throw new NotFoundException('Payment not found');
  
        await this.outbox.enqueue(trx, {
          aggregateType: 'Payment',
          aggregateId: p.id,
          type: 'PaymentCaptured',
          payload: { paymentId: p.id, orderId, amount, status: p.status },
          headers: { traceId, idempotencyKey },
          idempotencyKey,
        });
  
        return p;
      });
    }
  }
  