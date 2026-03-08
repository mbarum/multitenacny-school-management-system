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

interface RequestWithRawBody extends Request {
  rawBody?: string | Buffer;
}

@Controller('stripe-webhook')
export class StripeWebhookController {
  private stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  private getStripe(): Stripe {
    if (!this.stripe) {
      const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
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
      const webhookSecret = this.configService.get<string>(
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
      event = this.getStripe().webhooks.constructEvent(
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
    const tenant = await this.tenantRepository.findOneBy({ stripeCustomerId });

    if (tenant) {
      tenant.subscriptionStatus = subscription.status as SubscriptionStatus;

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
    const tenant = await this.tenantRepository.findOneBy({ stripeCustomerId });

    if (tenant) {
      tenant.subscriptionStatus = SubscriptionStatus.CANCELED;
      await this.tenantRepository.save(tenant);
    }
  }
}
