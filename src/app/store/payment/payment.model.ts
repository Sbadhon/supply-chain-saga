export enum PaymentStatus {
  NEW = 'NEW',
  PROCESSING = 'PROCESSING',
  REQUIRES_ACTION = 'REQUIRES_ACTION',
  AUTHORIZED = 'AUTHORIZED',
  CAPTURED = 'CAPTURED',
  DECLINED = 'DECLINED',
  FAILED = 'FAILED',
  VOIDED = 'VOIDED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
  DISPUTED = 'DISPUTED',
  CANCELED = 'CANCELED',
}

export interface PaymentSummary {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  authorizedAmount?: number;
  capturedAmount?: number;
  refundedAmount?: number;
  methodSummary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentEvent {
  id: string;
  paymentId: string;
  type: string;       
  status: PaymentStatus;
  message?: string;
  at: string;
}
