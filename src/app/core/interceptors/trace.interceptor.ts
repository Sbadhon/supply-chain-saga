import { Injectable } from '@angular/core';
import {
  HttpInterceptor, HttpRequest, HttpHandler, HttpEvent,
  HttpContextToken, HttpContext
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { makeTraceparent, extractTraceId } from '../http/trace.util';

// Reuse across retries/clones
export const TRACEPARENT_CTX = new HttpContextToken<string | null>(() => null);

@Injectable()
export class TraceInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const existingTp = req.headers.get('traceparent') ?? req.context.get(TRACEPARENT_CTX) ?? undefined;
    const traceparent = makeTraceparent(existingTp);
    const traceId = extractTraceId(traceparent) ?? '';

    const ctx: HttpContext = req.context.set(TRACEPARENT_CTX, traceparent);

    const nextReq = req.clone({
      context: ctx,
      setHeaders: {
        traceparent,
        'X-Trace-Id': traceId, // convenient for logs/DevTools
      }
    });

    return next.handle(nextReq);
  }
}
