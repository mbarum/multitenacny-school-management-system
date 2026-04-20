import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { Tenant } from '../tenants/entities/tenant.entity';
import { TenancyService } from 'src/core/tenancy/tenancy.service';
import { SystemConfigService } from '../config/system-config.service';

@Injectable()
export class SubscriptionsService {
  private stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,
    private readonly systemConfigService: SystemConfigService,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    private readonly tenancyService: TenancyService,
  ) {}

  private async getStripe(): Promise<Stripe> {
    if (!this.stripe) {
      const secretKey = await this.systemConfigService.get('STRIPE_SECRET_KEY');
      if (!secretKey) {
        throw new Error(
          'STRIPE_SECRET_KEY not found in system generic config or environment variables.',
        );
      }
      this.stripe = new Stripe(secretKey);
    }
    return this.stripe;
  }

  async createCheckoutSession(priceId: string): Promise<{ sessionId: string }> {
    const tenantId = this.tenancyService.getTenantId();
    const tenant = await this.tenantRepository.findOneBy({ id: tenantId });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const stripeClient = await this.getStripe();
    let stripeCustomerId = tenant.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripeClient.customers.create({
        name: tenant.name,
        metadata: {
          tenantId: tenant.id,
        },
      });
      stripeCustomerId = customer.id;
      await this.tenantRepository.update(tenant.id, { stripeCustomerId });
    }

    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      customer: stripeCustomerId,
      success_url: `${this.configService.get('FRONTEND_URL')}/dashboard?payment_success=true`,
      cancel_url: `${this.configService.get('FRONTEND_URL')}/pricing?payment_canceled=true`,
    });

    return { sessionId: session.id };
  }

  async createBillingPortalSession(): Promise<{ url: string }> {
    const tenantId = this.tenancyService.getTenantId();
    const tenant = await this.tenantRepository.findOneBy({ id: tenantId });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (!tenant.stripeCustomerId) {
      throw new Error('Tenant does not have a Stripe customer ID.');
    }

    const stripeC = await this.getStripe();
    const portalSession = await stripeC.billingPortal.sessions.create({
      customer: tenant.stripeCustomerId,
      return_url: `${this.configService.get('FRONTEND_URL')}/dashboard`,
    });

    return { url: portalSession.url };
  }
}
