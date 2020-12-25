import {
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';

export class UUIDParamDTO {
  @IsUUID()
  uuid!: string;
}

export class StringIDParamDto {
  @IsNotEmpty()
  @IsString()
  id!: string;
}

export class IntIDParamDto {
  @IsPositive()
  @IsInt()
  id!: number;
}
