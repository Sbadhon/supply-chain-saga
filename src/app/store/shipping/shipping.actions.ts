import { createAction, props } from '@ngrx/store';
import { Shipment, ShipmentEvent, CreateShipmentDto, CancelShipmentDto } from './shipping.model';

export const loadShipments = createAction('[Shipments] Load All');
export const loadShipmentsSuccess = createAction(
  '[Shipments] Load All Success',
  props<{ shipments: Shipment[] }>()
);
export const loadShipmentsFailure = createAction(
  '[Shipments] Load All Failure',
  props<{ error: string }>()
);

export const loadShipmentById = createAction(
  '[Shipments] Load By Id',
  props<{ id: string }>()
);
export const loadShipmentByIdSuccess = createAction(
  '[Shipments] Load By Id Success',
  props<{ shipment: Shipment }>()
);
export const loadShipmentByIdFailure = createAction(
  '[Shipments] Load By Id Failure',
  props<{ error: string }>()
);

export const createShipment = createAction(
  '[Shipments] Create',
  props<{ dto: CreateShipmentDto }>()
);
export const createShipmentSuccess = createAction(
  '[Shipments] Create Success',
  props<{ shipment: Shipment }>()
);
export const createShipmentFailure = createAction(
  '[Shipments] Create Failure',
  props<{ error: string }>()
);

export const cancelShipment = createAction(
  '[Shipments] Cancel',
  props<{ dto: CancelShipmentDto }>()
);
export const cancelShipmentSuccess = createAction(
  '[Shipments] Cancel Success',
  props<{ shipment: Shipment }>()
);
export const cancelShipmentFailure = createAction(
  '[Shipments] Cancel Failure',
  props<{ error: string }>()
);

// Optional events/timeline
export const loadShipmentEvents = createAction(
  '[Shipments] Load Events',
  props<{ shipmentId: string }>()
);
export const loadShipmentEventsSuccess = createAction(
  '[Shipments] Load Events Success',
  props<{ shipmentId: string; events: ShipmentEvent[] }>()
);
export const loadShipmentEventsFailure = createAction(
  '[Shipments] Load Events Failure',
  props<{ shipmentId: string; error: string }>()
);

export const upsertShipment = createAction(
  '[Shipments] Upsert',
  props<{ shipment: Shipment }>()
);
