import { createFeature, combineReducers } from '@ngrx/store';
import {
  inventoryReducer as apiReducer,
  type InventoryState as ApiState,
} from '@app/store/inventory/api/inventory.api.reducers';
import {
  inventoryUIReducer as uiReducer,
  type InventoryUIState as UiState,
} from '@app/store/inventory/ui/inventory.ui.reducer';

export interface InventoryRootState {
  api: ApiState;
  ui: UiState;
}

export const INVENTORY_FEATURE_KEY = 'inventory';

const rootReducer = combineReducers<InventoryRootState>({
  api: apiReducer,
  ui: uiReducer,
});

export const inventoryFeature = createFeature({
  name: INVENTORY_FEATURE_KEY,   // 'inventory'
  reducer: rootReducer,          // single combined reducer
});

export const {
  name: inventoryFeatureKey,
  reducer: inventoryRootReducer, 
  selectInventoryState,          
} = inventoryFeature;
