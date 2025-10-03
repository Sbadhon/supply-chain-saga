import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import {
  Shipment,
  ShipmentEvent,
  CreateShipmentDto,
  CancelShipmentDto,
} from './shipping.model';
import { IDEMPOTENCY_CTX } from '@app/core/interceptors/idempotency.interceptor';

@Injectable({ providedIn: 'root' })
export class ShippingService {
  private readonly base = `${environment.apiBaseUrl}/v1/shipping/shipments`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Shipment[]> {
    return this.http.get<Shipment[]>(this.base);
  }

  getById(id: string): Observable<Shipment> {
    return this.http.get<Shipment>(`${this.base}/${id}`);
  }

  create(
    dto: CreateShipmentDto,
    idempotencyKey?: string,
  ): Observable<Shipment> {
    const context = idempotencyKey
      ? new HttpContext().set(IDEMPOTENCY_CTX, idempotencyKey)
      : new HttpContext();
    return this.http.post<Shipment>(this.base, dto, { context });
  }

  cancel(
    dto: CancelShipmentDto,
    idempotencyKey?: string,
  ): Observable<Shipment> {
    const context = idempotencyKey
      ? new HttpContext().set(IDEMPOTENCY_CTX, idempotencyKey)
      : new HttpContext();
    return this.http.post<Shipment>(`${this.base}/cancel`, dto, { context });
  }

  getEvents(id: string): Observable<ShipmentEvent[]> {
    return this.http.get<ShipmentEvent[]>(`${this.base}/${id}/events`);
  }
}
