import { map } from 'rxjs/operators';

import { Injectable } from '@nestjs/common';

import type { Observable } from 'rxjs';
import type {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
} from '@nestjs/common';
import type { StandardList, StandardResponse } from './model';

type Result<T> = StandardResponse<StandardList<T> | T | null>;

@Injectable()
export class StandardResponseInterceptor<T>
  implements NestInterceptor<T, Result<T>>
{
  intercept(
    _: ExecutionContext,
    next: CallHandler<StandardList<T> | T | T[] | null>,
  ): Observable<Result<T>> {
    return next.handle().pipe(
      map((data) => ({
        code: 0,
        message: 'Success',
        data:
          data instanceof Array ? { data, total: data.length } : data ?? null,
      })),
    );
  }
}
