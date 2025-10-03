import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateOrderInput, Order } from './order.model';
import { environment } from 'environments/environment';
import { IDEMPOTENCY_CTX } from '../../core/interceptors/idempotency.interceptor';

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly baseUrl = `${environment.apiBaseUrl}/v1/orders`;
  constructor(private http: HttpClient) {}

  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(this.baseUrl);
  }

  getOrderById(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.baseUrl}/${id}`);
  }

  createOrder(order: CreateOrderInput, idempotencyKey?: string): Observable<Order> {
    const ctx = idempotencyKey
      ? new HttpContext().set(IDEMPOTENCY_CTX, idempotencyKey)
      : new HttpContext(); // interceptor will auto-generate if not provided
    return this.http.post<Order>(this.baseUrl, order, { context: ctx });
  }

  approveOrder(id: string, idempotencyKey?: string): Observable<Order> {
    const ctx = idempotencyKey
      ? new HttpContext().set(IDEMPOTENCY_CTX, idempotencyKey)
      : new HttpContext();
    return this.http.post<Order>(`${this.baseUrl}/${id}/approve`, {}, { context: ctx });
  }

  cancelOrder(id: string, idempotencyKey?: string): Observable<Order> {
    const ctx = idempotencyKey
      ? new HttpContext().set(IDEMPOTENCY_CTX, idempotencyKey)
      : new HttpContext();
    return this.http.post<Order>(`${this.baseUrl}/${id}/cancel`, {}, { context: ctx });
  }
}
