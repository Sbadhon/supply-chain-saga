import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
@Injectable()
export class TraceIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const inboundId =
      req.headers['x-request-id'] ||
      req.headers['x-correlation-id'] ||
      (globalThis.crypto && 'randomUUID' in globalThis.crypto
        ? globalThis.crypto.randomUUID()
        : require('crypto').randomUUID());
    (req as any).traceId = inboundId;
    res.setHeader('x-request-id', inboundId);
    res.setHeader('x-correlation-id', inboundId);
    return next.handle();
  }
}
