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
    path: '',
    redirectTo: 'orders',
    pathMatch: 'full',
  },
];
