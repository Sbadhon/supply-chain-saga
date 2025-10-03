import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  QueryList,
  ViewChildren,
  signal,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

type OrderItemForm = FormGroup<{
  sku: any;
  supplierId: any;
  quantity: any;
  unitPrice: any;
}>;

@Component({
  selector: 'app-order-create-modal',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './order-create-modal.component.html',
  styleUrls: ['./order-create-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderCreateModalComponent {
  @Input() open = false;
  @Output() closed = new EventEmitter<void>();
  @Output() submittedOrder = new EventEmitter<{
    customerId?: string;
    items: {
      sku: string;
      supplierId: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
    }[];
    total: number;
    itemsCount: number;
    metadata?: Record<string, any>;
  }>();

  submitted = signal(false);
  form!: FormGroup;

  @ViewChildren('unitPrice') unitPriceInputs!: QueryList<ElementRef<HTMLInputElement>>;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      customerId: [''],
      items: this.fb.array<OrderItemForm>([]),
    });
  }

  get items(): FormArray<OrderItemForm> {
    return this.form.get('items') as FormArray<OrderItemForm>;
  }

  addItem(): void {
    const group = this.fb.group({
      sku: ['', Validators.required],
      supplierId: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
    }) as OrderItemForm;
    this.items.push(group);
    queueMicrotask(() => {
      const table = (document.activeElement as HTMLElement)?.closest('table');
      table?.querySelectorAll<HTMLInputElement>('tbody tr:last-child td:first-child input')?.[0]?.focus();
    });
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
  }

  lineTotalFor(index: number): number {
    const group = this.items.at(index);
    if (!group) return 0;
    const quantity = Number(group.get('quantity')?.value ?? 0);
    const unitPrice = Number(group.get('unitPrice')?.value ?? 0);
    const total = quantity * unitPrice;
    return Number.isFinite(total) ? total : 0;
  }

  /** Sum of all line totals */
  total(): number {
    return this.items.controls.reduce((sum, grp) => {
      const qty = Number(grp.get('quantity')?.value ?? 0);
      const price = Number(grp.get('unitPrice')?.value ?? 0);
      const line = qty * price;
      return sum + (Number.isFinite(line) ? line : 0);
    }, 0);
  }

  /** Number of distinct item lines (change to sum of quantities if desired) */
  itemsCount(): number {
    return this.items.length;
  }

  /** Keyboard helpers */
  @HostListener('document:keydown.escape') onEsc() {
    if (this.open) this.close();
  }
  onBackdrop() {
    this.close();
  }
  focusRow(i: number) {
    const rows = this.unitPriceInputs?.toArray() ?? [];
    rows[i]?.nativeElement?.focus();
  }
  focusNext(i: number, _field: 'unitPrice') {
    this.focusRow(i);
  }

  /** Reset when closing */
  close() {
    this.submitted.set(false);
    // Clear the array safely
    while (this.items.length) this.items.removeAt(0);
    this.form.reset({ customerId: '' });
    this.closed.emit();
  }

  /** Submit payload in your expected shape */
  submit() {
    this.submitted.set(true);
    if (this.form.invalid || this.items.length === 0) return;

    const items = this.items.controls.map(grp => {
      const sku = String(grp.get('sku')?.value ?? '').trim();
      const supplierId = String(grp.get('supplierId')?.value ?? '').trim();
      const quantity = Number(grp.get('quantity')?.value ?? 0);
      const unitPrice = Number(grp.get('unitPrice')?.value ?? 0);
      const lineTotal = Number((quantity * unitPrice).toFixed(2));
      return { sku, supplierId, quantity, unitPrice, lineTotal };
    });

    const payload = {
      customerId: (this.form.value.customerId || '').trim() || undefined,
      items,
      total: Number(this.total().toFixed(2)),
      itemsCount: this.itemsCount(), // or items.reduce((a,i)=>a+i.quantity,0)
      metadata: {},
    };

    this.submittedOrder.emit(payload);
    this.close();
  }
}
