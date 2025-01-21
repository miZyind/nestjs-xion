import { HttpStatus, UseGuards, createParamDecorator } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiQuery, ApiResponse, ApiSecurity } from '@nestjs/swagger';

import { Standardized, StandardizedList } from './standardizer';

import type { ExecutionContext, Type } from '@nestjs/common';

export function StrategyGuard(name: string): MethodDecorator {
  return (...params): void => {
    UseGuards(AuthGuard(name))(...params);
    ApiSecurity(name)(...params);
  };
}

export function User(): ParameterDecorator {
  return createParamDecorator(
    (_, ctx: ExecutionContext) =>
      ctx.switchToHttp().getRequest<{ user: unknown }>().user,
  )();
}

interface ApiCrudQueriesConfig {
  search?: boolean;
  limit?: boolean;
  page?: boolean;
}

export function ApiCrudQueries(
  config: ApiCrudQueriesConfig = { search: true, limit: true, page: true },
) {
  return function Mixin<T>(
    target: object,
    key: string,
    descriptor: TypedPropertyDescriptor<T>,
  ): void {
    const search = Boolean(config.search);
    const limit = Boolean(config.limit);
    const page = Boolean(config.page);

    if (search) {
      ApiQuery({
        name: 's',
        type: 'string',
        required: false,
        description:
          'Adds search condition<h5><a target="_blank" href="https://github.com/nestjsx/crud/wiki/Requests#search">Documentation</a></h5>',
      })(target, key, descriptor);
    }
    if (limit) {
      ApiQuery({
        name: 'limit',
        type: 'integer',
        required: false,
        description:
          'Limit amount of resources<h5><a target="_blank" href="https://github.com/nestjsx/crud/wiki/Requests#limit">Documentation</a></h5><li>Minimum value: 1</li><li>Default value: 8</li>',
      })(target, key, descriptor);
    }
    if (page) {
      ApiQuery({
        name: 'page',
        type: 'integer',
        required: false,
        description:
          'Page portion of resources<h5><a target="_blank" href="https://github.com/nestjsx/crud/wiki/Requests#page">Documentation</a></h5><li>Minimum value: 1</li><li>Default value: 1</li>',
      })(target, key, descriptor);
    }
  };
}

interface ApiResponseOptions {
  status?: HttpStatus;
  description?: string;
}

export function ApiStandardResponse<T>(
  options?: ApiResponseOptions & { type?: Type<T> },
): MethodDecorator {
  return (...params): void => {
    ApiResponse({
      status: options?.status ?? HttpStatus.OK,
      type: Standardized(options?.type),
      description: options?.description,
    })(...params);
  };
}

export function ApiStandardListResponse<T>(
  options: ApiResponseOptions & { type: Type<T> },
): MethodDecorator;
export function ApiStandardListResponse(
  options: ApiResponseOptions & {
    type: 'string';
    dtoName: string;
    example: unknown[];
  },
): MethodDecorator;
export function ApiStandardListResponse<T>(
  options: ApiResponseOptions & {
    type: Type<T> | 'string';
    dtoName?: string;
    example?: unknown[];
  },
): MethodDecorator {
  return (...params): void => {
    ApiResponse({
      status: options.status ?? HttpStatus.OK,
      type: StandardizedList(options.type, options.dtoName, options.example),
      description: options.description,
    })(...params);
  };
}
