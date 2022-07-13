import { createParamDecorator } from '@nestjs/common';

import { NESTJS_XION_CRUD_REQUEST } from './constant';

import type { ArgumentsHost } from '@nestjs/common';
import type { Request } from './interface';

function getContextRequest(ctx: ArgumentsHost): unknown {
  return typeof ctx.switchToHttp() === 'function'
    ? ctx.switchToHttp().getRequest()
    : ctx;
}

export const ParsedRequest = createParamDecorator(
  (_, ctx: ArgumentsHost): ParameterDecorator =>
    (getContextRequest(ctx) as Request)[
      NESTJS_XION_CRUD_REQUEST
    ] as unknown as ParameterDecorator,
);
