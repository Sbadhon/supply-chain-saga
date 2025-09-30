import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import { Shipment, ShipmentEvent, CreateShipmentDto, CancelShipmentDto } from './shipping.model';

@Injectable({ providedIn: 'root' })
export class ShippingService {
  private readonly base = `${environment.shipping_svc}/v1/shipping/shipments`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Shipment[]> {
    return this.http.get<Shipment[]>(this.base);
  }

  getById(id: string): Observable<Shipment> {
    return this.http.get<Shipment>(`${this.base}/${id}`);
  }

  create(dto: CreateShipmentDto): Observable<Shipment> {
    return this.http.post<Shipment>(this.base, dto);
  }

  cancel(dto: CancelShipmentDto): Observable<Shipment> {
    return this.http.post<Shipment>(`${this.base}/cancel`, dto);
  }

  // Optional timeline endpoint
  getEvents(id: string): Observable<ShipmentEvent[]> {
    return this.http.get<ShipmentEvent[]>(`${this.base}/${id}/events`);
  }
}
