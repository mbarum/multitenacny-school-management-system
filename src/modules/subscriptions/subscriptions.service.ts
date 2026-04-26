import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Tenant } from '../tenants/entities/tenant.entity';
import { TenancyService } from 'src/core/tenancy/tenancy.service';
import { SystemConfigService } from '../config/system-config.service';
import { PendingPayment, PaymentMethod } from '../payments/entities/pending-payment.entity';
import { SubscriptionPlan, SubscriptionStatus } from 'src/common/subscription.enums';

@Injectable()
export class SubscriptionsService {
  private stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,
    private readonly systemConfigService: SystemConfigService,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(PendingPayment)
    private readonly pendingPaymentRepository: Repository<PendingPayment>,
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
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    } as any);

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
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    } as any);

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

  async createBankTransferRequest(plan: SubscriptionPlan, billingCycle: 'monthly' | 'annual', amount: number): Promise<{ invoiceData: string; reference: string }> {
    const tenantId = this.tenancyService.getTenantId();
    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } } as any);

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const reference = `INV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const pendingPayment = this.pendingPaymentRepository.create({
      tenant,
      amount,
      method: PaymentMethod.BANK_TRANSFER,
      reference,
      plan,
      billingCycle,
      isApproved: false,
    });

    await this.pendingPaymentRepository.save(pendingPayment);

    // Update tenant status
    tenant.subscriptionStatus = SubscriptionStatus.PENDING_VERIFICATION;
    await this.tenantRepository.save(tenant);

    const invoiceData = this.generateInvoicePDF(tenant, amount, reference, plan);

    return { invoiceData, reference };
  }

  private generateInvoicePDF(tenant: Tenant, fee: number, reference: string, plan: SubscriptionPlan): string {
    const doc = new jsPDF() as any;
    const vatRate = 0.16; // 16% VAT
    const vatAmount = fee * vatRate;
    const totalAmount = fee + vatAmount;

    // Header
    doc.setFontSize(20);
    doc.text('INVOICE', 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.text('Issuer: Saaslink Technologies Limited', 20, 40);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 50);
    doc.text(`Invoice #: ${reference}`, 20, 60);

    // Bill To
    doc.text('Bill To:', 20, 80);
    doc.text(tenant.name, 20, 90);
    doc.text(tenant.contactEmail || '', 20, 100);

    // Table
    autoTable(doc, {
      startY: 110,
      head: [['Description', 'Amount (KES)']],
      body: [
        [`Subscription Package: ${plan.toUpperCase()}`, fee.toFixed(2)],
        ['VAT (16%)', vatAmount.toFixed(2)],
        ['Total Amount', totalAmount.toFixed(2)],
      ],
      theme: 'grid',
      headStyles: { fillColor: [100, 100, 100] },
    });

    // Bank Details
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(14);
    doc.text('Payment Details:', 20, finalY);
    doc.setFontSize(10);
    doc.text('Beneficiary: SAASLINK TECHNOLOGIES LTD', 20, finalY + 10);
    doc.text('Bank: I&M Bank Ltd.', 20, finalY + 18);
    doc.text('Account: 05206707336350', 20, finalY + 26);
    doc.text('Branch: 177 Koinange', 20, finalY + 34);
    doc.text(`Reference: ${reference}`, 20, finalY + 42);

    const output = doc.output('datauristring') as string;
    return output.split(',')[1];
  }
}
