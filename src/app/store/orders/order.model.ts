export interface OrderItem {
    sku: string;
    quantity: number;
    unitPrice: string;
  }
  
  export interface Order {
    id: string;
    customerId?: string;
    status: string;
    idempotencyKey: string;
    metadata?: Record<string, any>;
    items: OrderItem[];
    createdAt: string;
    updatedAt: string;
  }
  