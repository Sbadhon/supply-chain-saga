import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { TRACE_ID_HEADER } from './tracing.constants';

function makeTraceparent(existing?: string) {
  if (existing && existing.split('-').length === 4) return existing;
  const traceId = randomBytes(16).toString('hex');
  const spanId = randomBytes(8).toString('hex');
  return `00-${traceId}-${spanId}-01`;
}

@Injectable()
export class TracingMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    const incomingTp = req.header('traceparent');
    const traceparent = makeTraceparent(incomingTp);
    const traceId = traceparent.split('-')[1];

    req.traceId = traceId;
    req.headers['traceparent'] = traceparent;
    res.setHeader(TRACE_ID_HEADER, traceId);

    next();
  }
}
