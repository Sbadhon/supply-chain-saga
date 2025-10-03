const CREATE_KEY = 'createOrderKey';

export function setCreateOrderKey(key: string): void {
  try { sessionStorage.setItem(CREATE_KEY, key); } catch {}
}

export function getCreateOrderKey(): string | null {
  try { return sessionStorage.getItem(CREATE_KEY); } catch { return null; }
}

export function clearCreateOrderKey(): void {
  try { sessionStorage.removeItem(CREATE_KEY); } catch {}
}
