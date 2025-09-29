import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, Subject, combineLatest, map, takeUntil } from 'rxjs';

import * as InventoryAPISelectors from '@app/store/inventory/api/inventory.api.selectors';
import * as InventoryAPIActions from '@app/store/inventory/api/inventory.api.actions';
import * as InventoryUIActions from '@app/store/inventory/ui/inventory.ui.actions';
import { Inventory } from '@app/store/inventory/api/inventory.model';

@Component({
  selector: 'app-inventory-edit',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './inventory-edit.component.html',
  styleUrls: ['./inventory-edit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryEditComponent implements OnInit, OnDestroy {
  private store = inject(Store);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  id!: string;
  skuDisabled: boolean = false;

  loading$: Observable<boolean> = this.store.select(
    InventoryAPISelectors.selectInventoryLoading,
  );
  
  error$: Observable<string | undefined> = this.store.select(
    InventoryAPISelectors.selectInventoryError,
  );

  row$: Observable<Inventory | undefined> = combineLatest([
    this.store.select(InventoryAPISelectors.selectAllInventory),
    this.route.paramMap,
  ]).pipe(
    map(([rows, params]) => {
      const id = params.get('id') ?? '';
      this.id = id;
      return rows.find((r) => r.id === id);
    }),
  );

  form!: FormGroup;

  ngOnInit(): void {
    this.store.dispatch(InventoryAPIActions.loadInventory());
    this.form = this.fb.group({
      sku: [{ value: '', disabled: true }],
      supplierId: [''],
      location: [''],
      reorderPoint: [null, [Validators.min(0)]],
      inbound: [0, [Validators.min(0)]],
    });

    this.row$.pipe(takeUntil(this.destroy$)).subscribe((row) => {
      if (!row) return;
      this.form.patchValue({
        sku: row.sku,
        supplierId: row.supplierId ?? '',
        location: row.location ?? '',
        reorderPoint: row.reorderPoint ?? null,
        inbound: row.inbound ?? 0,
      });
      this.form.markAsPristine();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  available(row: Inventory): number {
    return Math.max(
      0,
      Number(row.available_qty ?? 0) - Number(row.reserved_qty ?? 0),
    );
  }
  low(row: Inventory): boolean {
    const rp = Number(row.reorderPoint ?? 0);
    return rp > 0 && this.available(row) <= rp && !this.out(row);
  }
  out(row: Inventory): boolean {
    return this.available(row) === 0;
  }
  statusBadgeClass(row: Inventory): string {
    if (this.out(row)) return 'text-bg-danger';
    if (this.low(row)) return 'text-bg-warning';
    return 'text-bg-success';
  }

  receive(id: string) {
    this.store.dispatch(InventoryUIActions.openReceiveModal({ id }));
  }
  adjust(id: string) {
    this.store.dispatch(InventoryUIActions.openAdjustModal({ id }));
  }
  move(id: string) {
    this.store.dispatch(InventoryUIActions.openMoveModal({ id }));
  }
  reserve(id: string) {
    this.store.dispatch(InventoryUIActions.openReserveModal({ id }));
  }

  save(row: Inventory): void {
    if (this.form.invalid || !this.form.dirty) return;
    const { supplierId, location, reorderPoint, inbound, metadata } =
      this.form.getRawValue();
    this.store.dispatch(
      InventoryAPIActions.updateInventory({
        id: row.id,
        patch: {
          supplierId: supplierId || null,
          location: location || null,
          reorderPoint: reorderPoint ?? null,
          inbound: Number(inbound ?? 0),
        },
      }),
    );
  }

  cancel(): void {
    this.router.navigate(['/inventory']);
  }
}
