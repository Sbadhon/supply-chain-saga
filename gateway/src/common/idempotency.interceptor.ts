import {
  BadRequestException, ConflictException, Injectable, NestInterceptor, ExecutionContext, CallHandler
} from '@nestjs/common';
import { Observable, from, of, switchMap, tap } from 'rxjs';
import { IDEMPOTENCY_KEY_HEADER } from './tracing.constants';
import { IdempotencyService } from './idempotency.service';

const UNSAFE = new Set(['POST','PUT','PATCH','DELETE']);

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private readonly idem: IdempotencyService) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const http = ctx.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();

    if (!UNSAFE.has(req.method)) return next.handle();

    const key = req.header(IDEMPOTENCY_KEY_HEADER);
    if (!key) throw new BadRequestException(`Missing ${IDEMPOTENCY_KEY_HEADER} header`);

    const route = (req.originalUrl || req.url || '').split('?')[0];
    const reqHash = this.idem.reqHash(req.body);

    return from(this.idem.reserve(req.method, route, key, reqHash)).pipe(
      switchMap((r) => {
        if (r.kind === 'hash_conflict') {
          throw new ConflictException('Idempotency-Key already used with a different request body');
        }
        if (r.kind === 'already_done' && r.record) {
          res.status(r.record.status ?? 200);
          return of(r.record.body);
        }
        if (r.kind === 'already_pending') {
          // Another request with same key is in-flight. return 409 or 202.
          throw new ConflictException('Request with the same Idempotency-Key is already processing');
        }

        // Reserved the key; proceed and then finalize
        return next.handle().pipe(
          tap(async (responseBody) => {
            const status = res.statusCode ?? 200;
            await this.idem.finalize(req.method, route, key, reqHash, status, responseBody);
          })
        );
      })
    );
  }
}
