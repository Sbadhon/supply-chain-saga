import { createFeatureSelector, createSelector } from '@ngrx/store';
import { OrdersState } from './orders.reducers';

export const selectOrdersState = createFeatureSelector<OrdersState>('orders');

export const selectAllOrders = createSelector(
  selectOrdersState,
  (state) => state.orders
);

export const selectSelectedOrder = createSelector(
  selectOrdersState,
  (state) => state.selectedOrder
);

export const selectOrdersLoading = createSelector(
  selectOrdersState,
  (state) => state.loading
);

export const selectOrdersError = createSelector(
  selectOrdersState,
  (state) => state.error
);
