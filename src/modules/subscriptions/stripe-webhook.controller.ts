import {
  Controller,
  Post,
  Headers,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { Tenant } from '../tenants/entities/tenant.entity';
import {
  SubscriptionStatus,
  SubscriptionPlan,
} from 'src/common/subscription.enums';
import { SystemConfigService } from '../config/system-config.service';

interface RequestWithRawBody extends Request {
  rawBody?: string | Buffer;
}

@Controller('stripe-webhook')
export class StripeWebhookController {
  private stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,
    private readonly systemConfigService: SystemConfigService,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  private async getStripe(): Promise<Stripe> {
    if (!this.stripe) {
      const secretKey = await this.systemConfigService.get('STRIPE_SECRET_KEY');
      if (!secretKey) {
        throw new Error(
          'STRIPE_SECRET_KEY not found in environment variables.',
        );
      }
      this.stripe = new Stripe(secretKey);
    }
    return this.stripe;
  }

  @Post()
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RequestWithRawBody,
  ) {
    let event: Stripe.Event;

    try {
      const webhookSecret = await this.systemConfigService.get(
        'STRIPE_WEBHOOK_SECRET',
      );
      if (!webhookSecret) {
        throw new Error(
          'STRIPE_WEBHOOK_SECRET not found in environment variables.',
        );
      }
      if (!req.rawBody) {
        throw new Error('Raw body not found in request.');
      }
      const stripeClient = await this.getStripe();
      event = stripeClient.webhooks.constructEvent(
        req.rawBody,
        signature,
        webhookSecret,
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      throw new BadRequestException(`Webhook Error: ${message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        const subscription = event.data.object;
        await this.updateTenantSubscriptionStatus(subscription);
        break;
      }
      case 'customer.subscription.deleted': {
        const deletedSubscription = event.data.object;
        await this.handleSubscriptionCanceled(deletedSubscription);
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return { received: true };
  }

  private async updateTenantSubscriptionStatus(
    subscription: Stripe.Subscription,
  ) {
    const stripeCustomerId = subscription.customer as string;
    const tenant = await this.tenantRepository.findOne({
      where: { stripeCustomerId },
    } as any);

    if (tenant) {
      tenant.subscriptionStatus = subscription.status as SubscriptionStatus;
      const periodEnd = (
        subscription as unknown as { current_period_end: number }
      ).current_period_end;
      tenant.expiresAt = new Date(periodEnd * 1000);

      // Map Stripe Price ID to SubscriptionPlan
      const priceId = subscription.items.data[0].price.id;
      if (priceId.includes('basic')) {
        tenant.plan = SubscriptionPlan.BASIC;
      } else if (priceId.includes('standard')) {
        tenant.plan = SubscriptionPlan.STANDARD;
      } else if (priceId.includes('premium')) {
        tenant.plan = SubscriptionPlan.PREMIUM;
      } else if (priceId.includes('enterprise')) {
        tenant.plan = SubscriptionPlan.ENTERPRISE;
      }

      await this.tenantRepository.save(tenant);
    }
  }

  private async handleSubscriptionCanceled(subscription: Stripe.Subscription) {
    const stripeCustomerId = subscription.customer as string;
    const tenant = await this.tenantRepository.findOne({
      where: { stripeCustomerId },
    } as any);

    if (tenant) {
      tenant.subscriptionStatus = SubscriptionStatus.CANCELED;
      await this.tenantRepository.save(tenant);
    }
  }
}
