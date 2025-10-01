import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { OrderItem } from './order-item.entity';

export enum OrderStatusEnum { 
  PENDING='PENDING', 
  RESERVED='RESERVED',
  PAID='PAID', 
  SHIPPED='SHIPPED', 
  CANCELED='CANCELED' 
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', nullable: true })
  customerId?: string | null;

  @Column({ type: 'varchar', length: 64, name: 'idempotency_key', nullable: false })
  @Index('uq_payments_idempotency_key', { unique: true })
  idempotencyKey!: string;
  
  @Column({ type: 'jsonb', nullable: true })
  metadata?: any;

  @Column({ type: 'enum', enum: OrderStatusEnum, default: OrderStatusEnum.PENDING })
  status: OrderStatusEnum;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: false }) // we'll save items separately
  items?: OrderItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
