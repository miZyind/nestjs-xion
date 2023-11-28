import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import type { Type } from '@nestjs/common';
import type { StandardList, StandardResponse } from './model';

export function Standardized<T>(type?: Type<T>): Type<StandardResponse<T>> {
  class StandardizedEntity<D> implements StandardResponse<D> {
    @ApiProperty({ example: 0 })
    code!: number;

    @ApiPropertyOptional()
    error?: string;

    @ApiProperty({ example: 'Success' })
    message!: string;

    @ApiProperty(type ? { type } : { example: null })
    data!: D;
  }

  Object.defineProperty(StandardizedEntity, 'name', {
    value: `Standardized${
      typeof type === 'undefined' ? 'Response' : type.name
    }`,
  });

  return StandardizedEntity;
}

export function StandardizedList<T>(
  type: Type<T> | string,
  dtoName?: string,
  example?: unknown[],
): Type<StandardResponse<StandardList<T>>> {
  const name = typeof type === 'string' ? dtoName : type.name;

  class EntityList<D> implements StandardList<D> {
    @ApiProperty({ type, isArray: true, example })
    data!: D[];

    @ApiProperty({ example: 1 })
    total!: number;
  }

  Object.defineProperty(EntityList, 'name', {
    value: `${name}List`,
  });

  class StandardizedEntityList<D> implements StandardResponse<EntityList<D>> {
    @ApiProperty({ example: 0 })
    code!: number;

    @ApiPropertyOptional()
    error?: string;

    @ApiProperty({ example: 'Success' })
    message!: string;

    @ApiProperty({ type: EntityList })
    data!: EntityList<D>;
  }

  Object.defineProperty(StandardizedEntityList, 'name', {
    value: `Standardized${name}List`,
  });

  return StandardizedEntityList;
}
