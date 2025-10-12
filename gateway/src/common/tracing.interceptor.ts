import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { TRACE_ID_HEADER } from './tracing.constants';

type ReqWithTrace = Request & { traceId?: string };

@Injectable()
export class TracingInterceptor implements NestInterceptor {
  intercept(
    ctx: ExecutionContext,
    next: CallHandler<unknown>,
  ): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest<ReqWithTrace>();
    const traceId: string | undefined =
      req.traceId ?? req.header(TRACE_ID_HEADER) ?? undefined;

    return next.handle().pipe(
      tap(() => {
        if (traceId) {
          const path = req.originalUrl ?? req.url;
          console.log(`[traceId=${traceId}] ${req.method} ${path}`);
        }
      }),
    );
  }
}
