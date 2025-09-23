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

  @Index()
  @Column({ type: 'varchar', length: 64, nullable: true, unique: true })
  idempotencyKey?: string | null;

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
