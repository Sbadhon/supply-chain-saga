import { createSelector } from '@ngrx/store';
import { selectInventoryState } from '../state/inventory.feature';
import { selectAllInventory } from '../api/inventory.api.selectors';

const selectUi = createSelector(selectInventoryState, s => s.ui);

export const selectModal     = createSelector(selectUi, s => s.modal);
export const selectModalKind = createSelector(selectModal, m => m.kind);
export const selectModalId   = createSelector(selectModal, m => m.id);

export const selectModalRow = createSelector(
  selectAllInventory,
  selectModalId,
  (rows, id) => rows.find(r => r.id === id)
);

export const selectFilters = createSelector(selectUi, (s: any) => s.filters);
export const selectPage    = createSelector(selectUi, (s: any) => s.page);
export const selectPageSize= createSelector(selectUi, (s: any) => s.pageSize);
