import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { SubscriptionPlan } from 'src/common/subscription.enums';

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  domain: string;

  @IsEnum(SubscriptionPlan)
  @IsOptional()
  plan?: SubscriptionPlan;
}
