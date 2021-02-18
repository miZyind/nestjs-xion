import { HttpStatus, UseGuards, createParamDecorator } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse, ApiSecurity } from '@nestjs/swagger';

import { Standardized, StandardizedList } from './standardizer';

import type { ExecutionContext, Type } from '@nestjs/common';
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
    type: string;
    dtoName: string;
    example: unknown[];
  },
): MethodDecorator;
export function ApiStandardListResponse<T>(
  options: ApiResponseOptions & {
    type: Type<T> | string;
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
