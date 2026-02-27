import { Controller, Post, Headers, Req, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { Tenant } from '../tenants/entities/tenant.entity';
import { SubscriptionStatus } from 'src/common/subscription.enums';

@Controller('stripe-webhook')
export class StripeWebhookController {
  private stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {
    this.stripe = new Stripe(this.configService.get<string>('STRIPE_SECRET_KEY'), {
      apiVersion: '2024-04-10',
    });
  }

  @Post()
  async handleWebhook(@Headers('stripe-signature') signature: string, @Req() req) {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(req.rawBody, signature, webhookSecret);
    } catch (err) {
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.updated':
      case 'customer.subscription.created':
        const subscription = event.data.object as Stripe.Subscription;
        await this.updateTenantSubscriptionStatus(subscription);
        break;
      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        await this.handleSubscriptionCanceled(deletedSubscription);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return { received: true };
  }

  private async updateTenantSubscriptionStatus(subscription: Stripe.Subscription) {
    const stripeCustomerId = subscription.customer as string;
    const tenant = await this.tenantRepository.findOneBy({ stripeCustomerId });

    if (tenant) {
      tenant.subscriptionStatus = subscription.status as SubscriptionStatus;
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
