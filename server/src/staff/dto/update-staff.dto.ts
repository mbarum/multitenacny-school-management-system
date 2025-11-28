import { IsEmail, IsEnum, IsOptional, IsString, MinLength, IsNumber, IsDateString } from 'class-validator';
import { Role } from '../../entities/user.entity';

export class UpdateStaffDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsEnum(Role)
  @IsOptional()
  userRole?: Role;

  @IsString()
  @IsOptional()
  role?: string;

  @IsNumber()
  @IsOptional()
  salary?: number;

  @IsDateString()
  @IsOptional()
  joinDate?: string;

  @IsString()
  @IsOptional()
  photoUrl?: string;

  @IsString()
  @IsOptional()
  bankName?: string;

  @IsString()
  @IsOptional()
  accountNumber?: string;

  @IsString()
  @IsOptional()
  kraPin?: string;

  @IsString()
  @IsOptional()
  nssfNumber?: string;

  @IsString()
  @IsOptional()
  shaNumber?: string;
}