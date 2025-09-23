import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, map } from 'rxjs';
import * as OrdersActions from '@app/store/orders/orders.actions';
import * as OrdersSelectors from '@app/store/orders/orders.selectors';
import { Order } from '@app/store/orders/order.model';
import { Store } from '@ngrx/store';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TimeAgoPipe } from '@app/shared/pipes/time-ago.pipe';

type Status =
  | 'ALL'
  | 'PENDING'
  | 'RESERVED'
  | 'PAID'
  | 'SHIPPED'
  | 'CANCELED';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, RouterModule, TimeAgoPipe, DatePipe, CurrencyPipe],
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersListComponent implements OnInit {
  orders$: Observable<Order[]>;
  loading$: Observable<boolean>;
  error$: Observable<string | undefined>;

  currentStatus: Status = 'ALL';
  private statusFilter$ = new BehaviorSubject<Status>('ALL');
  private search$ = new BehaviorSubject<string>('');

  filteredOrders$: Observable<Order[]>;

  constructor(
    private store: Store, 
    private router: Router
  ) {
    this.orders$ = this.store.select(OrdersSelectors.selectAllOrders);
    this.loading$ = this.store.select(OrdersSelectors.selectOrdersLoading);
    this.error$ = this.store.select(OrdersSelectors.selectOrdersError);

    this.filteredOrders$ = combineLatest([
      this.orders$,
      this.statusFilter$,
      this.search$,
    ]).pipe(
      map(([orders, status, q]) => {
        const query = q.trim().toLowerCase();
        let out = orders ?? [];

        // filter by status
        if (status !== 'ALL') out = out.filter((o) => o.status === status);

        // text search (id, customerId, SKU)
        if (query) {
          out = out.filter((o) => {
            const idMatch = String(o.id).toLowerCase().includes(query);
            const custMatch = (o.customerId ?? '').toLowerCase().includes(query);
            const skuMatch = (o.items ?? []).some((it) =>
              (it.sku ?? '').toLowerCase().includes(query)
            );
            return idMatch || custMatch || skuMatch;
          });
        }

        // sort newest first
        return out.slice().sort((a, b) => {
          const at = +new Date(a.createdAt as any) || 0;
          const bt = +new Date(b.createdAt as any) || 0;
          return bt - at;
        });
      })
    );
  }

  ngOnInit(): void {
    this.store.dispatch(OrdersActions.loadOrders());
  }

  statusClass(status: string) {
    switch (status) {
      case 'PENDING':  return 'text-bg-secondary';
      case 'RESERVED': return 'text-bg-info';
      case 'PAID':     return 'text-bg-primary';
      case 'SHIPPED':  return 'text-bg-success';
      case 'CANCELED': return 'text-bg-danger';
      default:         return 'text-bg-secondary';
    }
  }

  setRowClass(order: Order) {
    return {
      'table-row-pending':  order.status === 'PENDING',
      'table-row-failure':  order.status === 'CANCELED',
    };
  }
  
  createSample(): void {
    // dispatch create with a small demo payload; your Effects will fetch it after 202
    this.store.dispatch(
      OrdersActions.createOrder({
        order: {
          customerId: 'C-DEMO',
          items: [{ sku: 'SKU-1', quantity: 1, supplierId: 'SUP-1', unitPrice: "19.99" }],
        } as any,
        idempotencyKey: 'ui-sample-' + Math.random().toString(36).slice(2),
      })
    );
  }

  onSearch(target: any): void {
    this.search$.next(target.value);
  }

  filter(status: Status): void {
    this.currentStatus = status;
    this.statusFilter$.next(status);
  }

  openOrderById(order: Order): void {
    if (!order?.id) return;
    this.router.navigate(['/orders', order.id]);
  }
}
