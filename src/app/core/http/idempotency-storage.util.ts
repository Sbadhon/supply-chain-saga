const CREATE_KEY = 'createOrderKey';
const CREATE_PAYMENT_KEY = 'createPaymentKey';

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
