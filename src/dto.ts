import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  DEFAULT_PAGINATION_LIMIT,
  DEFAULT_PAGINATION_PAGE,
} from './interceptor';

export class UUIDParamDTO {
  @IsUUID()
  @ApiProperty({ type: 'string', format: 'uuid' })
  readonly uuid!: string;
}

export class StringIDParamDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ type: 'string' })
  readonly id!: string;
}

export class IntIDParamDTO {
  @Type(() => Number)
  @IsPositive()
  @IsInt()
  @ApiProperty({ type: 'integer', minimum: 1 })
  readonly id!: number;
}

export class PaginationQueryDTO {
  @IsOptional()
  @IsPositive()
  @IsInt()
  @Type(() => Number)
  @ApiPropertyOptional({
    type: 'integer',
    default: DEFAULT_PAGINATION_LIMIT,
    minimum: 1,
    description:
      'Limit amount of resources<h5><a target="_blank" href="https://github.com/nestjsx/crud/wiki/Requests#limit">Documentation</a></h5><i>Minimum value: 1</i>',
  })
  readonly limit?: number;

  @IsOptional()
  @IsPositive()
  @IsInt()
  @Type(() => Number)
  @ApiPropertyOptional({
    type: 'integer',
    default: DEFAULT_PAGINATION_PAGE,
    minimum: DEFAULT_PAGINATION_PAGE,
    description:
      'Page portion of resources<h5><a target="_blank" href="https://github.com/nestjsx/crud/wiki/Requests#page">Documentation</a></h5><i>Minimum value: 1</i>',
  })
  readonly page?: number;
}
