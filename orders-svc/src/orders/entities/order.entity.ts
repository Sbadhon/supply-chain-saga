import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { OrderItem } from './order-item.entity';

export type OrderStatus = 'PENDING' | 'RESERVED' | 'AUTHORIZED' | 'READY_TO_SHIP' | 'COMPLETED' | 'CANCELLED';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', nullable: true })
  customerId?: string | null;

  @Column({ type: 'varchar', length: 24, default: 'PENDING' })
  status: OrderStatus;

  @Index()
  @Column({ type: 'varchar', length: 64, nullable: true, unique: true })
  idempotencyKey?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: any;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: false }) // we'll save items separately
  items?: OrderItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
