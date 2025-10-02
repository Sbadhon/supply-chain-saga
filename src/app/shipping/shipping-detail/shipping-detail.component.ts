import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';

import * as ShipActions from '@app/store/shipping/shipping.actions';
import * as ShipSelectors from '@app/store/shipping/shipping.selectors';
import { Shipment } from '@app/store/shipping/shipping.model';

@Component({
  selector: 'app-shipping-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './shipping-detail.component.html',
  styleUrls: ['./shipping-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShippingDetailComponent implements OnDestroy {
  shipment$!: Observable<Shipment | undefined>;
  loading$: Observable<boolean>;
  error$: Observable<string | undefined>;

  private sub?: Subscription;

  constructor(
    private store: Store,
    route: ActivatedRoute,
  ) {
    this.sub = route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.store.dispatch(ShipActions.loadShipmentById({ id }));
        this.shipment$ = this.store.select(
          ShipSelectors.selectSelectedShipment,
        );
      }
    });
    this.loading$ = this.store.select(ShipSelectors.selectShipmentsLoading);
    this.error$ = this.store.select(ShipSelectors.selectShipmentsError);
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  cancel(id: string): void {
    this.store.dispatch(ShipActions.cancelShipment({ dto: { id } }));
  }
}
