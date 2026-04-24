import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../tenants/entities/tenant.entity';
import {
  PendingPayment,
  PaymentMethod,
} from './entities/pending-payment.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../../common/user-role.enum';
import { TenancyService } from 'src/core/tenancy/tenancy.service';
import {
  SubscriptionStatus,
  SubscriptionPlan,
} from 'src/common/subscription.enums';
import { EmailService } from '../../shared/email.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(PendingPayment)
    private readonly pendingPaymentRepository: Repository<PendingPayment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly tenancyService: TenancyService,
    private readonly emailService: EmailService,
  ) {}

  async createBankTransferRequest(
    amount: number,
    reference: string,
    plan: SubscriptionPlan,
    billingCycle: 'monthly' | 'annual',
  ): Promise<PendingPayment> {
    const tenantId = this.tenancyService.getTenantId();
    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } } as any);

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const pendingPayment = this.pendingPaymentRepository.create({
      tenant,
      amount,
      reference,
      method: PaymentMethod.BANK_TRANSFER,
      plan,
      billingCycle,
    });

    const savedPayment =
      await this.pendingPaymentRepository.save(pendingPayment);

    // Send email to admins
    const admins = await this.userRepository.find({
      where: { tenantId, role: UserRole.ADMIN },
    });

    for (const admin of admins) {
      await this.emailService.sendEmail(
        admin.username,
        'Bank Transfer Instructions - SaaSLink',
        `<p>Dear Admin,</p>
        <p>We have received your request to pay <strong>KES ${amount}</strong> via Bank Transfer for the <strong>${plan}</strong> plan (${billingCycle}).</p>
        <p>Please use the following reference when making the transfer:</p>
        <h3>Reference: ${reference}</h3>
        <p><strong>Bank Details:</strong></p>
        <ul>
          <li>Bank: SaaSLink Technologies Bank</li>
          <li>Account Name: SaaSLink Tech</li>
          <li>Account Number: 1234567890</li>
        </ul>
        <p>Once we receive the payment, your account will be activated automatically.</p>`,
      );
    }

    return savedPayment;
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

    // Set expiry date based on billing cycle
    const baseDate =
      tenant.expiresAt && tenant.expiresAt > new Date()
        ? new Date(tenant.expiresAt)
        : new Date();
    if (pendingPayment.billingCycle === 'annual') {
      baseDate.setFullYear(baseDate.getFullYear() + 1);
    } else {
      baseDate.setMonth(baseDate.getMonth() + 1);
    }
    tenant.expiresAt = baseDate;

    return this.tenantRepository.save(tenant);
  }
}
