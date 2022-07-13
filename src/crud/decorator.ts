import { createParamDecorator } from '@nestjs/common';

import { NESTJS_XION_CRUD_REQUEST } from './constant';

import type { ExecutionContext } from '@nestjs/common';
import type { Request } from './interface';

export function ParsedRequest(): ParameterDecorator {
  return createParamDecorator(
    (_, ctx: ExecutionContext) =>
      ctx.switchToHttp().getRequest<Request>()[NESTJS_XION_CRUD_REQUEST],
  )();
}
