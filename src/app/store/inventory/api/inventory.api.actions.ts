import { createAction, props } from '@ngrx/store';
import { Inventory } from './inventory.model';

export const loadInventory = createAction('[Inventory] Load Inventory');

export const loadInventorySuccess = createAction(
  '[Inventory] Load Inventory Success',
  props<{ inventories: Inventory[] }>()
);
export const loadInventoryFailure = createAction(
  '[Inventory] Load Inventory Failure',
  props<{ error: string }>()
);

export const selectInventory = createAction(
  '[Inventory] Select Inventory',
  props<{ id: string }>()
);

export const clearSelection = createAction('[Inventory] Clear Selection');

export const updateInventory = createAction(
  '[Inventory] Update Inventory',
  props<{
    id: string;
    patch: {
      supplierId: string | null;
      location: string | null;
      reorderPoint: number | null;
      inbound: number;
    };
  }>()
);

export const updateInventorySuccess = createAction(
  '[Inventory] Update Inventory Success',
  props<{
    id: string;
    events: Array<{
      id: string;
      type: string;
      at: string;
      meta?: any;
    }>;
  }>()
);

export const updateInventoryFailure = createAction(
  '[Inventory] Update Inventory Failure',
  props<{
    id: string;
    error: string;
  }>()
);


export const loadItemHistory = createAction(
  '[Inventory] Load Item History',
  props<{ id: string }>()
);

export const loadItemHistorySuccess = createAction(
  '[Inventory] Load Item History Success',
  props<{ id: string; events: Array<{ id: string; type: string; at: string; meta?: any }> }>()
);

export const loadItemHistoryFailure = createAction(
  '[Inventory] Load Item History Failure',
  props<{ id: string; error: string }>()
);

export const setInventoryFilters = createAction(
  '[Inventory] Set Filters',
  props<{ search?: string; status?: 'ALL'|'LOW'|'OUT'|'OK'; supplier?: string|'ALL'; location?: string|'ALL'; category?: string|'ALL' }>()
);

export const setInventoryPage = createAction(
  '[Inventory] Set Page',
  props<{ page: number }>()
);

export const reserveInventory = createAction(
  '[Inventory] Reserve Inventory',
  props<{ id: string; qty: number; orderId?: string; idempotencyKey?: string }>()
);

export const reserveInventorySuccess = createAction(
  '[Inventory] Reserve Inventory Success',
  props<{ updated: Inventory }>()
);

export const reserveInventoryFailure = createAction(
  '[Inventory] Reserve Inventory Failure',
  props<{ error: string }>()
);


export const receiveInventory = createAction(
  '[Inventory] Receive Inventory',
  props<{ id: string; qty: number; source?: string; idempotencyKey?: string }>()
);

export const receiveInventorySuccess = createAction(
  '[Inventory] Receive Inventory Success',
  props<{ updated: Inventory }>()
);

export const receiveInventoryFailure = createAction(
  '[Inventory] Receive Inventory Failure',
  props<{ error: string }>()
);

export const adjustInventory = createAction(
  '[Inventory] Adjust Inventory',
  props<{ id: string; delta: number; reason?: string; idempotencyKey?: string }>()
);

export const adjustInventorySuccess = createAction(
  '[Inventory] Adjust Inventory Success',
  props<{ updated: Inventory }>()
);

export const adjustInventoryFailure = createAction(
  '[Inventory] Adjust Inventory Failure',
  props<{ error: string }>()
);

export const moveInventory = createAction(
  '[Inventory] Move Inventory',
  props<{ id: string; qty: number; fromLocation: string; toLocation: string; idempotencyKey?: string }>()
);

export const moveInventorySuccess = createAction(
  '[Inventory] Move Inventory Success',
  props<{ updated: Inventory }>()
);

export const moveInventoryFailure = createAction(
  '[Inventory] Move Inventory Failure',
  props<{ error: string }>()
);

export const releaseInventory = createAction(
  '[Inventory] Release Inventory',
  props<{ id: string; qty: number; orderId?: string; idempotencyKey?: string }>()
);

export const releaseInventorySuccess = createAction(
  '[Inventory] Release Inventory Success',
  props<{ updated: Inventory }>()
);

export const releaseInventoryFailure = createAction(
  '[Inventory] Release Inventory Failure',
  props<{ error: string }>()
);
