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

export class StringIDParamDTO {
  @IsNotEmpty()
  @IsString()
  id!: string;
}

export class IntIDParamDTO {
  @IsPositive()
  @IsInt()
  id!: number;
}
