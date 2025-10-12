import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

interface RequestWithTraceId extends Request {
  traceId?: string;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<RequestWithTraceId>();
    const res = context.switchToHttp().getResponse<Response>();
    const start = Date.now();

    const traceId = req.traceId ?? req.headers['x-request-id'] ?? '-';
    const { method, url } = req;

    return next.handle().pipe(
      tap(() => {
        const ms = Date.now() - start;
        const status = res.statusCode;

        console.log(
          JSON.stringify({
            level: 'info',
            msg: 'http',
            method,
            url,
            status,
            ms,
            traceId,
          }),
        );
      }),
    );
  }
}
