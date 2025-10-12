import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { randomUUID } from 'crypto';

interface RequestWithTraceId extends Request {
  traceId?: string;
}

@Injectable()
export class TraceIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<RequestWithTraceId>();
    const res = context.switchToHttp().getResponse<Response>();

    const inboundId =
      req.headers['x-request-id']?.toString() ||
      req.headers['x-correlation-id']?.toString() ||
      (globalThis.crypto && 'randomUUID' in globalThis.crypto
        ? globalThis.crypto.randomUUID()
        : randomUUID());

    req.traceId = inboundId;
    res.setHeader('x-request-id', inboundId);
    res.setHeader('x-correlation-id', inboundId);

    return next.handle();
  }
}
