export interface OrderItem {
    sku: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    supplierId: string;
  }
  
  export interface Order {
    id: string;
    customerId?: string;
    status: string;
    idempotencyKey: string;
    metadata?: Record<string, any>;
    items: OrderItem[];
    total: number;
    itemsCount: number;
    createdAt: string;
    updatedAt: string;
  }
  
  export type OrderStatus = 
  'ALL'
 |'PENDING' 
 | 'RESERVED' 
 | 'AUTHORIZED' 
 | 'READY_TO_SHIP' 
 | 'COMPLETED' 
 | 'CANCELLED';