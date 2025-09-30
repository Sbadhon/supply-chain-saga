import { createAction, props } from '@ngrx/store';
import { PaymentSummary, PaymentEvent } from './payment.model';

export const createPayment = createAction(
  '[Payments] Create Payment',
  props<{ payment: PaymentSummary; idempotencyKey?: string }>()
);

export const createPaymentSuccess = createAction(
  '[Payments] Create Payment Success',
  props<{ payment: PaymentSummary }>()
);

export const createPaymentFailure = createAction(
  '[Payments] Create Payment Failure',
  props<{ error: string }>()
);

export const loadPayments = createAction('[Payments] Load Payments');

export const loadPaymentsSuccess = createAction(
  '[Payments] Load Payments Success',
  props<{ payments: PaymentSummary[] }>()
);

export const loadPaymentsFailure = createAction(
  '[Payments] Load Payments Failure',
  props<{ error: string }>()
);

export const loadPaymentById = createAction(
  '[Payments] Load Payment By Id',
  props<{ id: string }>()
);

export const loadPaymentByIdSuccess = createAction(
  '[Payments] Load Payment By Id Success',
  props<{ payment: PaymentSummary }>()
);

export const loadPaymentByIdFailure = createAction(
  '[Payments] Load Payment By Id Failure',
  props<{ error: string }>()
);

export const loadPaymentEvents = createAction(
  '[Payments] Load Payment Events',
  props<{ paymentId: string }>()
);

export const loadPaymentEventsSuccess = createAction(
  '[Payments] Load Payment Events Success',
  props<{ paymentId: string; events: PaymentEvent[] }>()
);

export const loadPaymentEventsFailure = createAction(
  '[Payments] Load Payment Events Failure',
  props<{ paymentId: string; error: string }>()
);

export const retryPayment = createAction(
  '[Payments] Retry Payment',
  props<{ paymentId: string }>()
);

export const retryPaymentSuccess = createAction(
  '[Payments] Retry Payment Success',
  props<{ payment: PaymentSummary }>()
);

export const retryPaymentFailure = createAction(
  '[Payments] Retry Payment Failure',
  props<{ error: string }>()
);

export const cancelPayment = createAction(
  '[Payments] Cancel Payment',
  props<{ paymentId: string }>()
);

export const cancelPaymentSuccess = createAction(
  '[Payments] Cancel Payment Success',
  props<{ payment: PaymentSummary }>()
);

export const cancelPaymentFailure = createAction(
  '[Payments] Cancel Payment Failure',
  props<{ error: string }>()
);

export const upsertPayment = createAction(
  '[Payments] Upsert Payment',
  props<{ payment: PaymentSummary }>()
);
