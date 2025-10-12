import {
  BadRequestException,
  ConflictException,
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { from, of, Observable } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { IDEMPOTENCY_KEY_HEADER } from './tracing.constants';
import { IdempotencyService } from './idempotency.service';

type UnsafeMethod = 'POST' | 'PUT' | 'PATCH' | 'DELETE';
const UNSAFE_METHODS: ReadonlySet<UnsafeMethod> = new Set([
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
]);

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private readonly idem: IdempotencyService) {}

  intercept(
    ctx: ExecutionContext,
    next: CallHandler<unknown>,
  ): Observable<unknown> {
    const http = ctx.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    if (!UNSAFE_METHODS.has(req.method as UnsafeMethod)) {
      return next.handle();
    }

    const key = req.header(IDEMPOTENCY_KEY_HEADER);
    if (!key) {
      throw new BadRequestException(`Missing ${IDEMPOTENCY_KEY_HEADER} header`);
    }

    const route = (req.originalUrl || req.url || '').split('?')[0];
    const reqHash = this.idem.reqHash(req.body);

    return from(this.idem.reserve(req.method, route, key, reqHash)).pipe(
      switchMap((r) => {
        if (r.kind === 'hash_conflict') {
          throw new ConflictException(
            'Idempotency-Key already used with a different request body',
          );
        }

        if (r.kind === 'already_done' && r.record) {
          res.status(r.record.status ?? 200);
          return of(r.record.body);
        }

        if (r.kind === 'already_pending') {
          throw new ConflictException(
            'Request with the same Idempotency-Key is already processing',
          );
        }

        // Reserved the key; proceed and then finalize
        return next
          .handle()
          .pipe(
            switchMap((responseBody) =>
              from(
                this.idem.finalize(
                  req.method,
                  route,
                  key,
                  reqHash,
                  res.statusCode ?? 200,
                  responseBody,
                ),
              ).pipe(map(() => responseBody)),
            ),
          );
      }),
    );
  }
}
