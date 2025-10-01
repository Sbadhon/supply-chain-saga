import { v4 as uuid } from 'uuid';
import { tx } from '../db.js';
import * as shippingModel from '../models/shipping.model.js';
import { HttpError } from '../http.js';
import { add as addEvent } from '../models/shipping-events.model.js';

export async function getAll() {
  return await shippingModel.getAll();
}

export async function getById(id) {
  return await shippingModel.getById(null, id);
}

export async function create({ order_id, label_url, idempotency_key }) {
  if (!order_id) throw new HttpError(400, 'order_id is required');

  return await tx(async (client) => {
    // check for existing by idempotency_key (defense-in-depth)
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

    await addEvent(client, { shipment_id: shipment.id, type: 'shipment.created', message: null });
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
    return updated;
  });
}
