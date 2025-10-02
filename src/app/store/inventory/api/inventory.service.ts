import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Inventory,
  InventoryEvent,
  MovePayload,
  CommitRequest,
  ReserveRequest,
  ReleaseRequest,
  AdjustRequest,
} from '@app/store/inventory/api/inventory.model';
import { environment } from 'environments/environment';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly baseUrl = `${environment.apiBaseUrl}/v1/inventory`;

  constructor(private http: HttpClient) {}

  getInventory(): Observable<Inventory[]> {
    return this.http.get<Inventory[]>(this.baseUrl);
  }

  getInventoryBySku(sku: string): Observable<Inventory> {
    return this.http.get<Inventory>(`${this.baseUrl}/${encodeURIComponent(sku)}`);
  }

  getHistory(id: string): Observable<InventoryEvent[]> {
    return this.http.get<InventoryEvent[]>(`${this.baseUrl}/${encodeURIComponent(id)}/history`);
  }

  release(body: ReleaseRequest): Observable<Inventory> {
    return this.http.post<Inventory>(`${this.baseUrl}/release`, body);
  }
  
  commit(body: CommitRequest): Observable<Inventory> {
    return this.http.post<Inventory>(`${this.baseUrl}/commit`, body);
  }

  reserve(body: ReserveRequest): Observable<Inventory> {
    return this.http.post<Inventory>(`${this.baseUrl}/reserve`, body);
  }

  adjust(body: AdjustRequest): Observable<Inventory> {
    return this.http.post<Inventory>(`${this.baseUrl}/adjust`, body);
  }

  move(body: MovePayload): Observable<Inventory> {
    return this.http.post<Inventory>(`${this.baseUrl}/move`, body);
  }
}
