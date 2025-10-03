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
    status: 'PENDING' | 'RESERVED' | 'PAID' | 'SHIPPED' | 'CANCELED' | 'FAILED';
    metadata?: Record<string, any>;
    items: OrderItem[];
    total: number;
    itemsCount: number;
    createdAt?: string; 
    updatedAt?: string;
  }
  
  export interface CreateOrderInput {
    customerId?: string;
    items?: OrderItem[];
    total?: number;
    itemsCount?: number; 
    metadata?: Record<string, any>;
  }