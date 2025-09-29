import { Expose } from 'class-transformer';

export class PaymentResponseDto {
  @Expose() 
  id!: string;

  @Expose() 
  orderId!: string;

  @Expose() 
  status!: string;

  @Expose() 
  amount!: number;

  @Expose() 
  currency!: string;

  @Expose() 
  authorizedAmount?: number;

  @Expose() 
  capturedAmount?: number;

  @Expose() 
  refundedAmount?: number;

  @Expose() 
  methodSummary?: string;

  @Expose() 
  provider?: string;

  @Expose() 
  provider_ref?: string;

  @Expose() 
  providerPaymentId?: string;

  @Expose() createdAt!: Date;

  @Expose() updatedAt!: Date;
}
