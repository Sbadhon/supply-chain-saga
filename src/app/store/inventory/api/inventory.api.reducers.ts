import { createReducer, on } from '@ngrx/store';
import * as A from './inventory.api.actions';
import { Inventory, InventoryEvent, InventoryFilters } from './inventory.model';

export const INVENTORY_FEATURE_KEY = 'inventory';

export interface InventoryState {
  inventories: Inventory[];
  selectedId?: string | null;
  selectedInventory?: Inventory;

  historyById: Record<string, InventoryEvent[]>;

  loading: boolean;
  error?: string;

  // client-side UI filters/pagination (optional if server-driven)
  filters: InventoryFilters;
  page: number;
  pageSize: number; // for client paging in UI; adjust if you go server-side
}

export const initialState: InventoryState = {
  inventories: [],
  selectedId: null,
  selectedInventory: undefined,
  historyById: {},

  loading: false,
  error: undefined,

  filters: {
    status: 'ALL',
    supplier: 'ALL',
    location: 'ALL',
    category: 'ALL',
    search: '',
  },
  page: 1,
  pageSize: 20,
};

function upsert(list: Inventory[], updated: Inventory) {
  const i = list.findIndex((x) => x.id === updated.id);
  if (i === -1) return [...list, updated];
  const copy = [...list];
  copy[i] = updated;
  return copy;
}

export const inventoryReducer = createReducer(
  initialState,

  // -------- Load list --------
  on(A.loadInventory, (s) => ({ ...s, loading: true, error: undefined })),
  on(A.loadInventorySuccess, (s, { inventories }) => ({
    ...s,
    loading: false,
    inventories,
  })),
  on(A.loadInventoryFailure, (s, { error }) => ({
    ...s,
    loading: false,
    error,
  })),

  // -------- Selection / Quick view --------
  on(A.selectInventory, (s, { id }) => ({
    ...s,
    selectedId: id,
    selectedInventory: s.inventories.find((x) => x.id === id),
  })),
  on(A.clearSelection, (s) => ({
    ...s,
    selectedId: null,
    selectedInventory: undefined,
  })),

  // -------- History for Quick view --------
  on(A.loadItemHistory, (s) => ({ ...s, loading: true, error: undefined })),
  // on(A.loadItemHistorySuccess, (s, { id, events }) => ({
  //   ...s,
  //   loading: false,
  //   historyById: { ...s.historyById, [id]: events },
  // })),
  on(A.loadItemHistoryFailure, (s, { error }) => ({
    ...s,
    loading: false,
    error,
  })),

  // -------- Filters / Pagination (client-side) --------
  on(A.setInventoryFilters, (s, { ...filters }) => ({
    ...s,
    filters: { ...s.filters, ...filters },
    page: 1, // reset to first page when filters change
  })),
  on(A.setInventoryPage, (s, { page }) => ({ ...s, page })),

  // -------- Reserve --------
  on(A.reserveInventory, (s) => ({ ...s, loading: true, error: undefined })),
  on(A.reserveInventorySuccess, (s, { updated }) => {
    const inventories = upsert(s.inventories, updated);
    const selectedInventory =
      s.selectedId === updated.id ? updated : s.selectedInventory;
    return { ...s, loading: false, inventories, selectedInventory };
  }),
  on(A.reserveInventoryFailure, (s, { error }) => ({
    ...s,
    loading: false,
    error,
  })),

  // -------- Receive (commit) --------
  on(A.receiveInventory, (s) => ({ ...s, loading: true, error: undefined })),
  on(A.receiveInventorySuccess, (s, { updated }) => {
    const inventories = upsert(s.inventories, updated);
    const selectedInventory =
      s.selectedId === updated.id ? updated : s.selectedInventory;
    return { ...s, loading: false, inventories, selectedInventory };
  }),
  on(A.receiveInventoryFailure, (s, { error }) => ({
    ...s,
    loading: false,
    error,
  })),

  // -------- Adjust --------
  on(A.adjustInventory, (s) => ({ ...s, loading: true, error: undefined })),
  on(A.adjustInventorySuccess, (s, { updated }) => {
    const inventories = upsert(s.inventories, updated);
    const selectedInventory =
      s.selectedId === updated.id ? updated : s.selectedInventory;
    return { ...s, loading: false, inventories, selectedInventory };
  }),
  on(A.adjustInventoryFailure, (s, { error }) => ({
    ...s,
    loading: false,
    error,
  })),

  // -------- Move --------
  on(A.moveInventory, (s) => ({ ...s, loading: true, error: undefined })),
  on(A.moveInventorySuccess, (s, { updated }) => {
    const inventories = upsert(s.inventories, updated);
    const selectedInventory =
      s.selectedId === updated.id ? updated : s.selectedInventory;
    return { ...s, loading: false, inventories, selectedInventory };
  }),
  on(A.moveInventoryFailure, (s, { error }) => ({
    ...s,
    loading: false,
    error,
  })),

  // -------- Release (optional) --------
  on(A.releaseInventory, (s) => ({ ...s, loading: true, error: undefined })),
  on(A.releaseInventorySuccess, (s, { updated }) => {
    const inventories = upsert(s.inventories, updated);
    const selectedInventory =
      s.selectedId === updated.id ? updated : s.selectedInventory;
    return { ...s, loading: false, inventories, selectedInventory };
  }),
  on(A.releaseInventoryFailure, (s, { error }) => ({
    ...s,
    loading: false,
    error,
  })),
);
