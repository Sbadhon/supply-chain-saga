import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import {
  BehaviorSubject,
  Observable,
  combineLatest,
  map,
  of,
  switchMap,
} from 'rxjs';

import * as InventoryAPIActions from '@app/store/inventory/api/inventory.api.actions';
import * as InventoryUIActions from '@app/store/inventory/ui/inventory.ui.actions';
import * as InventoryAPISelectors from '@app/store/inventory/api/inventory.api.selectors';

import {
  Inventory,
  InventoryEvent,
} from '@app/store/inventory/api/inventory.model';

import { InventoryModalsComponent } from '../inventory-modals/inventory-modals.component';

type Status = 'ALL' | 'LOW' | 'OUT' | 'OK';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, InventoryModalsComponent],
  templateUrl: './inventory-list.component.html',
  styleUrls: ['./inventory-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryListComponent implements OnInit {
  items$: Observable<Inventory[]>;
  loading$: Observable<boolean>;
  error$: Observable<string | undefined>;
  selectItemHistory$: Observable<InventoryEvent[]>;

  // distinct dropdown sources
  suppliers$: Observable<string[]>;
  locations$: Observable<string[]>;

  status: Status = 'ALL';
  search = '';
  supplier = 'ALL';
  location = 'ALL';
  page = 1;
  pageSize = 20;

  private refresh$ = new BehaviorSubject<void>(undefined);
  private selectedId$ = new BehaviorSubject<string | null>(null);
  selectedId: string | null = null;

  filteredInventories$: Observable<{ rows: Inventory[]; total: number }>;

  constructor(private store: Store) {
    this.items$ = this.store.select(InventoryAPISelectors.selectAllInventory);
    this.loading$ = this.store.select(
      InventoryAPISelectors.selectInventoryLoading,
    );
    this.error$ = this.store.select(InventoryAPISelectors.selectInventoryError);

    // Build distinct option arrays to avoid duplicate track keys
    this.suppliers$ = this.items$.pipe(
      map((rows) =>
        Array.from(
          new Set(rows.map((r) => (r.supplierId ?? '').trim())),
        ).filter((v) => !!v),
      ),
    );

    this.locations$ = this.items$.pipe(
      map((rows) =>
        Array.from(new Set(rows.map((r) => (r.location ?? '').trim()))).filter(
          (v) => !!v,
        ),
      ),
    );

    // history stream reacts to selection
    this.selectItemHistory$ = this.selectedId$.pipe(
      switchMap((id) =>
        id
          ? this.store.select(InventoryAPISelectors.selectItemHistory(id))
          : of([]),
      ),
    );

    this.filteredInventories$ = combineLatest([
      this.items$,
      this.refresh$,
    ]).pipe(
      map(([items]) => {
        let rows: Inventory[] = items ?? [];
        const q = this.search.trim().toLowerCase();
        if (q) {
          rows = rows.filter(
            (r) =>
              r.sku.toLowerCase().includes(q) ||
              (r.supplierId ?? '').toLowerCase().includes(q),
          );
        }

        // status
        rows = rows.filter((r) => this.matchesStatus(r));

        // dropdown filters
        if (this.supplier !== 'ALL') {
          rows = rows.filter((r) => r.supplierId === this.supplier);
        }
        if (this.location !== 'ALL') {
          rows = rows.filter((r) => r.location === this.location);
        }

        // pagination
        const total = rows.length;
        const start = (this.page - 1) * this.pageSize;
        rows = rows.slice(start, start + this.pageSize);

        return { rows, total };
      }),
    );
  }

  ngOnInit(): void {
    this.store.dispatch(InventoryAPIActions.loadInventory());
  }

  // --- Derived helpers
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

  matchesStatus(inv: Inventory): boolean {
    switch (this.status) {
      case 'LOW':
        return this.low(inv) && !this.out(inv);
      case 'OUT':
        return this.out(inv);
      case 'OK':
        return !this.low(inv) && !this.out(inv);
      default:
        return true;
    }
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

  filter(next: Status) {
    this.status = next;
    this.page = 1;
    this.refresh$.next();
  }

  onSearch(event: Event) {
    this.search = (event.target as HTMLInputElement).value ?? '';
    this.page = 1;
    this.refresh$.next();
  }

  applyFilters() {
    this.page = 1;
    this.refresh$.next();
  }

  setPage(page: number) {
    this.page = Math.max(1, page);
    this.refresh$.next();
  }

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
}
