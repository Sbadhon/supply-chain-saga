import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { Inventory } from '@app/store/inventory/api/inventory.model';
import * as InventoryActions from '@app/store/inventory/api/inventory.api.actions';
import * as InventoryUIActions from '@app/store/inventory/ui/inventory.ui.actions';
import * as InventoryUISelectors from '@app/store/inventory/ui/inventory.ui.selectors';
import { clearInventoryKey, getInventoryKey, setInventoryKey } from '@app/core/http/idempotency-storage.util';

type ModalKind = 'none' | 'receive' | 'adjust' | 'move' | 'reserve';

@Component({
  selector: 'app-inventory-modals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory-modals.component.html',
  styleUrls: ['./inventory-modals.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryModalsComponent implements OnDestroy {
  private store = inject(Store);

  kind$: Observable<ModalKind> = this.store.select(
    InventoryUISelectors.selectModalKind,
  );
  row$: Observable<Inventory | undefined> = this.store.select(
    InventoryUISelectors.selectModalRow,
  );

  // simple form model
  qty = 1;
  source = '';
  delta = 0;
  reason = '';
  toLocation = '';
  orderId?: string;

  private currentKey?: string;
  private currentKind: Exclude<ModalKind, 'none'> | null = null;
  private currentRowId?: string;

  private makeKey() {
    return crypto.randomUUID().replace(/-/g, '');
  }

  private kindSub: Subscription = this.kind$.subscribe(k => {
    // When a modal opens, stash kind and row.id, mint/load key
    if (k !== 'none') {
      this.resetForm();
      this.currentKind = k;
      // grab latest row id once (we only need it at open)
      const sub = this.row$.subscribe(row => {
        if (!row) return;
        this.currentRowId = row.id;
        const stored = getInventoryKey(k, row.id);
        this.currentKey = stored ?? this.makeKey();
        setInventoryKey(k, row.id, this.currentKey);
      });
      // immediately unsubscribe; we just needed the current value
      sub.unsubscribe();
    } else {
      // closed
      this.currentKind = null;
      this.currentRowId = undefined;
      this.currentKey = undefined;
    }
  });

  ngOnDestroy(): void {
    this.kindSub.unsubscribe();
  }

  title(kind: ModalKind): string {
    switch (kind) {
      case 'receive':
        return 'Receive Stock';
      case 'adjust':
        return 'Adjust Stock';
      case 'move':
        return 'Move Stock';
      case 'reserve':
        return 'Reserve Stock';
      default:
        return '';
    }
  }

  close(): void {
    if (this.currentKind && this.currentRowId) {
      clearInventoryKey(this.currentKind, this.currentRowId);
    }
    this.currentKind = null;
    this.currentRowId = undefined;
    this.currentKey = undefined;
    this.store.dispatch(InventoryUIActions.closeModal());
  }

  submitReceive(row: Inventory): void {
    if (this.qty > 0) {
      this.store.dispatch(InventoryActions.receiveInventory({
        id: row.id,
        qty: this.qty,
        source: this.source || 'manual',
        idempotencyKey: this.currentKey,
      }));
    }
  }

  submitAdjust(row: Inventory): void {
    if (this.delta !== 0) {
      this.store.dispatch(InventoryActions.adjustInventory({
        id: row.id,
        delta: this.delta,
        reason: this.reason || 'manual_adjust',
        idempotencyKey: this.currentKey,
      }));
    }
  }

  submitMove(row: Inventory): void {
    if (this.qty > 0 && this.toLocation.trim()) {
      this.store.dispatch(InventoryActions.moveInventory({
        id: row.id,
        qty: this.qty,
        fromLocation: row.location || '',
        toLocation: this.toLocation.trim(),
        idempotencyKey: this.currentKey,
      }));
    }
  }

  submitReserve(row: Inventory): void {
    if (this.qty > 0) {
      this.store.dispatch(InventoryActions.reserveInventory({
        id: row.id,
        qty: this.qty,
        orderId: this.orderId || undefined,
        idempotencyKey: this.currentKey,
      }));
    }
  }

  private resetForm(): void {
    this.qty = 1;
    this.source = '';
    this.delta = 0;
    this.reason = '';
    this.toLocation = '';
    this.orderId = undefined;
  }
}
