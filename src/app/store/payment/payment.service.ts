import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';
import {
  PaymentSummary,
  PaymentEvent,
  CreatePaymentInput,
} from './payment.model';
import { IDEMPOTENCY_CTX } from '@app/core/interceptors/idempotency.interceptor';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly baseUrl = `${environment.apiBaseUrl}/v1/payments`;
  constructor(private http: HttpClient) {}

  getPayments(): Observable<PaymentSummary[]> {
    return this.http.get<PaymentSummary[]>(this.baseUrl);
  }

  getPaymentById(id: string): Observable<PaymentSummary> {
    return this.http.get<PaymentSummary>(`${this.baseUrl}/${id}`);
  }

  createPayment(
    payment: CreatePaymentInput,
    idempotencyKey?: string,
  ): Observable<PaymentSummary> {
    const context = idempotencyKey
      ? new HttpContext().set(IDEMPOTENCY_CTX, idempotencyKey)
      : new HttpContext();
    return this.http.post<PaymentSummary>(this.baseUrl, payment, { context });
  }

  getEvents(paymentId: string): Observable<PaymentEvent[]> {
    return this.http.get<PaymentEvent[]>(`${this.baseUrl}/${paymentId}/events`);
  }

  retry(
    paymentId: string,
    idempotencyKey?: string,
  ): Observable<PaymentSummary> {
    const context = idempotencyKey
      ? new HttpContext().set(IDEMPOTENCY_CTX, idempotencyKey)
      : new HttpContext();
    return this.http.post<PaymentSummary>(
      `${this.baseUrl}/${paymentId}/retry`,
      {},
      { context },
    );
  }

  cancel(
    paymentId: string,
    idempotencyKey?: string,
  ): Observable<PaymentSummary> {
    const context = idempotencyKey
      ? new HttpContext().set(IDEMPOTENCY_CTX, idempotencyKey)
      : new HttpContext();
    return this.http.post<PaymentSummary>(
      `${this.baseUrl}/${paymentId}/void`,
      {},
      { context },
    );
  }
}
