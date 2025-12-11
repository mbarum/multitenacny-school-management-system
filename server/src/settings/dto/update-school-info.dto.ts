
import { IsString, IsOptional, IsEnum, IsEmail } from 'class-validator';
import { GradingSystem } from '../../entities/school-setting.entity';

export class UpdateSchoolInfoDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  schoolCode?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsEnum(GradingSystem)
  @IsOptional()
  gradingSystem?: GradingSystem;

  @IsString()
  @IsOptional()
  currency?: string;
}