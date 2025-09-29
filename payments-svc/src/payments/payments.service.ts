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
  
  @Injectable()
  export class PaymentsService {
    constructor(
      @InjectRepository(Payment)
      private readonly repo: Repository<Payment>,
  
      @InjectDataSource()
      private readonly ds: DataSource,
    ) {}
  
    async create(
      dto: CreatePaymentDto,
      idempotencyKey?: string,
    ): Promise<Payment | null> {
      if (!idempotencyKey) {
        throw new BadRequestException('Missing Idempotency-Key header');
      }
  
      try {
        const existing = await this.repo.findOne({
          where: { idempotencyKey },
        });
        if (existing) return existing;
  
        return await this.ds.transaction(async (trx) => {
          const paymentRepo = trx.getRepository(Payment);
          const payment = paymentRepo.create({
            order_id: dto.order_id,
            amount: dto.amount,
            provider_ref: dto.provider_ref,
            status: PaymentStatusEnum.PENDING,
            idempotencyKey,
          });
  
          const saved = await paymentRepo.save(payment);
          return saved;
        });
      }  catch (err) {
        if (err instanceof NotFoundException || err instanceof BadRequestException) throw err;
        throw new InternalServerErrorException('Could not create payment');
      }
    }
  
    async getAll(): Promise<Payment[]> {
      return this.repo.find();
    }
    
    async getById(id: string): Promise<Payment | null> {
      try {
        return await this.repo.findOne({
          where: { id },
        });
      }  catch (err) {
        if (err instanceof NotFoundException || err instanceof BadRequestException) throw err;
        throw new InternalServerErrorException('Could not find payment');
      }
    }
  }
  