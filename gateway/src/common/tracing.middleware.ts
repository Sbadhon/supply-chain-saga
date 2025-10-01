import { Injectable, NestMiddleware } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { TRACE_ID_HEADER } from './tracing.constants';

@Injectable()
export class TracingMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    const incoming = req.header(TRACE_ID_HEADER);
    const traceId = incoming || uuid();
    req.traceId = traceId;
    res.setHeader(TRACE_ID_HEADER, traceId);
    next();
  }
}
