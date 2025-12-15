
import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { SubscriptionPlan } from '../../entities/subscription.entity';

export class RegisterSchoolDto {
  @IsString()
  @IsNotEmpty()
  schoolName!: string;

  @IsString()
  @IsNotEmpty()
  adminName!: string;

  @IsEmail()
  adminEmail!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsEnum(SubscriptionPlan)
  @IsOptional()
  plan?: SubscriptionPlan = SubscriptionPlan.FREE;

  @IsString()
  @IsOptional()
  billingCycle?: 'MONTHLY' | 'ANNUALLY' = 'MONTHLY';

  @IsString()
  @IsOptional()
  currency?: string = 'KES';
}
