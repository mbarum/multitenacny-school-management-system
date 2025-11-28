import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateClassDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  classCode!: string;

  @IsUUID()
  @IsOptional()
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
  formTeacherId?: string;
}
