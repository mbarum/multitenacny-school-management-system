import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { Tenant } from '../tenants/entities/tenant.entity';
import { TenancyService } from 'src/core/tenancy/tenancy.service';

@Injectable()
export class SubscriptionsService {
  private stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    private readonly tenancyService: TenancyService,
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY not found in environment variables.');
    }
    this.stripe = new Stripe(secretKey);
  }

  async createCheckoutSession(priceId: string): Promise<{ sessionId: string }> {
    const tenantId = this.tenancyService.getTenantId();
    const tenant = await this.tenantRepository.findOneBy({ id: tenantId });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    let stripeCustomerId = tenant.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await this.stripe.customers.create({
        name: tenant.name,
        metadata: {
          tenantId: tenant.id,
        },
      });
      stripeCustomerId = customer.id;
      await this.tenantRepository.update(tenant.id, { stripeCustomerId });
    }

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      customer: stripeCustomerId,
      success_url: `${this.configService.get('CLIENT_URL')}/dashboard?payment_success=true`,
      cancel_url: `${this.configService.get('CLIENT_URL')}/pricing?payment_canceled=true`,
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

    const portalSession = await this.stripe.billingPortal.sessions.create({
      customer: tenant.stripeCustomerId,
      return_url: `${this.configService.get('CLIENT_URL')}/dashboard`,
    });

    return { url: portalSession.url };
  }
}
