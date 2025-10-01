import { asProblem } from '../http.js';

export function errorHandler(err, req, res, _next) {
  const status = err.status ?? 500;
  const detail = err.detail ?? err.message ?? 'Internal Error';
  res.status(status).type('application/problem+json')
     .json(asProblem(status, 'Error', detail, { ...errors, traceId: req.traceId }));
}