//  backends will validate shape/scopes.
export function makeIdempotencyKey(): string {
    return crypto.randomUUID().replace(/-/g, '');
  }
  