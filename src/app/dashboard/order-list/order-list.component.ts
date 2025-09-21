import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import * as OrdersActions from '@app/store/orders/orders.actions';
import * as OrdersSelectors from '@app/store/orders/orders.selectors';
import { Order } from '@app/store/orders/order.model';
import { Store } from '@ngrx/store';
import { AsyncPipe, DatePipe, NgIf } from '@angular/common';
@Component({
  selector: 'app-order-list',
  imports: [AsyncPipe, NgIf, DatePipe],
  templateUrl: './order-list.component.html',
  styleUrl: './order-list.component.scss'
})
export class OrdersListComponent implements OnInit {
  orders$: Observable<Order[]>;
  loading$: Observable<boolean>;
  error$: Observable<string | undefined>;

  constructor(private store: Store) {
    this.orders$ = this.store.select(OrdersSelectors.selectAllOrders);
    this.loading$ = this.store.select(OrdersSelectors.selectOrdersLoading);
    this.error$ = this.store.select(OrdersSelectors.selectOrdersError);
  }

  ngOnInit(): void {
    this.store.dispatch(OrdersActions.loadOrders());
  }
}
