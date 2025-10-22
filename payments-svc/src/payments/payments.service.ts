import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, DeepPartial, Repository } from 'typeorm';
import { Payment, PaymentStatusEnum } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { OutboxService } from 'src/outbox/outbox.service';
import { TransitionPaymentDto } from './dto/transition-payment.dto';

type PaymentEventDto = {
  id: string;
  paymentId: string;
  type: string;
  status: PaymentStatusEnum;
  message?: string;
  at: string;
};

const toNumber = (v: unknown): number => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isNaN(n) ? 0 : n;
};

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment) private readonly repo: Repository<Payment>,
    @InjectDataSource() private readonly ds: DataSource,
    private readonly outbox: OutboxService,
  ) {}

  // -------------------------------------------------------------
  // Create a new payment
  // -------------------------------------------------------------
  async create(
    dto: CreatePaymentDto,
    idempotencyKey: string,
    traceId?: string,
  ): Promise<Payment> {
    if (!idempotencyKey)
      throw new BadRequestException('Missing Idempotency-Key header');

    try {
      const existing = await this.repo.findOne({ where: { idempotencyKey } });
      if (existing) return existing;

      return await this.ds.transaction(async (trx) => {
        const repo = trx.getRepository(Payment);

        const insert: DeepPartial<Payment> = {
          orderId: dto.orderId,
          amount: toNumber(dto.amount),
          currency: dto.currency ?? 'USD',
          methodSummary: dto.methodSummary ?? null,
          provider: dto.provider ?? null,
          providerPaymentId: dto.providerPaymentId ?? null,
          status: PaymentStatusEnum.NEW,
          authorizedAmount: null,
          capturedAmount: null,
          refundedAmount: null,
          idempotencyKey,
        };

        const payment = repo.create(insert);
        const saved = await repo.save(payment);

        await this.outbox.enqueue(trx, {
          aggregateType: 'Payment',
          aggregateId: saved.id,
          type: 'PaymentCreated',
          payload: {
            paymentId: saved.id,
            orderId: saved.orderId,
            amount: saved.amount,
            currency: saved.currency,
            status: saved.status,
          },
          headers: { traceId, idempotencyKey },
          idempotencyKey,
        });

        return saved;
      });
    } catch (err) {
      throw new InternalServerErrorException(
        'Could not create payment: ' + err,
      );
    }
  }

  // -------------------------------------------------------------
  // Fetch all
  // -------------------------------------------------------------
  getAll(): Promise<Payment[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  // -------------------------------------------------------------
  // Get by ID
  // -------------------------------------------------------------
  async getById(id: string): Promise<Payment | null> {
    return this.repo.findOne({ where: { id } });
  }

  // -------------------------------------------------------------
  // Events (stub)
  // -------------------------------------------------------------
  async getEvents(paymentId: string): Promise<PaymentEventDto[]> {
    const exists = await this.repo.findOne({ where: { id: paymentId } });
    if (!exists) throw new NotFoundException('Payment not found');

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

  // -------------------------------------------------------------
  // Retry (for pending / failed payments)
  // -------------------------------------------------------------
  async retry(paymentId: string): Promise<Payment> {
    const payment = await this.repo.findOne({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Payment not found');

    // skip retry for already-completed or canceled
    if (this.isTerminal(payment.status)) return payment;

    payment.status = PaymentStatusEnum.PROCESSING;
    payment.updatedAt = new Date();

    const saved = await this.repo.save(payment);

    // enqueue event for audit
    await this.outbox.addPaymentEvent({
      paymentId,
      type: 'PaymentRetry',
      message: 'Payment retried',
    });

    return saved;
  }

  // -------------------------------------------------------------
  // Void (cancel authorization)
  // -------------------------------------------------------------
  async void(paymentId: string): Promise<Payment> {
    const payment = await this.repo.findOne({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Payment not found');

    if (payment.status === PaymentStatusEnum.CAPTURED) {
      throw new BadRequestException('Captured payments cannot be voided');
    }

    payment.status = PaymentStatusEnum.VOIDED;
    payment.updatedAt = new Date();

    const saved = await this.repo.save(payment);

    await this.outbox.addPaymentEvent({
      paymentId,
      type: 'PaymentVoided',
      message: 'Payment voided',
    });

    return saved;
  }

  async transition(
    id: string,
    dto: TransitionPaymentDto,
    idempotencyKey?: string,
    traceId?: string,
  ): Promise<Payment> {
    if (!idempotencyKey)
      throw new BadRequestException('Missing Idempotency-Key header');

    return this.ds.transaction(async (trx) => {
      const repo = trx.getRepository(Payment);
      const payment = await repo.findOne({ where: { id } });
      if (!payment) throw new NotFoundException('Payment not found');

      const action = dto.action?.toUpperCase();
      const amount = dto.amount ?? payment.amount;

      switch (action) {
        case 'AUTHORIZE':
          if (payment.status !== PaymentStatusEnum.NEW)
            throw new BadRequestException(
              `Cannot AUTHORIZE from ${payment.status}`,
            );
          payment.status = PaymentStatusEnum.AUTHORIZED;
          payment.authorizedAmount = amount;
          break;

        case 'CANCEL':
          if (payment.status === PaymentStatusEnum.CAPTURED)
            throw new BadRequestException('Cannot cancel captured payment');
          payment.status = PaymentStatusEnum.CANCELED;
          break;

        case 'CAPTURE':
          if (payment.status !== PaymentStatusEnum.AUTHORIZED)
            throw new BadRequestException(
              `Cannot CAPTURE from ${payment.status}`,
            );
          payment.status = PaymentStatusEnum.CAPTURED;
          payment.capturedAmount = amount;
          break;

        case 'REFUND':
          if (payment.status !== PaymentStatusEnum.CAPTURED)
            throw new BadRequestException(
              `Cannot REFUND from ${payment.status}`,
            );
          payment.status = PaymentStatusEnum.CANCELED;
          payment.refundedAmount = amount;
          break;

        default:
          throw new BadRequestException(`Unsupported action: ${action}`);
      }

      payment.updatedAt = new Date();
      const saved = await repo.save(payment);

      await this.outbox.enqueue(trx, {
        aggregateType: 'Payment',
        aggregateId: saved.id,
        type: `Payment${action}`,
        payload: {
          paymentId: saved.id,
          orderId: saved.orderId,
          amount,
          status: saved.status,
        },
        headers: { traceId, idempotencyKey },
        idempotencyKey,
      });

      return saved;
    });
  }

  private isTerminal(s: PaymentStatusEnum): boolean {
    return [
      PaymentStatusEnum.CAPTURED,
      PaymentStatusEnum.VOIDED,
      PaymentStatusEnum.CANCELED,
    ].includes(s);
  }
}
