import { Expose, Transform, Type } from 'class-transformer';

class OrderItemResponseDto {
  @Expose()
  sku!: string;

  @Expose()
  supplierId?: string;

  @Expose()
  quantity!: number;

  @Expose()
  @Transform(({ value }) => Number(value))
  unitPrice!: number;

  @Expose()
  get lineTotal(): number {
    return Number(this.quantity) * Number(this.unitPrice);
  }
}

export class OrderResponseDto {
  @Expose()
  id!: string;

  @Expose()
  customerId?: string | null;

  @Expose()
  status!: string;

  // @Expose()
  // idempotencyKey!: string;

  @Expose()
  metadata?: Record<string, any>;

  @Expose()
  @Type(() => OrderItemResponseDto)
  items!: OrderItemResponseDto[];

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;

  @Expose()
  get itemsCount(): number {
    return this.items?.length ?? 0;
  }

  @Expose()
  get total(): number {
    return (this.items ?? []).reduce(
      (sum, item: OrderItemResponseDto) =>
        sum + Number(item.quantity) * Number(item.unitPrice),
      0,
    );
  }
}
