import {
  ApplicationConfig,
  provideZoneChangeDetection,
  isDevMode,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { provideState, provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { ordersReducer } from './store/orders/orders.reducers';
import {
  provideHttpClient,
  withInterceptors,
  withInterceptorsFromDi,
  HTTP_INTERCEPTORS,
} from '@angular/common/http';
import { OrdersEffects } from './store/orders/orders.effects';
import { InventoryEffects } from './store/inventory/api/inventory.api.effects';
import { inventoryFeature } from './store/inventory/state/inventory.feature';
import { PaymentEffects } from './store/payment/payment.effects';
import { paymentsReducer } from './store/payment/payment.reducers';
import { ShippingEffects } from './store/shipping/shipping.effects';
import { shipmentsReducer } from './store/shipping/shipping.reducers';

import { httpPrefixInterceptor } from './core/interceptors/http-prefix.interceptor';
import { TraceInterceptor } from './core/interceptors/trace.interceptor';
import { IdempotencyInterceptor } from './core/interceptors/idempotency.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),

    // Functional + DI-based class interceptors
    provideHttpClient(
      withInterceptors([httpPrefixInterceptor]),
      withInterceptorsFromDi(),
    ),

    // Provide class interceptors through DI (order matters)
    { provide: HTTP_INTERCEPTORS, useClass: TraceInterceptor, multi: true },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: IdempotencyInterceptor,
      multi: true,
    },

    provideRouter(routes, withComponentInputBinding()),
    provideStore({
      orders: ordersReducer,
      payments: paymentsReducer,
      shipments: shipmentsReducer,
    }),
    provideState(inventoryFeature),
    provideEffects([
      OrdersEffects,
      InventoryEffects,
      PaymentEffects,
      ShippingEffects
    ]),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() })
  ],
};
