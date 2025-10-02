import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';
import { PaymentSummary, PaymentEvent } from './payment.model';

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

  createPayment(payment: PaymentSummary, idempotencyKey?: string): Observable<PaymentSummary> {
    const headers = idempotencyKey ? new HttpHeaders({ 'X-Idempotency-Key': idempotencyKey }) : undefined;
    return this.http.post<PaymentSummary>(this.baseUrl, payment, { headers });
  }

  getEvents(paymentId: string): Observable<PaymentEvent[]> {
    return this.http.get<PaymentEvent[]>(`${this.baseUrl}/${paymentId}/events`);
  }

  retry(paymentId: string): Observable<PaymentSummary> {
    return this.http.post<PaymentSummary>(`${this.baseUrl}/${paymentId}/retry`, {});
  }

  cancel(paymentId: string): Observable<PaymentSummary> {
    return this.http.post<PaymentSummary>(`${this.baseUrl}/${paymentId}/void`, {});
  }
}
