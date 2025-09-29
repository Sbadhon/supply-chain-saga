import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as InventoryAPIActions from '@app/store/inventory/api/inventory.api.actions';
import * as InventoryAPISelectors from '@app/store/inventory/api/inventory.api.selectors';
import { catchError, map, mergeMap, of, withLatestFrom } from 'rxjs';
import { InventoryService } from './inventory.service';
import { Store } from '@ngrx/store';
import { ReleaseRequest } from './inventory.model';

const errMsg = (e: any, fallback: string) =>
  e?.error?.message ?? e?.message ?? fallback;

@Injectable()
export class InventoryEffects {
  private actions$ = inject(Actions);
  private inventoryService = inject(InventoryService);
  private store = inject(Store);

  loadInventories$ = createEffect(() =>
    this.actions$.pipe(
      ofType(InventoryAPIActions.loadInventory),
      mergeMap(() =>
        this.inventoryService.getInventory().pipe(
          map((inventories) =>
            InventoryAPIActions.loadInventorySuccess({ inventories }),
          ),
          catchError((e) =>
            of(
              InventoryAPIActions.loadInventoryFailure({
                error: errMsg(e, 'Failed to load inventory'),
              }),
            ),
          ),
        ),
      ),
    ),
  );

  loadItemHistory$ = createEffect(() =>
    this.actions$.pipe(
      ofType(InventoryAPIActions.loadItemHistory),
      mergeMap(({ id }) =>
        this.inventoryService.getHistory(id).pipe(
          map((events) =>
            InventoryAPIActions.loadItemHistorySuccess({ id, events }),
          ),
          catchError((e) =>
            of(
              InventoryAPIActions.loadItemHistoryFailure({
                id,
                error: errMsg(e, 'Failed to load history'),
              }),
            ),
          ),
        ),
      ),
    ),
  );

  receive$ = createEffect(() =>
    this.actions$.pipe(
      ofType(InventoryAPIActions.receiveInventory),
      withLatestFrom(
        this.store.select(InventoryAPISelectors.selectAllInventory),
      ),
      mergeMap(([{ id, qty, source }, rows]) => {
        const row = rows.find((r) => r.id === id);
        if (!row)
          return of(
            InventoryAPIActions.receiveInventoryFailure({
              error: 'Item not found',
            }),
          );
        const body = {
          orderId: source || undefined,
          sku: row.sku,
          quantity: qty,
          location: row.location ?? 'MAIN',
        };
        return this.inventoryService.commit(body).pipe(
          map(() => InventoryAPIActions.loadInventory()),
          catchError((err) =>
            of(
              InventoryAPIActions.receiveInventoryFailure({
                error: err?.error?.detail ?? 'Receive failed',
              }),
            ),
          ),
        );
      }),
    ),
  );

  /** ADJUST */
  adjust$ = createEffect(() =>
    this.actions$.pipe(
      ofType(InventoryAPIActions.adjustInventory),
      withLatestFrom(
        this.store.select(InventoryAPISelectors.selectAllInventory),
      ),
      mergeMap(([{ id, delta, reason }, rows]) => {
        const row = rows.find((r) => r.id === id);
        if (!row)
          return of(
            InventoryAPIActions.adjustInventoryFailure({
              error: 'Item not found',
            }),
          );
        const body = {
          sku: row.sku,
          location: row.location ?? 'MAIN',
          availableDelta: delta,
          reservedDelta: 0,
          reason,
        };
        return this.inventoryService.adjust(body).pipe(
          map(() => InventoryAPIActions.loadInventory()),
          catchError((err) =>
            of(
              InventoryAPIActions.adjustInventoryFailure({
                error: err?.error?.detail ?? 'Adjust failed',
              }),
            ),
          ),
        );
      }),
    ),
  );

  move$ = createEffect(() =>
    this.actions$.pipe(
      ofType(InventoryAPIActions.moveInventory),
      mergeMap(({ id, qty, fromLocation, toLocation }) =>
        this.inventoryService.move({ id, qty, fromLocation, toLocation }).pipe(
          map(() => InventoryAPIActions.loadInventory()),
          catchError((err) =>
            of(
              InventoryAPIActions.moveInventoryFailure({
                error: err?.error?.detail ?? 'Move failed',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  reserve$ = createEffect(() =>
    this.actions$.pipe(
      ofType(InventoryAPIActions.reserveInventory),
      withLatestFrom(
        this.store.select(InventoryAPISelectors.selectAllInventory),
      ),
      mergeMap(([{ id, qty, orderId }, rows]) => {
        const row = rows.find((r) => r.id === id);
        if (!row)
          return of(
            InventoryAPIActions.reserveInventoryFailure({
              error: 'Item not found',
            }),
          );
        const body = {
          orderId: orderId || undefined,
          sku: row.sku,
          quantity: qty,
          location: row.location ?? 'MAIN',
        };
        return this.inventoryService.reserve(body).pipe(
          map(() => InventoryAPIActions.loadInventory()),
          catchError((err) =>
            of(
              InventoryAPIActions.reserveInventoryFailure({
                error: err?.error?.detail ?? 'Reserve failed',
              }),
            ),
          ),
        );
      }),
    ),
  );

  release$ = createEffect(() =>
    this.actions$.pipe(
      ofType(InventoryAPIActions.releaseInventory),
      withLatestFrom(
        this.store.select(InventoryAPISelectors.selectAllInventory),
      ),
      mergeMap(([{ id, qty, orderId }, rows]) => {
        const row = rows.find((r) => r.id === id);
        if (!row)
          return of(
            InventoryAPIActions.releaseInventoryFailure({
              error: 'Item not found',
            }),
          );

        const body = {
          orderId: orderId || undefined,
          sku: row.sku,
          quantity: qty,
          location: row.location ?? 'MAIN',
        } as ReleaseRequest;

        return this.inventoryService.release(body).pipe(
          map(() => InventoryAPIActions.loadInventory()),
          catchError((err) =>
            of(
              InventoryAPIActions.releaseInventoryFailure({
                error: err?.error?.detail ?? 'Release failed',
              }),
            ),
          ),
        );
      }),
    ),
  );
}
