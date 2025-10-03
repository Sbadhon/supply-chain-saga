const CREATE_KEY = 'createOrderKey';
const CREATE_PAYMENT_KEY = 'createPaymentKey';
const CREATE_SHIPMENT_KEY = 'createShipmentKey';
const INV_PREFIX = 'invKey';
type InvKind = 'receive' | 'adjust' | 'move' | 'reserve';

export function setCreateOrderKey(key: string): void {
  try {
    sessionStorage.setItem(CREATE_KEY, key);
  } catch {}
}

export function getCreateOrderKey(): string | null {
  try {
    return sessionStorage.getItem(CREATE_KEY);
  } catch {
    return null;
  }
}

export function clearCreateOrderKey(): void {
  try {
    sessionStorage.removeItem(CREATE_KEY);
  } catch {}
}

export function setCreatePaymentKey(key: string) {
  try {
    sessionStorage.setItem(CREATE_PAYMENT_KEY, key);
  } catch {}
}

export function getCreatePaymentKey(): string | null {
  try {
    return sessionStorage.getItem(CREATE_PAYMENT_KEY);
  } catch {
    return null;
  }
}

export function clearCreatePaymentKey() {
  try {
    sessionStorage.removeItem(CREATE_PAYMENT_KEY);
  } catch {}
}

export function setCreateShipmentKey(key: string) {
  try {
    sessionStorage.setItem(CREATE_SHIPMENT_KEY, key);
  } catch {}
}

export function getCreateShipmentKey(): string | null {
  try {
    return sessionStorage.getItem(CREATE_SHIPMENT_KEY);
  } catch {
    return null;
  }
}

export function clearCreateShipmentKey() {
  try {
    sessionStorage.removeItem(CREATE_SHIPMENT_KEY);
  } catch {}
}

function invKey(kind: InvKind, rowId: string) {
  return `${INV_PREFIX}:${kind}:${rowId}`;
}

export function setInventoryKey(
  kind: InvKind,
  rowId: string,
  key: string,
): void {
  try {
    sessionStorage.setItem(invKey(kind, rowId), key);
  } catch {}
}

export function getInventoryKey(kind: InvKind, rowId: string): string | null {
  try {
    return sessionStorage.getItem(invKey(kind, rowId));
  } catch {
    return null;
  }
}

export function clearInventoryKey(kind: InvKind, rowId: string): void {
  try {
    sessionStorage.removeItem(invKey(kind, rowId));
  } catch {}
}

export function clearAllInventoryKeys(): void {
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i) ?? '';
      if (k.startsWith(`${INV_PREFIX}:`)) toRemove.push(k);
    }
    toRemove.forEach((k) => sessionStorage.removeItem(k));
  } catch {}
}
