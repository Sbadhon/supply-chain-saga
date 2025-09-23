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
  id: string;
  
  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  order: Order;

  @Column() 
  sku: string;

  @Column({ type: 'int' }) 
  quantity: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, transformer: numberTransformer })
  unitPrice: number;

  @Column() 
  supplierId: string;

  @CreateDateColumn() 
  createdAt: Date;
  
  @UpdateDateColumn() 
  updatedAt: Date;
}
