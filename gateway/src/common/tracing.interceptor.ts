import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { TRACE_ID_HEADER } from './tracing.constants';

@Injectable()
export class TracingInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const req = ctx.switchToHttp().getRequest();
    const traceId = req?.traceId;
    return next.handle().pipe(
      tap(() => {
        if (traceId) {
          console.log(`[traceId=${traceId}] ${req.method} ${req.originalUrl}`);
        }
      })
    );
  }
}
