import { createReducer, on } from '@ngrx/store';
import * as InventoryUIActions from '@app/store/inventory/ui/inventory.ui.actions';
import * as InventoryApiActions from '@app/store/inventory/api/inventory.api.actions';
export type ModalKind = 'none' | 'receive' | 'adjust' | 'move' | 'reserve';

export interface InventoryUIState {
  modal: { kind: ModalKind; id?: string | null };
}

export const initialUIState: InventoryUIState = {
  modal: { kind: 'none', id: null },
};

export const inventoryUIReducer = createReducer(
  initialUIState,

  on(InventoryUIActions.openReceiveModal, (state, { id }) => ({
    ...state,
    modal: { kind: 'receive' as ModalKind, id },
  })),

  on(InventoryUIActions.openAdjustModal, (state, { id }) => ({
    ...state,
    modal: { kind: 'adjust' as ModalKind, id },
  })),

  on(InventoryUIActions.openMoveModal, (state, { id }) => ({
    ...state,
    modal: { kind: 'move' as ModalKind, id },
  })),
  
  on(InventoryUIActions.openReserveModal, (state, { id }) => ({
    ...state,
    modal: { kind: 'reserve' as ModalKind, id },
  })),

  on(InventoryUIActions.closeModal, () => initialUIState),

  // Close modal after successful API write
  on(
    InventoryApiActions.receiveInventorySuccess,
    InventoryApiActions.adjustInventorySuccess,
    InventoryApiActions.moveInventorySuccess,
    InventoryApiActions.reserveInventorySuccess,
    () => initialUIState,
  ),
);
