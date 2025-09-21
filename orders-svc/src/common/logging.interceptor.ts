import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const start = Date.now();
    const traceId = (req as any).traceId || req.headers['x-request-id'] || '-';
    const { method, url } = req;
    return next.handle().pipe(tap(() => {
      const ms = Date.now() - start;
      const status = res.statusCode;
      console.log(JSON.stringify({ level: 'info', msg: 'http', method, url, status, ms, traceId }));
    }));
  }
}
