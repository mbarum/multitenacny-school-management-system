import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../tenants/entities/tenant.entity';
import {
  PendingPayment,
  PaymentMethod,
} from './entities/pending-payment.entity';
import { TenancyService } from 'src/core/tenancy/tenancy.service';
import { SubscriptionStatus } from 'src/common/subscription.enums';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(PendingPayment)
    private readonly pendingPaymentRepository: Repository<PendingPayment>,
    private readonly tenancyService: TenancyService,
  ) {}

  async createBankTransferRequest(
    amount: number,
    reference: string,
    plan: SubscriptionPlan,
  ): Promise<PendingPayment> {
    const tenantId = this.tenancyService.getTenantId();
    const tenant = await this.tenantRepository.findOneBy({ id: tenantId });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const pendingPayment = this.pendingPaymentRepository.create({
      tenant,
      amount,
      reference,
      method: PaymentMethod.BANK_TRANSFER,
      plan,
    });

    return this.pendingPaymentRepository.save(pendingPayment);
  }

  async approvePayment(paymentId: string): Promise<Tenant> {
    const pendingPayment = await this.pendingPaymentRepository.findOne({
      where: { id: paymentId },
      relations: ['tenant'],
    });

    if (!pendingPayment) {
      throw new NotFoundException('Pending payment not found');
    }

    pendingPayment.isApproved = true;
    await this.pendingPaymentRepository.save(pendingPayment);

    const tenant = pendingPayment.tenant;
    tenant.subscriptionStatus = SubscriptionStatus.ACTIVE;
    if (pendingPayment.plan) {
      tenant.plan = pendingPayment.plan;
    }
    // You might want to set an expiry date here based on the plan
    // tenant.expiresAt = ...

    return this.tenantRepository.save(tenant);
  }
}
