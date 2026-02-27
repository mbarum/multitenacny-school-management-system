import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../tenants/entities/tenant.entity';
import { SubscriptionStatus } from 'src/common/subscription.enums';
import { PendingPayment } from '../payments/entities/pending-payment.entity';

@Injectable()
export class SuperAdminService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(PendingPayment)
    private readonly pendingPaymentRepository: Repository<PendingPayment>,
  ) {}

  async getDashboardAnalytics() {
    const totalTenants = await this.tenantRepository.count();
    const activeSubscriptions = await this.tenantRepository.count({ where: { subscriptionStatus: SubscriptionStatus.ACTIVE } });
    const pendingApprovals = await this.pendingPaymentRepository.count({ where: { isApproved: false } });

    // In a real app, you would also fetch total revenue from Stripe
    const totalRevenue = 54250; // Placeholder

    return {
      totalTenants,
      activeSubscriptions,
      pendingApprovals,
      totalRevenue,
    };
  }

  async getAllTenants() {
    return this.tenantRepository.find();
  }

  async getTenantById(id: string) {
    const tenant = await this.tenantRepository.findOneBy({ id });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }

  async getPendingPayments() {
    return this.pendingPaymentRepository.find({ where: { isApproved: false }, relations: ['tenant'] });
  }
}
