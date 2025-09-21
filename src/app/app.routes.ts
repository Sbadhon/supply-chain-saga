import { Routes } from '@angular/router';
import { OrdersListComponent } from './dashboard/order-list/order-list.component';

export const routes: Routes = [
  {
    path: 'orders',
    component: OrdersListComponent,
  },
  {
    path: '',
    redirectTo: 'orders',
    pathMatch: 'full',
  },
];
