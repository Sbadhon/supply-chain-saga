import { createSelector } from '@ngrx/store';
import { selectInventoryState } from '../state/inventory.feature';
import { InventoryState } from './inventory.api.reducers';

const selectApi: (state: any) => InventoryState =
  createSelector(selectInventoryState, s => s.api);

export const selectAllInventory       = createSelector(selectApi, state => state.inventories);
export const selectInventoryLoading   = createSelector(selectApi, state => state.loading);
export const selectInventoryError     = createSelector(selectApi, state => state.error);
export const selectSelectedId         = createSelector(selectApi, state => state.selectedId);
export const selectSelectedInventory  = createSelector(selectApi, state => state.selectedInventory);

export const selectItemHistoryMap     = createSelector(selectApi, state => state.historyById);
export const selectItemHistory = (id: string) => createSelector(
  selectItemHistoryMap,
  map => map[id] ?? []
);

export const selectApiFilters = createSelector(selectApi, (state: any) => state.filters);
export const selectApiPage    = createSelector(selectApi, (state: any) => state.page);
