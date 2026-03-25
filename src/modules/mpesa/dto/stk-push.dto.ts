import { IsNotEmpty, IsString, IsNumber, IsEnum, IsOptional, IsIn } from 'class-validator';
import { SubscriptionPlan } from 'src/common/subscription.enums';

export class StkPushDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsEnum(SubscriptionPlan)
  @IsNotEmpty()
  plan: SubscriptionPlan;

  @IsOptional()
  @IsIn(['monthly', 'annual'])
  billingCycle?: 'monthly' | 'annual';
}
