import { tx } from '../db.js';
import * as Inv from '../models/inventory.model.js';
import { HttpError } from '../http.js';

export async function getInventory(sku) {
  return await Inv.getBySku(null, sku);
}

// Reserve: available -> reserved
export async function reserveStock({ orderId, sku, quantity }) {
  if (!orderId || !sku || !Number.isInteger(quantity) || quantity <= 0) {
    throw new HttpError(400, 'Invalid payload');
  }

  return tx(async (client) => {
    const row = await Inv.lockBySku(client, sku);
    if (!row) throw new HttpError(404, 'SKU not found');

    if (row.available_qty < quantity) {
      return { success: false, reason: 'INSUFFICIENT_STOCK', available: row.available_qty };
    }

    await Inv.setQuantities(client, sku, { availableDelta: -quantity, reservedDelta: +quantity });
    return { success: true, orderId, sku, reserved: quantity };
  });
}

// Commit: reserved is consumed (reserved -> 0 change; treat as finalized)
export async function commitReservation({ orderId, sku, quantity }) {
  if (!orderId || !sku || !Number.isInteger(quantity) || quantity <= 0) {
    throw new HttpError(400, 'Invalid payload');
  }

  return tx(async (client) => {
    const row = await Inv.lockBySku(client, sku);
    if (!row) throw new HttpError(404, 'SKU not found');

    if (row.reserved_qty < quantity) {
      return { success: false, reason: 'NOT_ENOUGH_RESERVED', reserved: row.reserved_qty };
    }

    await Inv.setQuantities(client, sku, { reservedDelta: -quantity });
    return { success: true, orderId, sku, committed: quantity };
  });
}

// Release: reserved -> available
export async function releaseReservation({ orderId, sku, quantity }) {
  if (!orderId || !sku || !Number.isInteger(quantity) || quantity <= 0) {
    throw new HttpError(400, 'Invalid payload');
  }

  return tx(async (client) => {
    const row = await Inv.lockBySku(client, sku);
    if (!row) throw new HttpError(404, 'SKU not found');

    if (row.reserved_qty < quantity) {
      return { success: false, reason: 'NOT_ENOUGH_RESERVED', reserved: row.reserved_qty };
    }

    await Inv.setQuantities(client, sku, { availableDelta: +quantity, reservedDelta: -quantity });
    return { success: true, orderId, sku, released: quantity };
  });
}

export async function adjustStock({ sku, availableDelta = 0, reservedDelta = 0 }) {
  if (!sku || (!Number.isInteger(availableDelta) && !Number.isInteger(reservedDelta))) {
    throw new HttpError(400, 'Invalid payload');
  }

  return tx(async (client) => {
    const row = await Inv.lockBySku(client, sku);
    if (!row) throw new HttpError(404, 'SKU not found');

    const updated = await Inv.setQuantities(client, sku, { availableDelta, reservedDelta });
    return { success: true, sku, available_qty: updated.available_qty, reserved_qty: updated.reserved_qty };
  });
}
