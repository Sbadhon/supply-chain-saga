import { createAction, props } from '@ngrx/store';
import { Order } from './order.model';

export const createOrder = createAction(
  '[Orders] Create Order',
  props<{ order: Order; idempotencyKey?: string }>()
);

export const createOrderSuccess = createAction(
  '[Orders] Create Order Success',
  props<{ order: Order }>()
);

export const createOrderFailure = createAction(
  '[Orders] Create Order Failure',
  props<{ error: string }>()
);

export const loadOrders = createAction('[Orders] Load Orders');

export const loadOrdersSuccess = createAction(
  '[Orders] Load Orders Success',
  props<{ orders: Order[] }>()
);

export const loadOrdersFailure = createAction(
  '[Orders] Load Orders Failure',
  props<{ error: string }>()
);

export const loadOrderById = createAction(
  '[Orders] Load Order By Id',
  props<{ id: string }>()
);

export const loadOrderByIdSuccess = createAction(
  '[Orders] Load Order By Id Success',
  props<{ order: Order }>()
);

export const loadOrderByIdFailure = createAction(
  '[Orders] Load Order By Id Failure',
  props<{ error: string }>()
);


export const approveOrder = createAction(
  '[Orders] Approve Order By Id',
  props<{ id: string }>()
)

export const approveOrderSuccess = createAction(
  '[Orders] Approve Order By Id Success',
  props<{ order: Order }>()
);

export const approveOrderFailure = createAction(
  '[Orders] Approve Order By Id Failure',
  props<{ error: string }>()
);

export const cancelOrder = createAction(
  '[Orders] Cancel Order By Id',
  props<{ id: string }>()
)

export const cancelOrderSuccess = createAction(
  '[Orders] Cancel Order By Id Success',
  props<{ order: Order }>()
);

export const cancelOrderFailure = createAction(
  '[Orders] Cancel Order By Id Failure',
  props<{ error: string }>()
);

