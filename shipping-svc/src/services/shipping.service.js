import { v4 as uuid } from 'uuid';
import { tx } from '../db.js';
import * as shippingModel from '../models/shipping.model.js';
import { HttpError } from '../http.js';
import { add as addEvent } from '../models/shipping-events.model.js';
import { addOutboxEvent } from '../outbox.model.js';

export async function getAll() {
  return await shippingModel.getAll();
}

export async function getById(id) {
  return await shippingModel.getById(null, id);
}

export async function create({ order_id, label_url, idempotency_key }) {
  if (!order_id) throw new HttpError(400, 'order_id is required');

  return await tx(async (client) => {
    if (idempotency_key) {
      const existing = await shippingModel.getByIdempotencyKey?.(client, idempotency_key);
      if (existing) return existing;
    }

    const shipment = await shippingModel.create(client, {
      id: uuid(),
      order_id,
      status: 'CREATED',
      label_url: label_url ?? null,
      idempotency_key: idempotency_key ?? null,
    });

    // OUTBOX: publish ShipmentCreated
    await addOutboxEvent(client, {
      aggregateType: 'Shipment',
      aggregateId: shipment.id,
      type: 'ShipmentCreated',
      payload: {
        shipmentId: shipment.id,
        orderId: shipment.order_id,
        status: shipment.status,
        labelUrl: shipment.label_url ?? null,
      },
      headers: {}, // tracing/idempotency headers can be added from controller if desired
      idempotencyKey: idempotency_key ?? null,
    });

    return shipment;
  });
}

export async function cancel({ id }) {
  if (!id) throw new HttpError(400, 'id is required');

  return await tx(async (client) => {
    const existing = await shippingModel.getById(client, id);
    if (!existing) throw new HttpError(404, 'Shipment not found');

    if (['CANCELED', 'SHIPPED'].includes(existing.status)) {
      return existing; // idempotent-by-state
    }

    const updated = await shippingModel.updateStatus(client, id, 'CANCELED');
    await addEvent(client, { shipment_id: id, type: 'shipment.canceled', message: null });

    // OUTBOX: publish ShipmentCanceled
    await addOutboxEvent(client, {
      aggregateType: 'Shipment',
      aggregateId: id,
      type: 'ShipmentCanceled',
      payload: { shipmentId: id, orderId: existing.order_id, status: 'CANCELED' },
      headers: {},
    });

    return updated;
  });
}

// Mark a shipment as SHIPPED (useful for demo/testing)
export async function markShipped({ id }) {
  if (!id) throw new HttpError(400, 'id is required');

  return await tx(async (client) => {
    const existing = await shippingModel.getById(client, id);
    if (!existing) throw new HttpError(404, 'Shipment not found');

    if (existing.status === 'SHIPPED') return existing; // idempotent-by-state

    const updated = await shippingModel.updateStatus(client, id, 'SHIPPED');
    await addEvent(client, { shipment_id: id, type: 'shipment.shipped', message: null });

    // OUTBOX: publish ShipmentShipped
    await addOutboxEvent(client, {
      aggregateType: 'Shipment',
      aggregateId: id,
      type: 'ShipmentShipped',
      payload: {
        shipmentId: id,
        orderId: existing.order_id,
        status: 'SHIPPED',
        shippedAt: new Date().toISOString(),
      },
      headers: {},
    });

    return updated;
  });
}
