import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable, map, of, switchMap } from 'rxjs';
import * as InventoryUIActions from '@app/store/inventory/ui/inventory.ui.actions';
import * as InventoryAPIActions from '@app/store/inventory/api/inventory.api.actions';
import * as InventoryAPISelectors from '@app/store/inventory/api/inventory.api.selectors';
import {
  Inventory,
  InventoryEvent,
} from '@app/store/inventory/api/inventory.model';
import { InventoryModalsComponent } from '../inventory-modals/inventory-modals.component';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

type Status = 'all' | 'LOW' | 'OUT' | 'OK';
type SortKey =
  | 'sku'
  | 'supplierId'
  | 'location'
  | 'available_qty'
  | 'reserved_qty'
  | 'inbound'
  | 'reorderPoint'
  | 'updatedAt';
type SortDir = 'asc' | 'desc';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    InventoryModalsComponent,
    NgbDropdownModule,
  ],
  templateUrl: './inventory-list.component.html',
  styleUrls: ['./inventory-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryListComponent implements OnInit {
  items$: Observable<Inventory[]>;
  loading$: Observable<boolean>;
  error$: Observable<string | undefined>;

  // dropdown sources
  suppliers$: Observable<string[]>;
  locations$: Observable<string[]>;

  // signals to mirror PaymentListComponent
  query = signal<string>('');
  status = signal<Status>('all');
  supplier = signal<string>('ALL');
  location = signal<string>('ALL');

  sortKey = signal<SortKey>('updatedAt');
  sortDir = signal<SortDir>('desc');
  page = signal<number>(1);
  pageSize = signal<number>(10);
  pageSizeValue = 10;

  private selectedId$ = new BehaviorSubject<string | null>(null);
  selectedId: string | null = null;
  selectItemHistory$: Observable<InventoryEvent[]>;

  statuses: Status[] = ['all', 'LOW', 'OUT', 'OK'];

  constructor(private store: Store) {
    this.items$ = this.store.select(InventoryAPISelectors.selectAllInventory);
    this.loading$ = this.store.select(
      InventoryAPISelectors.selectInventoryLoading,
    );
    this.error$ = this.store.select(InventoryAPISelectors.selectInventoryError);

    this.suppliers$ = this.items$.pipe(
      map((rows) =>
        Array.from(
          new Set((rows ?? []).map((r) => (r.supplierId ?? '').trim())),
        ).filter(Boolean),
      ),
    );
    this.locations$ = this.items$.pipe(
      map((rows) =>
        Array.from(
          new Set((rows ?? []).map((r) => (r.location ?? '').trim())),
        ).filter(Boolean),
      ),
    );

    this.selectItemHistory$ = this.selectedId$.pipe(
      switchMap((id) =>
        id
          ? this.store.select(InventoryAPISelectors.selectItemHistory(id))
          : of([]),
      ),
    );
  }

  ngOnInit(): void {
    this.store.dispatch(InventoryAPIActions.loadInventory());
    this.pageSize.set(this.pageSizeValue);
  }

  onSearchChange(v: string) {
    this.query.set((v || '').trim().toLowerCase());
    this.page.set(1);
  }
  onStatusChange(v: string) {
    this.status.set((v as Status) || 'all');
    this.page.set(1);
  }
  onSupplierChange(v: string) {
    this.supplier.set(v || 'ALL');
    this.page.set(1);
  }
  onLocationChange(v: string) {
    this.location.set(v || 'ALL');
    this.page.set(1);
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

  available(inv: Inventory): number {
    return Math.max(
      0,
      Number(inv.available_qty ?? 0) - Number(inv.reserved_qty ?? 0),
    );
  }
  low(inv: Inventory): boolean {
    const rp = Number(inv.reorderPoint ?? 0);
    return rp > 0 && this.available(inv) <= rp && !this.out(inv);
  }
  out(inv: Inventory): boolean {
    return this.available(inv) === 0;
  }
  setRowClass(inv: Inventory) {
    return {
      'table-danger': this.out(inv),
      'table-warning': this.low(inv) && !this.out(inv),
    };
  }
  availableBadgeClass(inv: Inventory): string {
    if (this.out(inv)) return 'text-bg-danger';
    if (this.low(inv)) return 'text-bg-warning';
    return 'text-bg-success';
  }
  statusBadgeClass(inv: Inventory): string {
    if (this.out(inv)) return 'text-bg-danger';
    if (this.low(inv)) return 'text-bg-warning';
    return 'text-bg-success';
  }

  filteredSortedPaged(items: Inventory[]): Inventory[] {
    const q = this.query();
    const status = this.status();
    const supplier = this.supplier();
    const location = this.location();
    const key = this.sortKey();
    const dir = this.sortDir();
    const page = this.page();
    const pageSize = this.pageSize();

    let list = (items ?? []).slice();

    // search
    if (q) {
      list = list.filter(
        (r) =>
          (r.sku ?? '').toLowerCase().includes(q) ||
          (r.supplierId ?? '').toLowerCase().includes(q) ||
          (r.location ?? '').toLowerCase().includes(q),
      );
    }

    // status filter
    if (status !== 'all') {
      list = list.filter((r) => {
        if (status === 'LOW') return this.low(r) && !this.out(r);
        if (status === 'OUT') return this.out(r);
        if (status === 'OK') return !this.low(r) && !this.out(r);
        return true;
      });
    }

    // dropdown filters
    if (supplier !== 'ALL')
      list = list.filter((r) => r.supplierId === supplier);
    if (location !== 'ALL') list = list.filter((r) => r.location === location);

    // sort
    list.sort((a, b) => {
      const va =
        key === 'updatedAt'
          ? new Date(a.updatedAt as any).getTime()
          : ((a as any)[key] ??
            (key === 'sku' || key === 'supplierId' || key === 'location'
              ? ''
              : 0));
      const vb =
        key === 'updatedAt'
          ? new Date(b.updatedAt as any).getTime()
          : ((b as any)[key] ??
            (key === 'sku' || key === 'supplierId' || key === 'location'
              ? ''
              : 0));

      if (va < (vb as any)) return dir === 'asc' ? -1 : 1;
      if (va > (vb as any)) return dir === 'asc' ? 1 : -1;
      return 0;
    });

    const start = (page - 1) * pageSize;
    return list.slice(start, start + pageSize);
  }

  totalAfterFilter(items: Inventory[]): number {
    const q = this.query();
    const status = this.status();
    const supplier = this.supplier();
    const location = this.location();

    return (items ?? []).filter((r) => {
      const okQ =
        !q ||
        (r.sku ?? '').toLowerCase().includes(q) ||
        (r.supplierId ?? '').toLowerCase().includes(q) ||
        (r.location ?? '').toLowerCase().includes(q);

      const okStatus =
        status === 'all' ||
        (status === 'LOW' && this.low(r) && !this.out(r)) ||
        (status === 'OUT' && this.out(r)) ||
        (status === 'OK' && !this.low(r) && !this.out(r));

      const okSupplier = this.supplier() === 'ALL' || r.supplierId === supplier;
      const okLocation = this.location() === 'ALL' || r.location === location;

      return okQ && okStatus && okSupplier && okLocation;
    }).length;
  }

  pageCount(items: Inventory[]): number {
    const total = this.totalAfterFilter(items);
    const ps = this.pageSize();
    return Math.max(1, Math.ceil(total / ps));
  }

  nextPage(items: Inventory[]): void {
    const max = this.pageCount(items);
    this.page.set(Math.min(max, this.page() + 1));
  }

  prevPage(): void {
    this.page.set(Math.max(1, this.page() - 1));
  }

  // quick view + history
  openQuickView(id: string): void {
    this.selectedId = id;
    this.selectedId$.next(id);
    this.store.dispatch(InventoryAPIActions.loadItemHistory({ id }));
  }

  closeQuickView(): void {
    this.selectedId = null;
    this.selectedId$.next(null);
  }

  // modal triggers
  receive(id: string): void {
    this.store.dispatch(InventoryUIActions.openReceiveModal({ id }));
  }
  adjust(id: string): void {
    this.store.dispatch(InventoryUIActions.openAdjustModal({ id }));
  }
  move(id: string): void {
    this.store.dispatch(InventoryUIActions.openMoveModal({ id }));
  }
  reserve(id: string): void {
    this.store.dispatch(InventoryUIActions.openReserveModal({ id }));
  }

  trackById(_: number, r: Inventory) {
    return r.id;
  }
}
