import { tx } from '../db.js';
import * as Inv from '../models/inventory.model.js';
import { listByInventoryId, add as addEvent } from '../models/inventory-events.model.js'; // ✅ events helpers
import { HttpError } from '../http.js';

/* ======================
 * Reads
 * ====================== */

export async function getAll() {
  return await Inv.getAll();
}

/** GET /v1/inventory/:sku — legacy: MAIN location row */
export async function getInventory(sku) {
  return await Inv.getBySku(null, sku); // MAIN
}

/* ======================
 * Reserve / Commit / Release (by sku + location)
 * ====================== */

export async function reserveStock({ orderId, sku, quantity, location = 'MAIN' }) {
  if (!orderId || !sku || !Number.isInteger(quantity) || quantity <= 0) {
    throw new HttpError(400, 'Invalid payload');
  }

  return tx(async (client) => {
    const row = await Inv.lockBySkuAndLocation(client, sku, location);
    if (!row) throw new HttpError(404, 'SKU/location not found');

    if ((row.available_qty ?? 0) < quantity) {
      return { success: false, reason: 'INSUFFICIENT_STOCK', available: row.available_qty };
    }

    const updated = await Inv.setQuantitiesById(client, row.id, {
      availableDelta: -quantity,
      reservedDelta: +quantity,
    });

    await addEvent(client, {
      inventory_id: row.id,
      sku,
      type: 'RESERVE',
      qty: quantity,
      meta: { orderId, location },
    });

    return {
      success: true,
      orderId,
      sku,
      location,
      reserved: quantity,
      available_qty: updated.available_qty,
      reserved_qty: updated.reserved_qty,
    };
  });
}

export async function commitReservation({ orderId, sku, quantity, location = 'MAIN' }) {
  if (!orderId || !sku || !Number.isInteger(quantity) || quantity <= 0) {
    throw new HttpError(400, 'Invalid payload');
  }

  return tx(async (client) => {
    const row = await Inv.lockBySkuAndLocation(client, sku, location);
    if (!row) throw new HttpError(404, 'SKU/location not found');

    if ((row.reserved_qty ?? 0) < quantity) {
      return { success: false, reason: 'NOT_ENOUGH_RESERVED', reserved: row.reserved_qty };
    }

    const updated = await Inv.setQuantitiesById(client, row.id, { reservedDelta: -quantity });

    await addEvent(client, {
      inventory_id: row.id,
      sku,
      type: 'COMMIT',
      qty: quantity,
      meta: { orderId, location },
    });

    return {
      success: true,
      orderId,
      sku,
      location,
      committed: quantity,
      available_qty: updated.available_qty,
      reserved_qty: updated.reserved_qty,
    };
  });
}

export async function releaseReservation({ orderId, sku, quantity, location = 'MAIN' }) {
  if (!orderId || !sku || !Number.isInteger(quantity) || quantity <= 0) {
    throw new HttpError(400, 'Invalid payload');
  }

  return tx(async (client) => {
    const row = await Inv.lockBySkuAndLocation(client, sku, location);
    if (!row) throw new HttpError(404, 'SKU/location not found');

    if ((row.reserved_qty ?? 0) < quantity) {
      return { success: false, reason: 'NOT_ENOUGH_RESERVED', reserved: row.reserved_qty };
    }

    const updated = await Inv.setQuantitiesById(client, row.id, {
      availableDelta: +quantity,
      reservedDelta: -quantity,
    });

    await addEvent(client, {
      inventory_id: row.id,
      sku,
      type: 'RELEASE',
      qty: quantity,
      meta: { orderId, location },
    });

    return {
      success: true,
      orderId,
      sku,
      location,
      released: quantity,
      available_qty: updated.available_qty,
      reserved_qty: updated.reserved_qty,
    };
  });
}

/* ======================
 * Adjust (by sku + location)
 * ====================== */

