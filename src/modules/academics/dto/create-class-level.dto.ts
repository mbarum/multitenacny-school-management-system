import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateClassLevelDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  headTeacherId?: string;
}
