
import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { SubscriptionPlan } from '../../entities/subscription.entity';

export class RegisterSchoolDto {
  @IsString()
  @IsOptional()
  schoolName?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  adminName?: string;

  @IsEmail()
  @IsOptional()
  adminEmail?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  county?: string;

  @IsString()
  @IsOptional()
  registrationCode?: string;

  @IsString()
  @IsOptional()
  curriculumType?: string;

  @IsOptional()
  studentCount?: number | string;

  @IsEnum(SubscriptionPlan)
  @IsOptional()
  plan?: SubscriptionPlan = SubscriptionPlan.FREE;

  @IsString()
  @IsOptional()
  billingCycle?: 'MONTHLY' | 'ANNUALLY' = 'MONTHLY';

  @IsString()
  @IsOptional()
  currency?: string = 'KES';

  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @IsString()
  @IsOptional()
  invoiceNumber?: string;
}
