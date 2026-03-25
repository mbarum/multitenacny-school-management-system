import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Between } from 'typeorm';
import { Tenant } from '../tenants/entities/tenant.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../../common/user-role.enum';
import { SubscriptionStatus, SubscriptionPlan } from '../../common/subscription.enums';
import { EmailService } from '../../shared/email.service';

@Injectable()
export class SubscriptionCronService {
  private readonly logger = new Logger(SubscriptionCronService.name);

  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly emailService: EmailService,
  ) {}

  private async getTenantAdminEmails(tenantId: string): Promise<string[]> {
    const admins = await this.userRepository.find({
      where: {
        tenantId,
        role: UserRole.ADMIN,
      },
    });
    return admins.map(admin => admin.username); // Assuming username is an email
  }

  // Run every day at midnight
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleSubscriptionExpirations() {
    this.logger.log('Checking for expired subscriptions...');

    const now = new Date();

    // Find tenants whose subscription has expired and are still marked as active
    const expiredTenants = await this.tenantRepository.find({
      where: {
        expiresAt: LessThan(now),
        subscriptionStatus: SubscriptionStatus.ACTIVE,
      },
    });

    for (const tenant of expiredTenants) {
      if (tenant.plan !== SubscriptionPlan.FREE) {
        tenant.subscriptionStatus = SubscriptionStatus.PAST_DUE;
        await this.tenantRepository.save(tenant);
        this.logger.log(`Tenant ${tenant.name} subscription marked as PAST_DUE`);

        const adminEmails = await this.getTenantAdminEmails(tenant.id);
        for (const email of adminEmails) {
          await this.emailService.sendEmail(
            email,
            'Your Subscription Has Expired',
            `<p>Dear Admin,</p><p>Your subscription for <strong>${tenant.name}</strong> has expired. Your account is now locked.</p><p>Please log in and update your payment details to unlock your account.</p>`,
          );
        }
      }
    }
  }

  // Run every day at 8 AM to send reminders
  @Cron('0 8 * * *')
  async handleSubscriptionReminders() {
    this.logger.log('Checking for upcoming subscription renewals...');

    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);

    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);

    // Find tenants whose subscription expires in exactly 3 or 7 days
    const expiringSoonTenants = await this.tenantRepository.find({
      where: [
        {
          expiresAt: Between(
            new Date(threeDaysFromNow.setHours(0, 0, 0, 0)),
            new Date(threeDaysFromNow.setHours(23, 59, 59, 999)),
          ),
          subscriptionStatus: SubscriptionStatus.ACTIVE,
        },
        {
          expiresAt: Between(
            new Date(sevenDaysFromNow.setHours(0, 0, 0, 0)),
            new Date(sevenDaysFromNow.setHours(23, 59, 59, 999)),
          ),
          subscriptionStatus: SubscriptionStatus.ACTIVE,
        },
      ],
    });

    for (const tenant of expiringSoonTenants) {
      if (tenant.plan !== SubscriptionPlan.FREE) {
        this.logger.log(`Sending renewal reminder to tenant ${tenant.name}`);
        const adminEmails = await this.getTenantAdminEmails(tenant.id);
        for (const email of adminEmails) {
          await this.emailService.sendEmail(
            email,
            'Subscription Renewal Reminder',
            `<p>Dear Admin,</p><p>Your subscription for <strong>${tenant.name}</strong> is expiring soon on ${tenant.expiresAt.toDateString()}.</p><p>Please ensure your payment details are up to date to avoid service interruption.</p>`,
          );
        }
      }
    }
  }
}
