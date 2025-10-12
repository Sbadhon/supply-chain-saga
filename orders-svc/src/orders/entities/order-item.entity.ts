import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Order } from './order.entity';

export const numberTransformer = {
  to: (v: number) => v,
  from: (v: string | null) => (v == null ? null : Number(v)),
};

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Order, (o) => o.items, { onDelete: 'CASCADE' })
  order!: Order;

  @Column({ type: 'text' })
  sku!: string;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({ type: 'numeric' })
  unitPrice!: number;

  @Column({ type: 'text', nullable: true })
  supplierId?: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
