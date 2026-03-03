import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { Tenant } from '../tenants/entities/tenant.entity';
import { StripeWebhookController } from './stripe-webhook.controller';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { TenancyModule } from 'src/core/tenancy/tenancy.module';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, SubscriptionPlan]), TenancyModule],
  controllers: [SubscriptionsController, StripeWebhookController],
  providers: [SubscriptionsService],
})
export class SubscriptionsModule {}
