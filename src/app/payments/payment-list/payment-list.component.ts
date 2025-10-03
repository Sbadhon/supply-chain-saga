import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import * as PaymentsActions from '@app/store/payment/payment.actions';
import * as PaymentsSelectors from '@app/store/payment/payment.selectors';
import {
  CreatePaymentInput,
  PaymentStatus,
  PaymentSummary,
} from '@app/store/payment/payment.model';
import { PaymentCreateModalComponent } from '../payment-create-modal/payment-create-modal.component';
import { clearCreatePaymentKey, getCreatePaymentKey, setCreatePaymentKey } from '@app/core/http/idempotency-storage.util';

type SortKey = 'createdAt' | 'amount' | 'status' | 'orderId';
type SortDir = 'asc' | 'desc';

@Component({
  selector: 'app-payment-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    PaymentCreateModalComponent,
  ],
  templateUrl: './payment-list.component.html',
  styleUrls: ['./payment-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentListComponent implements OnInit, OnDestroy {
  query = signal<string>('');
  status = signal<string>('ALL');
  sortKey = signal<SortKey>('createdAt');
  sortDir = signal<SortDir>('desc');
  page = signal<number>(1);
  pageSize = signal<number>(10);
  pageSizeValue = 10;
  payments$: Observable<PaymentSummary[]>;
  loading$: Observable<boolean>;
  error$: Observable<string | undefined>;

  private sub?: Subscription;
  showCreatePaymentModal = signal(false);
  statuses = [
    'ALL',
    PaymentStatus.NEW,
    PaymentStatus.PROCESSING,
    PaymentStatus.REQUIRES_ACTION,
    PaymentStatus.AUTHORIZED,
    PaymentStatus.CAPTURED,
    PaymentStatus.DECLINED,
    PaymentStatus.FAILED,
    PaymentStatus.VOIDED,
    PaymentStatus.REFUNDED,
    PaymentStatus.PARTIALLY_REFUNDED,
    PaymentStatus.DISPUTED,
    PaymentStatus.CANCELED,
  ];

  constructor(private store: Store) {
    this.payments$ = this.store.select(PaymentsSelectors.selectAllPayments);
    this.loading$ = this.store.select(PaymentsSelectors.selectPaymentsLoading);
    this.error$ = this.store.select(PaymentsSelectors.selectPaymentsError);
  }

  ngOnInit(): void {
    this.store.dispatch(PaymentsActions.loadPayments());
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

  openCreatePaymentModal(): void {
    const key = getCreatePaymentKey() ?? crypto.randomUUID().replace(/-/g, '');
    setCreatePaymentKey(key);
    this.showCreatePaymentModal.set(true);
  }

  cancelCreatePayment(): void {
    // User cancelled 
    // clear the key so next attempt is fresh
    clearCreatePaymentKey();
    this.showCreatePaymentModal.set(false);
  }

  submitCreatePayment(payload: { orderId: string; amount: number; currency: string; method?: string }) {
    const idempotencyKey = getCreatePaymentKey() ?? crypto.randomUUID().replace(/-/g, '');

    const body: CreatePaymentInput = {
      orderId: payload.orderId,
      amount: payload.amount,
      currency: payload.currency,
      method: payload.method,
    };

    this.store.dispatch(PaymentsActions.createPayment({ payment: body, idempotencyKey }));
    this.showCreatePaymentModal.set(false);
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

  filteredSortedPaged(payments: PaymentSummary[]): PaymentSummary[] {
    const query = this.query();
    const status = this.status();
    const key = this.sortKey();
    const dir = this.sortDir();
    const page = this.page();
    const pageSize = this.pageSize();

    let list = (payments ?? []).slice();

    if (query) {
      list = list.filter(
        (payment) =>
          (payment.id?.toLowerCase() ?? '').includes(query) ||
          (payment.orderId?.toLowerCase() ?? '').includes(query) ||
          (payment.currency?.toLowerCase() ?? '').includes(query) ||
          (payment.methodSummary?.toLowerCase() ?? '').includes(query),
      );
    }
    if (status !== 'ALL') {
      list = list.filter((p) => p.status === status);
    }

    list.sort((a, b) => {
      const va =
        key === 'createdAt'
          ? new Date(a.createdAt).getTime()
          : key === 'amount'
            ? a.amount
            : key === 'status'
              ? a.status
              : a.orderId;

      const vb =
        key === 'createdAt'
          ? new Date(b.createdAt).getTime()
          : key === 'amount'
            ? b.amount
            : key === 'status'
              ? b.status
              : b.orderId;

      if (va < (vb as any)) return dir === 'asc' ? -1 : 1;
      if (va > (vb as any)) return dir === 'asc' ? 1 : -1;
      return 0;
    });

    const start = (page - 1) * pageSize;
    return list.slice(start, start + pageSize);
  }

  totalAfterFilter(payments: PaymentSummary[]): number {
    const status = this.status();
    return (payments ?? []).filter((payment) => {
      const okQ =
        !this.query() ||
        payment.id?.toLowerCase().includes(this.query()) ||
        payment.orderId?.toLowerCase().includes(this.query()) ||
        payment.currency?.toLowerCase().includes(this.query()) ||
        (payment.methodSummary?.toLowerCase().includes(this.query()) ?? false);
      const okS = status === 'ALL' || payment.status === status;
      return okQ && okS;
    }).length;
  }

  pageCount(payments: PaymentSummary[]): number {
    const total = this.totalAfterFilter(payments);
    const ps = this.pageSize();
    return Math.max(1, Math.ceil(total / ps));
  }

  nextPage(payments: PaymentSummary[]): void {
    const max = this.pageCount(payments);
    this.page.set(Math.min(max, this.page() + 1));
  }

  prevPage(): void {
    this.page.set(Math.max(1, this.page() - 1));
  }

  trackById(_: number, p: PaymentSummary) {
    return p.id;
  }
}
