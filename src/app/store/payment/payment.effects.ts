import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as PaymentsActions from './payment.actions';
import { PaymentService } from './payment.service';
import { catchError, map, mergeMap, of, switchMap, tap } from 'rxjs';
import {
  clearCreatePaymentKey,
  getCreatePaymentKey,
} from '@app/core/http/idempotency-storage.util';

@Injectable()
export class PaymentEffects {
  private actions$ = inject(Actions);
  private paymentService = inject(PaymentService);

  loadPayments$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PaymentsActions.loadPayments),
      mergeMap(() =>
        this.paymentService.getPayments().pipe(
          map((payments) => PaymentsActions.loadPaymentsSuccess({ payments })),
          catchError((error) =>
            of(
              PaymentsActions.loadPaymentsFailure({
                error: error?.message || 'Load payments failed',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  loadPaymentById$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PaymentsActions.loadPaymentById),
      switchMap(({ id }) =>
        this.paymentService.getPaymentById(id).pipe(
          map((payment) => PaymentsActions.loadPaymentByIdSuccess({ payment })),
          catchError((error) =>
            of(
              PaymentsActions.loadPaymentByIdFailure({
                error: error?.message || 'Load Payment failed',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  createPayment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PaymentsActions.createPayment),
      mergeMap(({ payment, idempotencyKey }) => {
        const key =
          idempotencyKey ??
          getCreatePaymentKey() ??
          crypto.randomUUID().replace(/-/g, '');
        return this.paymentService.createPayment(payment, key).pipe(
          map((created) =>
            PaymentsActions.createPaymentSuccess({ payment: created }),
          ),
          catchError((error) =>
            of(
              PaymentsActions.createPaymentFailure({
                error: error?.message || 'Create payment failed',
              }),
            ),
          ),
        );
      }),
    ),
  );

  // Clear the create key on success (keep on failure for retries)
  createPaymentCleanupOnSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(PaymentsActions.createPaymentSuccess),
        tap(() => clearCreatePaymentKey()),
      ),
    { dispatch: false },
  );

  loadPaymentEvents$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PaymentsActions.loadPaymentEvents),
      switchMap(({ paymentId }) =>
        this.paymentService.getEvents(paymentId).pipe(
          map((events) =>
            PaymentsActions.loadPaymentEventsSuccess({ paymentId, events }),
          ),
          catchError((error) =>
            of(
              PaymentsActions.loadPaymentEventsFailure({
                paymentId,
                error: error?.message || 'Load events failed',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  retryPayment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PaymentsActions.retryPayment),
      mergeMap(({ paymentId, idempotencyKey }) => {
        const key = idempotencyKey ?? crypto.randomUUID().replace(/-/g, '');
        return this.paymentService.retry(paymentId, key).pipe(
          map((payment) => PaymentsActions.retryPaymentSuccess({ payment })),
          catchError((error) =>
            of(
              PaymentsActions.retryPaymentFailure({
                error: error?.message || 'Retry failed',
              }),
            ),
          ),
        );
      }),
    ),
  );

  cancelPayment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PaymentsActions.cancelPayment),
      mergeMap(({ paymentId, idempotencyKey }) => {
        const key = idempotencyKey ?? crypto.randomUUID().replace(/-/g, '');
        return this.paymentService.cancel(paymentId, key).pipe(
          map((payment) => PaymentsActions.cancelPaymentSuccess({ payment })),
          catchError((error) =>
            of(
              PaymentsActions.cancelPaymentFailure({
                error: error?.message || 'Cancel failed',
              }),
            ),
          ),
        );
      }),
    ),
  );
}
