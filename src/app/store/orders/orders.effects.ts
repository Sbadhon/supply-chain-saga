import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { OrdersService } from './orders.service';
import * as OrdersActions from './orders.actions';
import { catchError, map, mergeMap, of } from 'rxjs';

@Injectable()
export class OrdersEffects {
  private actions$ = inject(Actions);
  private ordersService = inject(OrdersService);
  
  loadOrders$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OrdersActions.loadOrders),
      mergeMap(() =>
        this.ordersService.getOrders().pipe(
          map((orders) => OrdersActions.loadOrdersSuccess({ orders })),
          catchError((error) =>
            of(OrdersActions.loadOrdersFailure({ error: error.message || 'Load orders failed' }))
          )
        )
      )
    )
  );

  loadOrderById$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OrdersActions.loadOrderById),
      mergeMap(({ id }) =>
        this.ordersService.getOrderById(id).pipe(
          map((order) => OrdersActions.loadOrderByIdSuccess({ order })),
          catchError((error) =>
            of(OrdersActions.loadOrderByIdFailure({ error: error.message || 'Load order failed' }))
          )
        )
      )
    )
  );

  createOrder$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OrdersActions.createOrder),
      mergeMap(({ order, idempotencyKey }) =>
        this.ordersService.createOrder(order, idempotencyKey || '').pipe(
          map((createdOrder) => OrdersActions.createOrderSuccess({ order: createdOrder })),
          catchError((error) =>
            of(OrdersActions.createOrderFailure({ error: error.message || 'Create order failed' }))
          )
        )
      )
    )
  );
}
