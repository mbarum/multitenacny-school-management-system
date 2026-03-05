import { IsString, IsNotEmpty, IsEmail, MinLength, IsOptional } from 'class-validator';

export class RegisterSchoolDto {
  @IsString()
  @IsNotEmpty()
  schoolName: string;

  @IsString()
  @IsNotEmpty()
  domain: string;

  @IsEmail()
  @IsNotEmpty()
  adminEmail: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  adminPassword: string;

  @IsString()
  @IsOptional()
  plan?: string;
}
