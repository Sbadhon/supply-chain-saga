import {
    CallHandler, ExecutionContext, Injectable, NestInterceptor, BadRequestException, ConflictException,
  } from '@nestjs/common';
  import { Observable, from, switchMap, tap } from 'rxjs';
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
  
      const route = req.originalUrl.split('?')[0];
      const bodyHash = this.idem.bodyHash(req.body);
  
      return from(this.idem.get(route, key)).pipe(
        switchMap((cached) => {
          if (cached) {
            if (cached.bodyHash !== bodyHash) {
              throw new ConflictException('Idempotency-Key already used with different request body');
            }
            res.status(cached.status);
            return from(Promise.resolve(cached.body));
          }
          return next.handle().pipe(
            tap(async (responseBody) => {
              const status = res.statusCode ?? 200;
              await this.idem.set(route, key, responseBody, status);
            })
          );
        })
      );
    }
  }
  