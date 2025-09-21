import { createReducer, on } from '@ngrx/store';
import * as OrdersActions from './orders.actions';
import { Order } from './order.model';

export interface OrdersState {
  orders: Order[];
  selectedOrder?: Order;
  loading: boolean;
  error?: string;
}

export const initialState: OrdersState = {
  orders: [],
  loading: false,
};

export const ordersReducer = createReducer(
  initialState,

  // Load all orders
  on(OrdersActions.loadOrders, (state) => ({
    ...state,
    loading: true,
    error: undefined,
  })),

  on(OrdersActions.loadOrdersSuccess, (state, { orders }) => ({
    ...state,
    orders,
    loading: false,
    error: undefined,
  })),

  on(OrdersActions.loadOrdersFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Load order by id
  on(OrdersActions.loadOrderById, (state) => ({
    ...state,
    loading: true,
    error: undefined,
  })),

  on(OrdersActions.loadOrderByIdSuccess, (state, { order }) => ({
    ...state,
    selectedOrder: order,
    loading: false,
    error: undefined,
  })),

  on(OrdersActions.loadOrderByIdFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Create order
  on(OrdersActions.createOrder, (state) => ({
    ...state,
    loading: true,
    error: undefined,
  })),

  on(OrdersActions.createOrderSuccess, (state, { order }) => ({
    ...state,
    orders: [...state.orders, order],
    loading: false,
    error: undefined,
  })),

  on(OrdersActions.createOrderFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  }))
);
