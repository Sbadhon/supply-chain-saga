export interface Inventory {
  id: string;
  sku: string;
  supplierId?: string | null;
  location?: string | null;
  available_qty: number;
  reserved_qty: number;
  inbound: number;
  reorderPoint?: number | null; 
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

/** Movement/transaction types shown in Quick View timeline */
export type MovementType =
  | 'RECEIVE'      // receiving/commit into stock
  | 'RESERVE'      // hold for an order
  | 'RELEASE'      // release previously reserved qty
  | 'ADJUST'       // manual correction (delta +/-)
  | 'MOVE_IN'      // moved in from another location
  | 'MOVE_OUT'     // moved out to another location
  | 'COMMIT';      // synonym used by some systems for receive

export interface InventoryEvent {
  id: string; 
  sku: string;
  type: MovementType;
  qty?: number; 
  at: string; 
  meta?: Record<string, any>;
}


export interface InventoryFilters {
  search?: string;
  status?: 'ALL' | 'LOW' | 'OUT' | 'OK';
  supplier?: string | 'ALL';
  location?: string | 'ALL';
  category?: string | 'ALL';
}


export interface CommitRequest {
  orderId?: string;
  sku: string;
  quantity: number;
  location?: string;
}
export interface ReserveRequest extends CommitRequest {}

export interface ReleaseRequest {
  orderId?: string;
  sku: string;
  quantity: number;
  location?: string;
}

export interface AdjustRequest {
  sku: string;
  location?: string;
  availableDelta?: number;
  reservedDelta?: number;
  reason?: string;
}

export interface MovePayload {
  id: string;
  qty: number;
  fromLocation?: string;
  toLocation: string;
}

/** Generic API list response for server-side pagination later */
export interface PagedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
