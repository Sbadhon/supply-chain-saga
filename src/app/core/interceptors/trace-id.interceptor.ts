import { Injectable } from '@angular/core';
import {
  HttpInterceptor, HttpRequest, HttpHandler, HttpEvent,
  HttpContextToken
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

// Keep a stable ID across retries/clone
export const TRACE_ID = new HttpContextToken<string | null>(() => null);
export const withTraceId = (id: string) => ({ context: new (HttpRequest as any).prototype.context.constructor().set(TRACE_ID, id) });

@Injectable()
export class TraceIdInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const inbound =
      req.headers.get('X-Trace-Id') ||
      req.headers.get('x-trace-id') ||
      req.context.get(TRACE_ID);

    const traceId = inbound || uuidv4();

    // Attach header + store in context so retries reuse it
    const nextReq = req.clone({
      setHeaders: { 'X-Trace-Id': traceId },
      context: req.context.set(TRACE_ID, traceId),
    });

    return next.handle(nextReq);
  }
}

