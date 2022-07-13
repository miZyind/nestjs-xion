import { Injectable } from '@nestjs/common';

import { DEFAULT_CRUD_LIMIT, DEFAULT_CRUD_PAGE } from './constant';

import type {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
} from '@nestjs/common';
import type { CRUDRequest, Request } from './interface';

type QueryParam = string[] | string | undefined;

@Injectable()
export class CRUDInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): ReturnType<CallHandler['handle']> {
    const req = context
      .switchToHttp()
      .getRequest<Request & { query: Record<string, QueryParam> }>();

    req.NESTJS_XION_CRUD_REQUEST = {
      search: { $and: [this.parseSearchQueryParam(req.query.s)] },
      limit: this.parseNumberQueryParam(req.query.limit) ?? DEFAULT_CRUD_LIMIT,
      page: this.parseNumberQueryParam(req.query.page) ?? DEFAULT_CRUD_PAGE,
    };

    return next.handle();
  }

  private parseSearchQueryParam(value: QueryParam): CRUDRequest['search'] {
    return typeof value === 'string'
      ? (JSON.parse(value) as CRUDRequest['search'])
      : {};
  }

  private parseNumberQueryParam(value: QueryParam): number | null {
    return typeof value === 'string' ? Number(value) : null;
  }
}
