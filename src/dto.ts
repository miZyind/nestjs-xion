import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

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
