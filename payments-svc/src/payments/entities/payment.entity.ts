import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    Index,
    CreateDateColumn,
    UpdateDateColumn,
  } from 'typeorm';
  
  export enum PaymentStatusEnum {
    NEW = 'NEW',
    PROCESSING = 'PROCESSING',
    REQUIRES_ACTION = 'REQUIRES_ACTION',
    AUTHORIZED = 'AUTHORIZED',
    CAPTURED = 'CAPTURED',
    DECLINED = 'DECLINED',
    FAILED = 'FAILED',
    VOIDED = 'VOIDED',
    REFUNDED = 'REFUNDED',
    PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
    DISPUTED = 'DISPUTED',
    CANCELED = 'CANCELED',
  }
  
  @Entity('payments')
  export class Payment {
    @PrimaryGeneratedColumn('uuid')
    id!: string;
  
    @Column({ name: 'order_id', type: 'varchar', length: 64 })
    orderId!: string;
  
    @Column({ type: 'enum', enum: PaymentStatusEnum, default: PaymentStatusEnum.NEW })
    status!: PaymentStatusEnum;
  
    @Column('numeric', { precision: 12, scale: 2 })
    amount!: number;
  
    @Column({ type: 'varchar', length: 3 })
    currency!: string;
  
    @Column('numeric', { precision: 12, scale: 2, nullable: true, name: 'authorized_amount' })
    authorizedAmount?: number | null;
  
    @Column('numeric', { precision: 12, scale: 2, nullable: true, name: 'captured_amount' })
    capturedAmount?: number | null;
  
    @Column('numeric', { precision: 12, scale: 2, nullable: true, name: 'refunded_amount' })
    refundedAmount?: number | null;
  
    @Column({ type: 'varchar', length: 128, nullable: true, name: 'method_summary' })
    methodSummary?: string | null;
  
    @Column({ type: 'varchar', length: 32, nullable: true })
    provider?: string | null;
  
    @Column({ type: 'varchar', length: 128, nullable: true, name: 'provider_payment_id' })
    providerPaymentId?: string | null;
  
    @Column({ type: 'varchar', length: 64, name: 'idempotency_key', nullable: false })
    @Index('uq_payments_idempotency_key', { unique: true })
    idempotencyKey!: string;    
  
    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;
  
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
  }
  