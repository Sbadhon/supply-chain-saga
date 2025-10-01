import { v4 as uuid } from 'uuid';
const TRACE_ID_HEADER = 'x-trace-id';
export function tracing() {
  return (req, res, next) => {
    const incoming = req.header(TRACE_ID_HEADER);
    const traceId = incoming || uuid();
    req.traceId = traceId;
    res.setHeader(TRACE_ID_HEADER, traceId);
    next();
  };
}
