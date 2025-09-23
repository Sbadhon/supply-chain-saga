import {
  ApplicationConfig,
  provideZoneChangeDetection,
  isDevMode,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { ordersReducer } from './store/orders/orders.reducers';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { OrdersEffects } from './store/orders/orders.effects';
import { TraceIdInterceptor } from './core/interceptors/trace-id.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(withInterceptorsFromDi()),
    // { provide: HTTP_INTERCEPTORS, useClass: TraceIdInterceptor, multi: true },
    provideRouter(routes),
    provideStore({
      orders: ordersReducer,
    }),
    provideEffects([
      OrdersEffects
    ]),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() })
  ],
};
