import { Expose, Type } from 'class-transformer';

class OrderItemResponseDto {
  @Expose()
  sku!: string;

  @Expose()
  quantity!: number;

  @Expose()
  unitPrice!: string;
}

export class OrderResponseDto {
  @Expose()
  id!: string;

  @Expose()
  customerId?: string;

  @Expose()
  status!: string;

  @Expose()
  idempotencyKey!: string;

  @Expose()
  metadata?: Record<string, any>;

  @Expose()
  @Type(() => OrderItemResponseDto)
  items!: OrderItemResponseDto[];

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;
}
