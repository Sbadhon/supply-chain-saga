export enum TabType {
  ORDERS = 'orders',
  INVENTORY = 'inventory',
  PAYMENTS = 'payments',
  SHIPMENTS = 'shipments',
}

export interface TabModel {
  id: string;
  label: string;
  type: TabType;
  route: string;
}

export const TABS: TabModel[] = [
  { id: 'orders',     label: 'Orders',     type: TabType.ORDERS,   route: '/orders' },
  { id: 'inventory',  label: 'Inventory',  type: TabType.INVENTORY,route: '/inventory' },
  { id: 'payments',   label: 'Payments',   type: TabType.PAYMENTS, route: '/payments' },
  { id: 'shipments',  label: 'Shipments',  type: TabType.SHIPMENTS,route: '/shipments' },
];
