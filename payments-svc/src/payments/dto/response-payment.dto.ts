import { Expose } from 'class-transformer';

export class PaymentResponseDto {
  @Expose()
  id!: string;

  @Expose()
  orderId!: string;

  @Expose()
  amount!: number;

  @Expose()
  currency!: string;

  @Expose()
  status!: string;

  @Expose() a;
  uthorizedAmount?: number | null;

  @Expose()
  capturedAmount?: number | null;

  @Expose()
  refundedAmount?: number | null;

  @Expose()
  methodSummary?: string | null;

  @Expose()
  provider?: string | null;

  @Expose()
  providerPaymentId?: string | null;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;
}
