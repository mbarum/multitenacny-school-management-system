import { IsString, IsOptional, IsObject } from 'class-validator';

export class CreateAdminLogDto {
  @IsString()
  action!: string;

  @IsObject()
  @IsOptional()
  details?: Record<string, any>;
}
