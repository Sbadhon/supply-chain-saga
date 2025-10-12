import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'order_commit_progress' })
@Index(['orderId', 'sku'], { unique: true })
export class OrderCommitProgress {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  orderId!: string;

  @Column({ type: 'text' })
  sku!: string;

  // total qty required for this SKU on the order (sum of items for sku)
  @Column({ type: 'int' })
  requiredQty!: number;

  // qty committed so far (accumulated from InventoryCommitted events)
  @Column({ type: 'int', default: 0 })
  committedQty!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
