import { HttpStatus } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

import { Standardized, StandardizedList } from './standardizer';

import type { Type } from '@nestjs/common';

interface ApiResponseOptions {
  status?: HttpStatus;
  description?: string;
}

export function ApiStandardResponse<T>(
  options?: ApiResponseOptions & { type?: Type<T> },
): MethodDecorator {
  return (target, key, descriptor): void => {
    ApiResponse({
      status: options?.status ?? HttpStatus.OK,
      type: Standardized(options?.type),
      description: options?.description,
    })(target, key, descriptor);
  };
}

export function ApiStandardListResponse<T>(
  options: ApiResponseOptions & { type: Type<T> },
): MethodDecorator {
  return (target, key, descriptor): void => {
    ApiResponse({
      status: options.status ?? HttpStatus.OK,
      type: StandardizedList(options.type),
      description: options.description,
    })(target, key, descriptor);
  };
}
