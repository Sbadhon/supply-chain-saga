import { Injectable } from '@angular/core';
import {
  HttpInterceptor, HttpRequest, HttpHandler, HttpEvent,
  HttpContextToken, HttpContext
} from '@angular/common/http';
import { Observable } from 'rxjs';

const NON_IDEMPOTENT = new Set(['POST','PUT','PATCH','DELETE']);
export const IDEMPOTENCY_CTX = new HttpContextToken<string | null>(() => null);

function makeKey(): string {
  // RFC4122 UUID w/o dashes is fine for keys; server validates per service
  return crypto.randomUUID().replace(/-/g, '');
}

@Injectable()
export class IdempotencyInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!NON_IDEMPOTENT.has(req.method.toUpperCase())) {
      return next.handle(req); // GET/HEAD/OPTIONS
    }

    const existing = req.headers.get('Idempotency-Key') ?? req.context.get(IDEMPOTENCY_CTX);
    const key = existing ?? makeKey();

    const ctx: HttpContext = req.context.set(IDEMPOTENCY_CTX, key);

    const nextReq = req.clone({
      context: ctx,
      setHeaders: { 'Idempotency-Key': key }
    });

    return next.handle(nextReq);
  }
}
