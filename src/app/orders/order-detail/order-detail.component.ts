// order-detail.component.ts (NgRx + HttpClient wired)
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AsyncPipe, DatePipe, CurrencyPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom, map } from 'rxjs';
import * as OrdersActions from '@app/store/orders/orders.actions';
import * as OrdersSelectors from '@app/store/orders/orders.selectors';
import { Order } from '@app/store/orders/order.model';

export type OrderStatus =
  | 'PENDING'
  | 'RESERVED'
  | 'PAID'
  | 'SHIPPED'
  | 'CANCELED';

export interface TimelineStep {
  state: string;
  at: Date;
  delta?: string;
  compensated?: boolean;
}

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, AsyncPipe, DatePipe, CurrencyPipe],
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderDetailComponent {
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) this.store.dispatch(OrdersActions.loadOrderById({ id }));
    });
  }

  readonly order$ = this.store.select(OrdersSelectors.selectSelectedOrder);
  readonly loading$ = this.store.select(OrdersSelectors.selectOrdersLoading);
  readonly error$ = this.store.select(OrdersSelectors.selectOrdersError);

  readonly timeline$ = this.order$.pipe(
    map((order) => {
      if (!order) return [] as TimelineStep[];
      const created = new Date(order.createdAt);
      const updated = new Date(order.updatedAt);
      const steps: TimelineStep[] = [{ state: 'PENDING', at: created }];
      if (updated.getTime() !== created.getTime()) {
        steps.push({ state: order.status, at: updated });
        steps.forEach((s, i) => {
          if (i > 0) s.delta = this.humanDelta(steps[i - 1].at, s.at);
        });
      }
      return steps;
    }),
  );

  humanDelta(a: Date, b: Date): string {
    const ms = Math.abs(b.getTime() - a.getTime());
    const h = Math.floor(ms / 3_600_000),
      m = Math.floor((ms % 3_600_000) / 60_000);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }

  statusClass(status: string): string {
    return (
      {
        PENDING: 'badge-pill bg-slate',
        RESERVED: 'badge-pill bg-cyan',
        PAID: 'badge-pill bg-green',
        SHIPPED: 'badge-pill bg-olive',
        CANCELED: 'badge-pill bg-rose',
      }[status] ?? 'badge-pill bg-muted'
    );
  }

  async copyTrace(): Promise<void> {
    const order = await firstValueFrom(this.order$);
    if (!order) return;
    const text = JSON.stringify(order, null, 2);
    await navigator.clipboard?.writeText(text);
  }

  approve(id: string): void {
   this.store.dispatch(OrdersActions.approveOrder({ id }));
  }
  cancel(id: string): void {
   this.store.dispatch(OrdersActions.cancelOrder({ id }));
  }

  computeTotal(order: Order): number {
    if (typeof (order as any).total === 'number') {
      return (order as any).total!;
    }
  
    const items = order.items ?? [];
  
    return items.reduce((sum, item) => {
      return sum + item.quantity * item.unitPrice;
    }, 0);
  }
  
}
