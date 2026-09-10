import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength, IsNumber, IsDateString } from 'class-validator';
import { Role } from '../../entities/user.entity';

export class CreateStaffDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @IsOptional()
  password?: string;

  @IsEnum(Role)
  userRole!: Role;

  @IsString()
  @IsNotEmpty()
  role!: string;

  @IsNumber()
  salary!: number;

  @IsDateString()
  joinDate!: string;
  
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