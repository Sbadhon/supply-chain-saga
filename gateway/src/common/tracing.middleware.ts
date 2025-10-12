import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';
import { TRACE_ID_HEADER } from './tracing.constants';

type ReqWithTrace = Request & { traceId?: string };

function makeTraceparent(existing?: string): string {
  if (existing && existing.split('-').length === 4) return existing;
  const traceId = randomBytes(16).toString('hex');
  const spanId = randomBytes(8).toString('hex');
  return `00-${traceId}-${spanId}-01`;
}

@Injectable()
export class TracingMiddleware implements NestMiddleware {
  use(req: ReqWithTrace, res: Response, next: NextFunction): void {
    const incomingTp: string | undefined = req.get('traceparent');
    const traceparent = makeTraceparent(incomingTp);
    const traceId = traceparent.split('-')[1] ?? '';

    req.traceId = traceId;

    // Propagate to downstream handlers in this request lifecycle
    req.headers['traceparent'] = traceparent;

    // Expose trace id to the client / upstream
    res.setHeader(TRACE_ID_HEADER, traceId);

    next();
  }
}
