import { createAction, props } from '@ngrx/store';

export const closeModal = createAction('[Inventory UI] Close Modal');

export const openReceiveModal = createAction(
  '[Inventory] Open Receive Modal',
  props<{ id: string }>()
);
export const openAdjustModal = createAction(
  '[Inventory] Open Adjust Modal',
  props<{ id: string }>()
);
export const openMoveModal = createAction(
  '[Inventory] Open Move Modal',
  props<{ id: string }>()
);
export const openReserveModal = createAction(
  '[Inventory] Open Reserve Modal',
  props<{ id: string }>()
);
