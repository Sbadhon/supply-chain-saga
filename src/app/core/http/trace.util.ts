// Utilities for W3C trace headers
export function randomHex(bytes: number): string {
    const buf = new Uint8Array(bytes);
    crypto.getRandomValues(buf);
    return [...buf].map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  export function makeTraceparent(existing?: string) {
    if (existing && typeof existing === 'string' && existing.split('-').length === 4) {
      return existing; // already a valid traceparent
    }
    const version = '00';
    const traceId = randomHex(16);   // 16 bytes = 32 hex chars
    const spanId  = randomHex(8);    // 8 bytes  = 16 hex chars
    const flags   = '01';            // sampled
    return `${version}-${traceId}-${spanId}-${flags}`;
  }
  
  export function extractTraceId(traceparent: string): string | null {
    // 00-<traceId>-<spanId>-01
    const parts = traceparent?.split('-');
    return parts?.length === 4 ? parts[1] : null;
  }
  