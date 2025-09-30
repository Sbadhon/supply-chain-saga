import { createReducer, on } from '@ngrx/store';
import * as PaymentsActions from './payment.actions';
import { PaymentSummary, PaymentEvent } from './payment.model';

export interface PaymentsState {
  payments: PaymentSummary[];
  selectedPayment?: PaymentSummary;
  eventsByPaymentId: Record<string, PaymentEvent[]>;
  loading: boolean;
  error?: string;
}

export const initialState: PaymentsState = {
  payments: [],
  eventsByPaymentId: {},
  loading: false,
};

export const paymentsReducer = createReducer(
  initialState,

  on(PaymentsActions.loadPayments, (s) => ({
    ...s,
    loading: true,
    error: undefined,
  })),
  on(PaymentsActions.loadPaymentsSuccess, (s, { payments }) => ({
    ...s,
    payments,
    loading: false,
  })),
  on(PaymentsActions.loadPaymentsFailure, (s, { error }) => ({
    ...s,
    loading: false,
    error,
  })),

  on(PaymentsActions.loadPaymentById, (s) => ({
    ...s,
    loading: true,
    error: undefined,
  })),
  on(PaymentsActions.loadPaymentByIdSuccess, (s, { payment }) => {
    const payments = s.payments.some((p) => p.id === payment.id)
      ? s.payments.map((p) => (p.id === payment.id ? payment : p))
      : [...s.payments, payment];
    return { ...s, selectedPayment: payment, payments, loading: false };
  }),
  on(PaymentsActions.loadPaymentByIdFailure, (s, { error }) => ({
    ...s,
    loading: false,
    error,
  })),

  on(PaymentsActions.createPayment, (s) => ({
    ...s,
    loading: true,
    error: undefined,
  })),
  on(PaymentsActions.createPaymentSuccess, (s, { payment }) => ({
    ...s,
    payments: [...s.payments, payment],
    loading: false,
  })),
  on(PaymentsActions.createPaymentFailure, (s, { error }) => ({
    ...s,
    loading: false,
    error,
  })),

  on(PaymentsActions.loadPaymentEvents, (s) => ({
    ...s,
    loading: true,
    error: undefined,
  })),
  on(PaymentsActions.loadPaymentEventsSuccess, (s, { paymentId, events }) => ({
    ...s,
    eventsByPaymentId: { ...s.eventsByPaymentId, [paymentId]: events },
    loading: false,
  })),
  on(PaymentsActions.loadPaymentEventsFailure, (s, { error }) => ({
    ...s,
    loading: false,
    error,
  })),

  on(PaymentsActions.retryPayment, PaymentsActions.cancelPayment, (s) => ({
    ...s,
    loading: true,
    error: undefined,
  })),
  on(
    PaymentsActions.retryPaymentSuccess,
    PaymentsActions.cancelPaymentSuccess,
    (s, { payment }) => {
      const payments = s.payments.some((p) => p.id === payment.id)
        ? s.payments.map((p) => (p.id === payment.id ? payment : p))
        : [...s.payments, payment];
      const selectedPayment =
        s.selectedPayment?.id === payment.id ? payment : s.selectedPayment;
      return { ...s, payments, selectedPayment, loading: false };
    },
  ),
  on(
    PaymentsActions.retryPaymentFailure,
    PaymentsActions.cancelPaymentFailure,
    (s, { error }) => ({ ...s, loading: false, error }),
  ),

  on(PaymentsActions.upsertPayment, (s, { payment }) => {
    const payments = s.payments.some((p) => p.id === payment.id)
      ? s.payments.map((p) => (p.id === payment.id ? payment : p))
      : [...s.payments, payment];
    const selectedPayment =
      s.selectedPayment?.id === payment.id ? payment : s.selectedPayment;
    return { ...s, payments, selectedPayment };
  }),
);