export async function adjustStock({
  sku,
  location = 'MAIN',
  availableDelta = 0,
  reservedDelta = 0,
  reason,
}) {
  const hasAvail = Number.isInteger(availableDelta);
  const hasRes = Number.isInteger(reservedDelta);
  if (!sku || (!hasAvail && !hasRes)) throw new HttpError(400, 'Invalid payload');

  return tx(async (client) => {
    const row = await Inv.lockBySkuAndLocation(client, sku, location);
    if (!row) throw new HttpError(404, 'SKU/location not found');

    const updated = await Inv.setQuantitiesById(client, row.id, {
      availableDelta: hasAvail ? availableDelta : 0,
      reservedDelta: hasRes ? reservedDelta : 0,
    });

    await addEvent(client, {
      inventory_id: row.id,
      sku,
      type: 'ADJUST',
      qty: (hasAvail ? availableDelta : 0) + (hasRes ? reservedDelta : 0),
      meta: { reason, location, availableDelta, reservedDelta },
    });

    return {
      success: true,
      sku,
      location,
      available_qty: updated.available_qty,
      reserved_qty: updated.reserved_qty,
    };
  });
}

/* ======================
 * Move (by id: from row id → to location)
 * ====================== */

export async function moveStock({ id, qty, toLocation, fromLocation }) {
  if (!id || !Number.isFinite(qty) || qty <= 0 || !toLocation) {
    throw new HttpError(400, 'Invalid payload: { id, positive qty, toLocation } required');
  }

  return tx(async (client) => {
    const from = await Inv.lockById(client, id);
    if (!from) throw new HttpError(404, 'Inventory not found');

    if (fromLocation && from.location !== fromLocation) {
      throw new HttpError(400, `Inventory id does not belong to fromLocation (${fromLocation})`);
    }
    if (toLocation === from.location) {
      throw new HttpError(400, 'toLocation must differ from current location');
    }
    if ((from.available_qty ?? 0) < qty) {
      throw new HttpError(409, `Insufficient available quantity at ${from.location}`);
    }

    const to = await Inv.ensureRow(client, {
      sku: from.sku,
      supplier_id: from.supplier_id,
      location: toLocation,
    });
    const toLocked = await Inv.lockById(client, to.id);

    const fromUpdated = await Inv.setQuantitiesById(client, from.id, {
      availableDelta: -qty,
      reservedDelta: 0,
    });
    const toUpdated = await Inv.setQuantitiesById(client, toLocked.id, {
      availableDelta: +qty,
      reservedDelta: 0,
    });

    await addEvent(client, {
      inventory_id: from.id,
      sku: from.sku,
      type: 'MOVE_OUT',
      qty,
      meta: { fromLocation: from.location, toLocation },
    });
    await addEvent(client, {
      inventory_id: toLocked.id,
      sku: from.sku,
      type: 'MOVE_IN',
      qty,
      meta: { fromLocation: from.location, toLocation },
    });

    return {
      success: true,
      sku: from.sku,
      moved: qty,
      from: {
        id: fromUpdated.id,
        location: fromUpdated.location,
        available_qty: fromUpdated.available_qty,
        reserved_qty: fromUpdated.reserved_qty,
      },
      to: {
        id: toUpdated.id,
        location: toUpdated.location,
        available_qty: toUpdated.available_qty,
        reserved_qty: toUpdated.reserved_qty,
      },
    };
  });
}

/* ======================
 * Quick View History
 * ====================== */

export async function quickViewHistory({ id, limit = 20, cursor }) {
  if (!id) throw new HttpError(400, 'Missing inventory id');
  const lim = Math.min(Number(limit ?? 20), 100);

  return tx(async (client) => {
    const row = await Inv.getById(client, id);
    if (!row) throw new HttpError(404, 'Inventory not found');

    const { events, nextCursor } = await listByInventoryId(client, id, {
      limit: lim,
      cursor,
    });

    const data = events.map((ev) => ({
      id: ev.id,
      sku: ev.sku,
      type: ev.type,
      qty: ev.qty,
      at: ev.at,
      meta: ev.meta ?? {},
    }));
    return { data, nextCursor };
  });
}
