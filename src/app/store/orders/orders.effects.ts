import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as OrdersActions from './orders.actions';
import { OrdersService } from './orders.service';
import { catchError, map, mergeMap, of, switchMap, tap } from 'rxjs';
import { makeIdempotencyKey } from '../../core/http/idempotency.util';
import { clearCreateOrderKey } from '@app/core/http/idempotency-storage.util';

@Injectable()
export class OrdersEffects {
  private actions$ = inject(Actions);
  private ordersService = inject(OrdersService);

  loadOrders$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OrdersActions.loadOrders),
      mergeMap(() =>
        this.ordersService.getOrders().pipe(
          map(orders => OrdersActions.loadOrdersSuccess({ orders })),
          catchError(error =>
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
          map(order => OrdersActions.loadOrderByIdSuccess({ order })),
          catchError(error =>
            of(OrdersActions.loadOrderByIdFailure({ error: error.message || 'Load order failed' }))
          )
        )
      )
    )
  );

  createOrder$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OrdersActions.createOrder),
      mergeMap(({ order, idempotencyKey }) => {
        const key = idempotencyKey ?? crypto.randomUUID().replace(/-/g, '');
        return this.ordersService.createOrder(order, key).pipe(
          map(created => OrdersActions.createOrderSuccess({ order: created })),
          catchError(error =>
            of(OrdersActions.createOrderFailure({ error: error.message || 'Create order failed' }))
          )
        );
      })
    )
  );
  
   // On success: clear the key so the next create gets a brand-new key
   createCleanupOnSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(OrdersActions.createOrderSuccess),
        tap(() => clearCreateOrderKey())
      ),
    { dispatch: false }
  )
  
  approve$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OrdersActions.approveOrder),
      switchMap(({ id, idempotencyKey }) => {
        const key = idempotencyKey ?? makeIdempotencyKey();
        return this.ordersService.approveOrder(id, key).pipe(
          map(order => OrdersActions.approveOrderSuccess({ order })),
          catchError(err =>
            of(OrdersActions.approveOrderFailure({ error: err?.error?.message ?? 'Approve failed' }))
          )
        );
      })
    )
  );

  cancel$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OrdersActions.cancelOrder),
      switchMap(({ id, idempotencyKey }) => {
        const key = idempotencyKey ?? makeIdempotencyKey();
        return this.ordersService.cancelOrder(id, key).pipe(
          map(order => OrdersActions.cancelOrderSuccess({ order })),
          catchError(err =>
            of(OrdersActions.cancelOrderFailure({ error: err?.error?.message ?? 'Cancel failed' }))
          )
        );
      })
    )
  );
}
