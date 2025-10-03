import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, map } from 'rxjs';

import * as ShipActions from '@app/store/shipping/shipping.actions';
import * as ShipSelectors from '@app/store/shipping/shipping.selectors';
import { CreateShipmentDto, Shipment, ShipmentStatus } from '@app/store/shipping/shipping.model';
import { ShippingCreateModalComponent } from '../shipping-create-modal/shipping-create-modal.component';
import { clearCreateShipmentKey, getCreateShipmentKey, setCreateShipmentKey } from '@app/core/http/idempotency-storage.util';

type SortKey = 'createdAt' | 'order_id' | 'status';
type SortDir = 'asc' | 'desc';

@Component({
  selector: 'app-shipping-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ShippingCreateModalComponent],
  templateUrl: './shipping-list.component.html',
  styleUrls: ['./shipping-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShippingListComponent implements OnInit {
  shipments$: Observable<Shipment[]>;
  loading$: Observable<boolean>;
  error$: Observable<string | undefined>;
  q = '';
  status: 'ALL' | ShipmentStatus = 'ALL';
  sortKey: SortKey = 'createdAt';
  sortDir: SortDir = 'desc';
  page = 1;
  pageSize = 10;

  readonly statuses: Array<'ALL' | ShipmentStatus> = [
    'ALL',
    ShipmentStatus.PENDING,
    ShipmentStatus.LABEL_CREATED,
    ShipmentStatus.SHIPPED,
    ShipmentStatus.DELIVERED,
    ShipmentStatus.CANCELED,
    ShipmentStatus.FAILED,
  ];
  showCreateShipmentModal = false;

  constructor(private store: Store) {
    this.shipments$ = this.store
      .select(ShipSelectors.selectAllShipments)
      .pipe(map((list) => (Array.isArray(list) ? list : [])));
    this.loading$ = this.store.select(ShipSelectors.selectShipmentsLoading);
    this.error$ = this.store.select(ShipSelectors.selectShipmentsError);
  }

  ngOnInit(): void {
    this.store.dispatch(ShipActions.loadShipments());
  }

  onSearchChange(v: string) {
    this.q = (v || '').trim().toLowerCase();
    this.page = 1;
  }
  onStatusChange(v: string) {
    this.status = (v as any) === 'ALL' ? 'ALL' : (v as ShipmentStatus);
    this.page = 1;
  }

  openCreateShipmentModal(): void {
    const key = getCreateShipmentKey() ?? crypto.randomUUID().replace(/-/g, '');
    setCreateShipmentKey(key);
    this.showCreateShipmentModal = true;
  }

  cancelCreateShipmentModal(): void {
    clearCreateShipmentKey(); 
    this.showCreateShipmentModal = false;
  }

  submitCreateShipment(payload: { order_id: string; label_url?: string }) {
    const idempotencyKey = getCreateShipmentKey() ?? crypto.randomUUID().replace(/-/g, '');

    const dto: CreateShipmentDto = {
      order_id: payload.order_id,
      label_url: payload.label_url,
    };

    this.store.dispatch(ShipActions.createShipment({ dto, idempotencyKey }));
    this.showCreateShipmentModal = false;
  }
  
  setSort(k: SortKey) {
    if (this.sortKey === k)
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    else {
      this.sortKey = k;
      this.sortDir = 'desc';
    }
  }

  filteredSortedPaged(list: Shipment[]): Shipment[] {
    const q = this.q;
    let out = [...list];

    if (q) {
      out = out.filter(
        (s) =>
          (s.id?.toLowerCase() ?? '').includes(q) ||
          (s.order_id?.toLowerCase() ?? '').includes(q) ||
          (s.status?.toLowerCase() ?? '').includes(q),
      );
    }
    if (this.status !== 'ALL') {
      out = out.filter((s) => s.status === this.status);
    }

    const dir = this.sortDir === 'asc' ? 1 : -1;
    out.sort((a, b) => {
      const va =
        this.sortKey === 'createdAt'
          ? new Date(a.createdAt).getTime()
          : this.sortKey === 'order_id'
            ? a.order_id
            : a.status;
      const vb =
        this.sortKey === 'createdAt'
          ? new Date(b.createdAt).getTime()
          : this.sortKey === 'order_id'
            ? b.order_id
            : b.status;
      // compare using string/number
      return (va < (vb as any) ? -1 : va > (vb as any) ? 1 : 0) * dir;
    });

    const start = (this.page - 1) * this.pageSize;
    return out.slice(start, start + this.pageSize);
  }

  countAfterFilter(list: Shipment[]): number {
    const q = this.q;
    const st = this.status;
    return list.filter((s) => {
      const okQ =
        !q ||
        s.id?.toLowerCase().includes(q) ||
        s.order_id?.toLowerCase().includes(q) ||
        s.status?.toLowerCase().includes(q);
      const okS = st === 'ALL' || s.status === st;
      return okQ && okS;
    }).length;
  }

  pageCount(list: Shipment[]): number {
    const total = this.countAfterFilter(list);
    return Math.max(1, Math.ceil(total / this.pageSize));
  }

  nextPage(list: Shipment[]) {
    this.page = Math.min(this.pageCount(list), this.page + 1);
  }

  prevPage() {
    this.page = Math.max(1, this.page - 1);
  }

  trackById(_: number, s: Shipment) {
    return s.id;
  }
}
