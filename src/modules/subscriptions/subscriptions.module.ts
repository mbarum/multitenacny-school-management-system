import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { Tenant } from '../tenants/entities/tenant.entity';
import { User } from '../users/entities/user.entity';
import { StripeWebhookController } from './stripe-webhook.controller';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { TenancyModule } from 'src/core/tenancy/tenancy.module';
import { SubscriptionCronService } from './subscription-cron.service';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, SubscriptionPlan, User]), TenancyModule, SharedModule],
  controllers: [SubscriptionsController, StripeWebhookController],
  providers: [SubscriptionsService, SubscriptionCronService],
})
export class SubscriptionsModule {}
