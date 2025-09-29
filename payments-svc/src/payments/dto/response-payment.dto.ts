import { Expose } from 'class-transformer';

export class PaymentResponseDto {
  @Expose() 
  id!: string;

  @Expose() 
  order_id: number;

  @Expose() 
  status: string;

  @Expose() 
  amount: number;

  @Expose() 
  provider_ref: string;

  // @Expose() 
  // idempotencyKey!: string;

  @Expose() 
  createdAt!: Date;

  @Expose() 
  updatedAt!: Date;
}
