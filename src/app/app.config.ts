import {
  ApplicationConfig,
  provideZoneChangeDetection,
  isDevMode,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideState, provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { ordersReducer } from './store/orders/orders.reducers';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { OrdersEffects } from './store/orders/orders.effects';
import { TraceIdInterceptor } from './core/interceptors/trace-id.interceptor';
import { InventoryEffects } from './store/inventory/api/inventory.api.effects';
import { inventoryFeature } from './store/inventory/state/inventory.feature';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(withInterceptorsFromDi()),
    // { provide: HTTP_INTERCEPTORS, useClass: TraceIdInterceptor, multi: true },
    provideRouter(routes),
    provideStore({
      orders: ordersReducer,
    }),
    provideState(inventoryFeature),
    provideEffects([
      OrdersEffects,
      InventoryEffects
    ]),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() })
  ],
};
