import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'orders',
    loadComponent: () =>
      import('./orders/order-list/order-list.component').then(
        (m) => m.OrdersListComponent,
      ),
  },
  {
    path: 'orders/:id',
    loadComponent: () =>
      import('./orders/order-detail/order-detail.component').then(
        (m) => m.OrderDetailComponent,
      ),
  },
  {
    path: 'inventory',
    loadComponent: () =>
      import('./inventory/inventory-list/inventory-list.component').then(
        (m) => m.InventoryListComponent,
      ),
  },
  {
    path: 'inventory/:id',
    loadComponent: () =>
      import('./inventory/inventory-edit/inventory-edit.component').then(
        (m) => m.InventoryEditComponent,
      ),
  },
  {
    path: 'payments',
    loadComponent: () =>
      import('./payments/payment-list/payment-list.component').then(
        (m) => m.PaymentListComponent,
      ),
  },
  {
    path: 'payments/:id',
    loadComponent: () =>
      import('./payments/payment-status/payment-status.component').then(
        (m) => m.PaymentStatusComponent,
      ),
  },
  {
    path: 'shipments',
    loadComponent: () =>
      import('./shipping/shipping-list/shipping-list.component').then(
        (m) => m.ShippingListComponent,
      ),
  },
  {
    path: 'shipments/:id',
    loadComponent: () =>
      import('./shipping/shipping-detail/shipping-detail.component').then(
        (m) => m.ShippingDetailComponent,
      ),
  },

  // Default & wildcard redirects
  { path: '', pathMatch: 'full', redirectTo: 'orders' },
  { path: '**', redirectTo: 'orders' },
];
