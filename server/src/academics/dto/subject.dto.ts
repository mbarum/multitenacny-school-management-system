import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateSubjectDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}

export class UpdateSubjectDto {
  @IsString()
  @IsOptional()
  name?: string;
}
