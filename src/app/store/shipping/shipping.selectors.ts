import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ShipmentsState } from './shipping.reducers';

export const selectShipmentsState =
  createFeatureSelector<ShipmentsState>('shipments');

export const selectAllShipments = createSelector(
  selectShipmentsState,
  (s) => s.shipments
);

export const selectSelectedShipment = createSelector(
  selectShipmentsState,
  (s) => s.selectedShipment
);

export const selectShipmentEvents = (shipmentId: string) =>
  createSelector(selectShipmentsState, (s) => s.eventsByShipmentId[shipmentId] ?? []);

export const selectShipmentsLoading = createSelector(
  selectShipmentsState,
  (s) => s.loading
);

export const selectShipmentsError = createSelector(
  selectShipmentsState,
  (s) => s.error
);
