import { Routes } from '@angular/router';
import { OrdersListComponent } from './orders/order-list/order-list.component';

export const routes: Routes = [
  {
    path: 'orders',
    loadComponent: () => import('./orders/order-list/order-list.component').then(m => m.OrdersListComponent) 
  },
  { path: 'orders/:id', 
    loadComponent: () => import('./orders/order-detail/order-detail.component').then(m => m.OrderDetailComponent) 
  },
  {
    path: 'inventory',
    loadComponent: () => import('./inventory/inventory-list/inventory-list.component').then(m => m.InventoryListComponent) 
  },
  { path: 'inventory/:id', 
    loadComponent: () => import('./inventory/inventory-edit/inventory-edit.component').then(m => m.InventoryEditComponent) 
  },
  {
    path: '',
    redirectTo: 'orders',
    pathMatch: 'full',
  },
];
