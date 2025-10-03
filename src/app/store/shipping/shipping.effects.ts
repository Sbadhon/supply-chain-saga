import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as ActionsSet from './shipping.actions';
import { ShippingService } from './shipping.service';
import { catchError, map, mergeMap, of, switchMap, tap } from 'rxjs';
import {
  clearCreateShipmentKey,
  getCreateShipmentKey,
} from '@app/core/http/idempotency-storage.util';

@Injectable()
export class ShippingEffects {
  private actions$ = inject(Actions);
  private api = inject(ShippingService);

  loadAll$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ActionsSet.loadShipments),
      mergeMap(() =>
        this.api.getAll().pipe(
          map((shipments) => ActionsSet.loadShipmentsSuccess({ shipments })),
          catchError((err) =>
            of(
              ActionsSet.loadShipmentsFailure({
                error: err?.message || 'Load shipments failed',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  loadById$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ActionsSet.loadShipmentById),
      switchMap(({ id }) =>
        this.api.getById(id).pipe(
          map((shipment) => ActionsSet.loadShipmentByIdSuccess({ shipment })),
          catchError((err) =>
            of(
              ActionsSet.loadShipmentByIdFailure({
                error: err?.message || 'Load shipment failed',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  // CREATE with idempotency (reuse sessionStorage key; survive refresh)
  create$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ActionsSet.createShipment),
      mergeMap(({ dto, idempotencyKey }) => {
        const key =
          idempotencyKey ??
          getCreateShipmentKey() ??
          crypto.randomUUID().replace(/-/g, '');
        return this.api.create(dto, key).pipe(
          map((shipment) => ActionsSet.createShipmentSuccess({ shipment })),
          catchError((err) =>
            of(
              ActionsSet.createShipmentFailure({
                error: err?.message || 'Create shipment failed',
              }),
            ),
          ),
        );
      }),
    ),
  );

  // Clear create key on success (keep on failure for retries)
  createCleanupOnSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ActionsSet.createShipmentSuccess),
        tap(() => clearCreateShipmentKey()),
      ),
    { dispatch: false },
  );

  // CANCEL with idempotency (no need to persist; one-off per click)
  cancel$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ActionsSet.cancelShipment),
      mergeMap(({ dto, idempotencyKey }) => {
        const key = idempotencyKey ?? crypto.randomUUID().replace(/-/g, '');
        return this.api.cancel(dto, key).pipe(
          map((shipment) => ActionsSet.cancelShipmentSuccess({ shipment })),
          catchError((err) =>
            of(
              ActionsSet.cancelShipmentFailure({
                error: err?.message || 'Cancel shipment failed',
              }),
            ),
          ),
        );
      }),
    ),
  );

  events$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ActionsSet.loadShipmentEvents),
      switchMap(({ shipmentId }) =>
        this.api.getEvents(shipmentId).pipe(
          map((events) =>
            ActionsSet.loadShipmentEventsSuccess({ shipmentId, events }),
          ),
          catchError((err) =>
            of(
              ActionsSet.loadShipmentEventsFailure({
                shipmentId,
                error: err?.message || 'Load events failed',
              }),
            ),
          ),
        ),
      ),
    ),
  );
}
