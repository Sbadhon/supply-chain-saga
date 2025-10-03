const CREATE_KEY = 'createOrderKey';
const CREATE_PAYMENT_KEY = 'createPaymentKey';
const CREATE_SHIPMENT_KEY = 'createShipmentKey';

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
