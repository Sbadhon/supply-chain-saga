import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { interval, Observable, Subject, takeUntil } from 'rxjs';
import {
  PaymentEvent,
  PaymentStatus,
  PaymentSummary,
} from '@app/store/payment/payment.model';
import * as PaymentsActions from '@app/store/payment/payment.actions';
import * as PaymentsSelectors from '@app/store/payment/payment.selectors';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-payment-status',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './payment-status.component.html',
  styleUrls: ['./payment-status.component.scss'],
})
export class PaymentStatusComponent implements OnInit, OnDestroy {
  @Input({ required: true })
  id: string = '3c618105-7171-4ec8-8450-9a0fc3a2a5b2';

  payment$: Observable<PaymentSummary | undefined>;
  events$: Observable<PaymentEvent[]>;
  loading$: Observable<boolean>;
  error$: Observable<string | undefined>;

  private destroy$ = new Subject<void>();
  badgeClass = computed(() => '');

  constructor(private store: Store) {
    this.payment$ = this.store.select(
      PaymentsSelectors.selectPaymentById(this.id),
    );
    this.events$ = this.store.select(
      PaymentsSelectors.selectEventsForPayment(this.id),
    );
    this.loading$ = this.store.select(PaymentsSelectors.selectPaymentsLoading);
    this.error$ = this.store.select(PaymentsSelectors.selectPaymentsError);
  }

  ngOnInit(): void {
    this.store.dispatch(PaymentsActions.loadPaymentById({ id: this.id }));
    this.store.dispatch(
      PaymentsActions.loadPaymentEvents({ paymentId: this.id }),
    );

    interval(4000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.store.dispatch(PaymentsActions.loadPaymentById({ id: this.id }));
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onRetry(): void {
    this.store.dispatch(PaymentsActions.retryPayment({ paymentId: this.id }));
  }

  onCancel(): void {
    this.store.dispatch(PaymentsActions.cancelPayment({ paymentId: this.id }));
  }

  isTerminal(status?: PaymentStatus) : boolean{
    return (
      !!status &&
      [
        PaymentStatus.CAPTURED,
        PaymentStatus.REFUNDED,
        PaymentStatus.PARTIALLY_REFUNDED,
        PaymentStatus.VOIDED,
        PaymentStatus.FAILED,
        PaymentStatus.CANCELED,
        PaymentStatus.DISPUTED,
      ].includes(status)
    );
  }
}
