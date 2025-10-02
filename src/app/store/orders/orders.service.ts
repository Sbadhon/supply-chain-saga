import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Order } from './order.model';
import { environment } from 'environments/environment';

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

  createOrder(
    order: Partial<Order>,
    idempotencyKey: string,
  ): Observable<Order> {
    return this.http.post<Order>(this.baseUrl, order, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
  }

  approveOrder(id: string): Observable<Order> {
    return this.http.post<Order>(`${this.baseUrl}/${id}/approve`, {});
  }
  
  cancelOrder(id: string): Observable<Order> {
    return this.http.post<Order>(`${this.baseUrl}/${id}/cancel`, {});
  }
}
