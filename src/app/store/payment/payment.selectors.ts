import { createFeatureSelector, createSelector } from '@ngrx/store';
import { PaymentsState } from './payment.reducers';

export const selectPaymentState = createFeatureSelector<PaymentsState>('payments');

export const selectAllPayments = createSelector(
  selectPaymentState,
  (state) => state.payments
);

export const selectSelectedPayment = createSelector(
  selectPaymentState,
  (state) => state.selectedPayment
);

export const selectPaymentsLoading = createSelector(
  selectPaymentState,
  (state) => state.loading
);

export const selectPaymentsError = createSelector(
  selectPaymentState,
  (state) => state.error
);

export const selectPaymentById = (id: string) => createSelector(
  selectPaymentState,
  (state) => state.payments.find(p => p.id === id)
);

export const selectEventsForPayment = (id: string) => createSelector(
  selectPaymentState,
  (state) => state.eventsByPaymentId[id] ?? []
);
