import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { Tenant } from '../tenants/entities/tenant.entity';
import { StripeWebhookController } from './stripe-webhook.controller';
import { SubscriptionPlan } from './entities/subscription-plan.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, SubscriptionPlan])],
  controllers: [SubscriptionsController, StripeWebhookController],
  providers: [SubscriptionsService],
})
export class SubscriptionsModule {}
