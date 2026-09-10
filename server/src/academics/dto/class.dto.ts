
import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateClassDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  classCode!: string;

  @IsUUID()
  @IsOptional()
  @Transform(({ value }) => value === '' ? null : value)
  formTeacherId?: string;
}

export class UpdateClassDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  classCode?: string;

  @IsUUID()
  @IsOptional()
  @Transform(({ value }) => value === '' ? null : value)
  formTeacherId?: string;
}
