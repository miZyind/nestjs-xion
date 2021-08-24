import { map } from 'rxjs/operators';

import { Injectable } from '@nestjs/common';
import { CrudRequestInterceptor } from '@nestjsx/crud';

import { hasValue } from './guarder';

import type { Observable } from 'rxjs';
import type {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
} from '@nestjs/common';
import type { CrudRequest } from '@nestjsx/crud';
import type { StandardList, StandardResponse } from './model';

export const DEFAULT_PAGINATION_LIMIT = 8;
export const DEFAULT_PAGINATION_PAGE = 1;

@Injectable()
export class PaginationInterceptor extends CrudRequestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): ReturnType<CallHandler['handle']> {
    super.intercept(context, next);

    const req = context.switchToHttp().getRequest<{
      // eslint-disable-next-line @typescript-eslint/naming-convention -- NestJS' consistent key name
      NESTJSX_PARSED_CRUD_REQUEST_KEY?: CrudRequest;
    }>();

    if (hasValue(req.NESTJSX_PARSED_CRUD_REQUEST_KEY)) {
      const {
        parsed: { limit, page },
      } = req.NESTJSX_PARSED_CRUD_REQUEST_KEY;

      req.NESTJSX_PARSED_CRUD_REQUEST_KEY.parsed.limit = limit
        ? limit
        : DEFAULT_PAGINATION_LIMIT;

      req.NESTJSX_PARSED_CRUD_REQUEST_KEY.parsed.page = page
        ? page
        : DEFAULT_PAGINATION_PAGE;
    }

    return next.handle();
  }
}

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
