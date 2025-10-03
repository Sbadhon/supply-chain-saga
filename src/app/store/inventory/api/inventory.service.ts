import { HttpClient, HttpContext } from '@angular/common/http';
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
} from './inventory.model';
import { environment } from 'environments/environment';
import { IDEMPOTENCY_CTX } from '@app/core/interceptors/idempotency.interceptor';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly baseUrl = `${environment.apiBaseUrl}/v1/inventory`;
  constructor(private http: HttpClient) {}

  getInventory(): Observable<Inventory[]> {
    return this.http.get<Inventory[]>(this.baseUrl);
  }

  getInventoryBySku(sku: string): Observable<Inventory> {
    return this.http.get<Inventory>(
      `${this.baseUrl}/${encodeURIComponent(sku)}`,
    );
  }

  getHistory(id: string): Observable<InventoryEvent[]> {
    return this.http.get<InventoryEvent[]>(
      `${this.baseUrl}/${encodeURIComponent(id)}/history`,
    );
  }

  release(
    body: ReleaseRequest,
    idempotencyKey?: string,
  ): Observable<Inventory> {
    const context = idempotencyKey
      ? new HttpContext().set(IDEMPOTENCY_CTX, idempotencyKey)
      : new HttpContext();
    return this.http.post<Inventory>(`${this.baseUrl}/release`, body, {
      context,
    });
  }

  commit(body: CommitRequest, idempotencyKey?: string): Observable<Inventory> {
    const context = idempotencyKey
      ? new HttpContext().set(IDEMPOTENCY_CTX, idempotencyKey)
      : new HttpContext();
    return this.http.post<Inventory>(`${this.baseUrl}/commit`, body, {
      context,
    });
  }

  reserve(
    body: ReserveRequest,
    idempotencyKey?: string,
  ): Observable<Inventory> {
    const context = idempotencyKey
      ? new HttpContext().set(IDEMPOTENCY_CTX, idempotencyKey)
      : new HttpContext();
    return this.http.post<Inventory>(`${this.baseUrl}/reserve`, body, {
      context,
    });
  }

  adjust(body: AdjustRequest, idempotencyKey?: string): Observable<Inventory> {
    const context = idempotencyKey
      ? new HttpContext().set(IDEMPOTENCY_CTX, idempotencyKey)
      : new HttpContext();
    return this.http.post<Inventory>(`${this.baseUrl}/adjust`, body, {
      context,
    });
  }

  move(body: MovePayload, idempotencyKey?: string): Observable<Inventory> {
    const context = idempotencyKey
      ? new HttpContext().set(IDEMPOTENCY_CTX, idempotencyKey)
      : new HttpContext();
    return this.http.post<Inventory>(`${this.baseUrl}/move`, body, { context });
  }
}
