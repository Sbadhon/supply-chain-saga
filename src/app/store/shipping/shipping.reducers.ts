import { createReducer, on } from '@ngrx/store';
import * as Actions from './shipping.actions';
import { Shipment, ShipmentEvent } from './shipping.model';

export const SHIPMENTS_FEATURE_KEY = 'shipments';

export interface ShipmentsState {
  shipments: Shipment[];
  selectedShipment?: Shipment;
  eventsByShipmentId: Record<string, ShipmentEvent[]>;
  loading: boolean;
  error?: string;
}

export const initialState: ShipmentsState = {
  shipments: [],
  eventsByShipmentId: {},
  loading: false,
};

export const shipmentsReducer = createReducer(
  initialState,

  on(Actions.loadShipments, (s) => ({ ...s, loading: true, error: undefined })),
  on(Actions.loadShipmentsSuccess, (s, { shipments }) => ({ ...s, shipments, loading: false })),
  on(Actions.loadShipmentsFailure, (s, { error }) => ({ ...s, loading: false, error })),

  on(Actions.loadShipmentById, (s) => ({ ...s, loading: true, error: undefined })),
  on(Actions.loadShipmentByIdSuccess, (s, { shipment }) => {
    const exists = s.shipments.some(x => x.id === shipment.id);
    const shipments = exists
      ? s.shipments.map(x => (x.id === shipment.id ? shipment : x))
      : [...s.shipments, shipment];
    return { ...s, selectedShipment: shipment, shipments, loading: false };
  }),
  on(Actions.loadShipmentByIdFailure, (s, { error }) => ({ ...s, loading: false, error })),

  on(Actions.createShipment, (s) => ({ ...s, loading: true, error: undefined })),
  on(Actions.createShipmentSuccess, (s, { shipment }) => ({
    ...s, shipments: [...s.shipments, shipment], loading: false,
  })),
  on(Actions.createShipmentFailure, (s, { error }) => ({ ...s, loading: false, error })),

  on(Actions.cancelShipment, (s) => ({ ...s, loading: true, error: undefined })),
  on(Actions.cancelShipmentSuccess, (s, { shipment }) => {
    const shipments = s.shipments.some(x => x.id === shipment.id)
      ? s.shipments.map(x => (x.id === shipment.id ? shipment : x))
      : [...s.shipments, shipment];
    const selectedShipment = s.selectedShipment?.id === shipment.id ? shipment : s.selectedShipment;
    return { ...s, shipments, selectedShipment, loading: false };
  }),
  on(Actions.cancelShipmentFailure, (s, { error }) => ({ ...s, loading: false, error })),

  // Events
  on(Actions.loadShipmentEvents, (s) => ({ ...s, loading: true, error: undefined })),
  on(Actions.loadShipmentEventsSuccess, (s, { shipmentId, events }) => ({
    ...s,
    eventsByShipmentId: { ...s.eventsByShipmentId, [shipmentId]: events },
    loading: false,
  })),
  on(Actions.loadShipmentEventsFailure, (s, { error }) => ({ ...s, loading: false, error })),

  // Upsert (socket/webhook)
  on(Actions.upsertShipment, (s, { shipment }) => {
    const shipments = s.shipments.some(x => x.id === shipment.id)
      ? s.shipments.map(x => (x.id === shipment.id ? shipment : x))
      : [...s.shipments, shipment];
    const selectedShipment = s.selectedShipment?.id === shipment.id ? shipment : s.selectedShipment;
    return { ...s, shipments, selectedShipment };
  }),
);
