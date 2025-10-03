import { Component, OnDestroy, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import * as OrdersActions from '@app/store/orders/orders.actions';
import * as OrdersSelectors from '@app/store/orders/orders.selectors';
import { CreateOrderInput, Order, OrderItem } from '@app/store/orders/order.model';
import { OrderCreateModalComponent } from '../order-create-modal/order-create-modal.component';
import { clearCreateOrderKey, getCreateOrderKey, setCreateOrderKey } from '@app/core/http/idempotency-storage.util';

type SortKey = 'createdAt' | 'total' | 'status' | 'id';
type SortDir = 'asc' | 'desc';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, OrderCreateModalComponent],
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.scss'],
})
export class OrdersListComponent implements OnInit, OnDestroy {
  query = signal<string>('');
  status = signal<string>('ALL');
  sortKey = signal<SortKey>('createdAt');
  sortDir = signal<SortDir>('desc');
  page = signal<number>(1);
  pageSize = signal<number>(10);
  pageSizeValue = 10;

  orders$: Observable<Order[]>;
  loading$: Observable<boolean>;
  error$: Observable<string | undefined>;

  private sub?: Subscription;
  statuses = ['ALL', 'PENDING', 'RESERVED', 'PAID', 'SHIPPED', 'CANCELED'];
  showCreateModal = signal(false);
  private currentCreateKey?: string;

  constructor(private store: Store) {
    this.orders$ = this.store.select(OrdersSelectors.selectAllOrders);
    this.loading$ = this.store.select(OrdersSelectors.selectOrdersLoading);
    this.error$ = this.store.select(OrdersSelectors.selectOrdersError);
  }

  ngOnInit(): void {
    this.store.dispatch(OrdersActions.loadOrders());
    this.pageSize.set(this.pageSizeValue);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  onSearchChange(v: string) {
    this.query.set((v || '').trim().toLowerCase());
    this.page.set(1);
  }

  onStatusChange(v: string) {
    this.status.set(v);
    this.page.set(1);
  }

  openCreateModal(): void {
    // Reuse existing key if page refreshed during an in-flight attempt
    this.currentCreateKey = getCreateOrderKey() ?? crypto.randomUUID().replace(/-/g, '');
    setCreateOrderKey(this.currentCreateKey);
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
    // User explicitly cancelled;
    // clear the key so next open gets a fresh one
    clearCreateOrderKey();
    this.currentCreateKey = undefined;
  }

  handleCreate(payload: { customerId?: string; total: number; itemsCount?: number; items: OrderItem[] }) {
    // Prefer the key that was created when opening the modal; fall back to storage if needed
    const idempotencyKey =
      this.currentCreateKey ??
      getCreateOrderKey() ??
      crypto.randomUUID().replace(/-/g, '');

    const order: CreateOrderInput = {
      customerId: payload.customerId,
      total: payload.total,
      itemsCount: payload.itemsCount,
      items: payload.items,
    };

    this.store.dispatch(OrdersActions.createOrder({ order, idempotencyKey }));
    //Clear the key; keeping it for potential retry on error
    this.showCreateModal.set(false);
  }
  
  onPageSizeChange(size: number) {
    this.pageSizeValue = Number(size) || 10;
    this.pageSize.set(this.pageSizeValue);
    this.page.set(1);
  }

  setSort(key: SortKey) {
    if (this.sortKey() === key) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(key);
      this.sortDir.set('desc');
    }
  }

  filteredSortedPaged(orders: Order[]): Order[] {
    const q = this.query();
    const status = this.status();
    const key = this.sortKey();
    const dir = this.sortDir();
    const page = this.page();
    const pageSize = this.pageSize();

    let list = (orders ?? []).slice();

    if (q) {
      list = list.filter((o) => {
        const idMatch = String(o.id ?? '')
          .toLowerCase()
          .includes(q);
        const custMatch = String(o.customerId ?? '')
          .toLowerCase()
          .includes(q);
        const skuMatch = (o.items ?? []).some((it: any) =>
          String(it?.sku ?? '')
            .toLowerCase()
            .includes(q),
        );
        return idMatch || custMatch || skuMatch;
      });
    }

    if (status !== 'ALL') {
      list = list.filter((o) => o.status === status);
    }

    list.sort((a, b) => {
      const va =
        key === 'createdAt'
          ? new Date(a.createdAt as any).getTime()
          : key === 'total'
            ? ((a as any).total ?? 0)
            : key === 'status'
              ? (a.status ?? '')
              : String(a.id ?? '');

      const vb =
        key === 'createdAt'
          ? new Date(b.createdAt as any).getTime()
          : key === 'total'
            ? ((b as any).total ?? 0)
            : key === 'status'
              ? (b.status ?? '')
              : String(b.id ?? '');

      if (va < (vb as any)) return dir === 'asc' ? -1 : 1;
      if (va > (vb as any)) return dir === 'asc' ? 1 : -1;
      return 0;
    });

    const start = (page - 1) * pageSize;
    return list.slice(start, start + pageSize);
  }

  totalAfterFilter(orders: Order[]): number {
    const q = this.query();
    const status = this.status();

    return (orders ?? []).filter((o) => {
      const okQ =
        !q ||
        String(o.id ?? '')
          .toLowerCase()
          .includes(q) ||
        String(o.customerId ?? '')
          .toLowerCase()
          .includes(q) ||
        (o.items ?? []).some((it: any) =>
          String(it?.sku ?? '')
            .toLowerCase()
            .includes(q),
        );
      const okS = status === 'ALL' || o.status === status;
      return okQ && okS;
    }).length;
  }

  pageCount(orders: Order[]): number {
    const total = this.totalAfterFilter(orders);
    const ps = this.pageSize();
    return Math.max(1, Math.ceil(total / ps));
  }

  nextPage(orders: Order[]): void {
    const max = this.pageCount(orders);
    this.page.set(Math.min(max, this.page() + 1));
  }

  prevPage(): void {
    this.page.set(Math.max(1, this.page() - 1));
  }

  trackById(_: number, o: Order) {
    return o.id;
  }
}
