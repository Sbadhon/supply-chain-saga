export enum ShipmentStatus {
  PENDING = 'PENDING',
  LABEL_CREATED = 'LABEL_CREATED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELED = 'CANCELED',
  FAILED = 'FAILED',
}

export interface Shipment {
  id: string;
  order_id: string;
  status: ShipmentStatus;
  label_url?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShipmentDto {
  order_id: string;
  label_url?: string;
}

export interface CancelShipmentDto {
  id: string;
}

export interface ShipmentEvent {
  id: string;
  shipment_id: string;
  type: string;
  status: ShipmentStatus;
  message?: string;
  at: string;
}
