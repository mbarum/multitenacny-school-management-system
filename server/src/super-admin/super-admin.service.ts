
import { Injectable, NotFoundException, Logger, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, EntityManager } from 'typeorm';
import { School } from '../entities/school.entity';
import { Subscription, SubscriptionStatus, SubscriptionPlan } from '../entities/subscription.entity';
import { User } from '../entities/user.entity';
import { PlatformSetting } from '../entities/platform-setting.entity';
import { SubscriptionPayment } from '../entities/subscription-payment.entity';
import { CommunicationsService } from '../communications/communications.service';
import * as os from 'os';

@Injectable()
export class SuperAdminService {
  private readonly logger = new Logger('SuperAdminService');

  constructor(
    @InjectRepository(School) private schoolRepo: Repository<School>,
    @InjectRepository(Subscription) private subRepo: Repository<Subscription>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(PlatformSetting) private platformSettingRepo: Repository<PlatformSetting>,
    @InjectRepository(SubscriptionPayment) private paymentRepo: Repository<SubscriptionPayment>,
    private communicationsService: CommunicationsService,
    private entityManager: EntityManager,
  ) {}

  async findAllSchools() {
    const schools = await this.schoolRepo.find({
      relations: ['subscription', 'users'],
      order: { createdAt: 'DESC' },
    });

    return schools.map(school => {
      const admin = school.users.find(u => u.role === 'Admin');
      return {
        id: school.id,
        name: school.name,
        slug: school.slug,
        email: school.email,
        phone: school.phone,
        createdAt: school.createdAt,
        adminName: admin ? admin.name : 'N/A',
        subscription: school.subscription ? {
            plan: school.subscription.plan,
            status: school.subscription.status,
            endDate: school.subscription.endDate,
            invoiceNumber: school.subscription.invoiceNumber 
        } : null,
      };
    });
  }

  async getPlatformStats() {
    const totalSchools = await this.schoolRepo.count();
    const activeSubs = await this.subRepo.count({ where: { status: SubscriptionStatus.ACTIVE } });
    const trialSubs = await this.subRepo.count({ where: { status: SubscriptionStatus.TRIAL } });
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newSchoolsLast30Days = await this.schoolRepo.count({
        where: { createdAt: MoreThan(thirtyDaysAgo) }
    });

    let pricing = await this.platformSettingRepo.findOne({ where: {} });
    if (!pricing) pricing = { basicMonthlyPrice: 3000, basicAnnualPrice: 30000, premiumMonthlyPrice: 5000, premiumAnnualPrice: 50000 } as PlatformSetting;

    const basicCount = await this.subRepo.count({ where: { plan: SubscriptionPlan.BASIC, status: SubscriptionStatus.ACTIVE } });
    const premiumCount = await this.subRepo.count({ where: { plan: SubscriptionPlan.PREMIUM, status: SubscriptionStatus.ACTIVE } });
    const mrr = (basicCount * pricing.basicMonthlyPrice) + (premiumCount * pricing.premiumMonthlyPrice);

    return {
      totalSchools, activeSubs, trialSubs, mrr, newSchoolsLast30Days,
      planDistribution: { basic: basicCount, premium: premiumCount, free: totalSchools - (basicCount + premiumCount) },
      pricing
    };
  }
  
  async getSystemHealth() {
      const start = Date.now();
      let dbStatus = 'down';
      try {
          await this.schoolRepo.query('SELECT 1');
          dbStatus = 'up';
      } catch (e) {
          dbStatus = 'down';
      }
      const dbLatency = Date.now() - start;
      const memoryUsage = (process as any).memoryUsage();
      const freeMem = os.freemem();
      const totalMem = os.totalmem();
      const memPercentage = ((totalMem - freeMem) / totalMem) * 100;

      return {
          status: dbStatus === 'up' ? 'healthy' : 'critical',
          timestamp: new Date().toISOString(),
          uptime: (process as any).uptime(),
          database: { status: dbStatus, latency: `${dbLatency}ms`, type: 'MySQL' },
          server: { platform: (process as any).platform, nodeVersion: (process as any).version, memoryUsage: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`, systemMemoryLoad: `${memPercentage.toFixed(1)}%` }
      };
  }
  
  async updatePricing(settings: Partial<PlatformSetting>) {
      let pricing = await this.platformSettingRepo.findOne({ where: {} });
      if (!pricing) pricing = this.platformSettingRepo.create(settings);
      else Object.assign(pricing, settings);
      return this.platformSettingRepo.save(pricing);
  }

  async updateSubscription(schoolId: string, dto: { status: SubscriptionStatus; plan: SubscriptionPlan; endDate?: string }) {
    this.logger.log(`Updating subscription for School ${schoolId} to ${dto.status}`);
    const school = await this.schoolRepo.findOne({ 
      where: { id: schoolId },
      relations: ['subscription']
    });

    if (!school) throw new NotFoundException('School not found');

    if (school.subscription) {
      school.subscription.status = dto.status;
      school.subscription.plan = dto.plan;
      if (dto.endDate) school.subscription.endDate = new Date(dto.endDate);
      return this.subRepo.save(school.subscription);
    } else {
      const sub = this.subRepo.create({
        school, status: dto.status, plan: dto.plan,
        endDate: dto.endDate ? new Date(dto.endDate) : new Date(Date.now() + 30*24*60*60*1000)
      });
      return this.subRepo.save(sub);
    }
  }

  async getSubscriptionPayments() {
      return this.paymentRepo.find({
          relations: ['school'],
          order: { paymentDate: 'DESC' },
          take: 50
      });
  }

  async recordManualPayment(schoolId: string, data: { amount: number, transactionCode: string, date: string, method: string }) {
      this.logger.log(`[Billing] 💳 VERIFYING PAYMENT: School ${schoolId}, Code: ${data.transactionCode}`);
      
      let schoolToNotify: any = null;

      try {
          await this.entityManager.transaction(async manager => {
              this.logger.log(`[Transaction] START: Manual Payment Record`);
              
              const school = await manager.findOne(School, { 
                  where: { id: schoolId }, 
                  relations: ['subscription', 'users'] 
              });
              
              if (!school) throw new NotFoundException("School not found");
              schoolToNotify = school;

              // 1. Log payment
              const payment = manager.create(SubscriptionPayment, {
                  school,
                  amount: data.amount,
                  transactionCode: data.transactionCode,
                  paymentDate: data.date,
                  paymentMethod: data.method,
              });
              await manager.save(payment);

              // 2. Activate Subscription directly using ID to avoid object locking issues
              if (school.subscription) {
                  await manager.update(Subscription, school.subscription.id, {
                      status: SubscriptionStatus.ACTIVE,
                      updatedAt: new Date()
                  });
                  this.logger.log(`[Transaction] Subscription ${school.subscription.id} status updated to ACTIVE`);
              }

              this.logger.log(`[Transaction] COMMIT: Manual Payment Record`);
          });

          // 3. Post-Transaction Notification (Outside transaction to prevent lock extensions)
          if (schoolToNotify) {
              const admin = schoolToNotify.users.find(u => u.role === 'Admin');
              if (admin) {
                  this.communicationsService.sendEmail(
                      admin.email,
                      'Account Activated - Saaslink',
                      `<h1>Great news ${admin.name}!</h1><p>Your payment has been verified. Your institutional portal for ${schoolToNotify.name} is now active.</p>`
                  ).catch(e => this.logger.error(`Notification failed: ${e.message}`));
              }
          }
          
          this.logger.log(`[Billing] ✅ VERIFICATION COMPLETE: School ${schoolId}`);
          return { success: true };

      } catch (error) {
          this.logger.error(`[Billing] ❌ VERIFICATION FAILED: ${error.message}`, error.stack);
          throw new InternalServerErrorException(error.message || "Financial transaction failed.");
      }
  }

  async updateSchoolEmail(schoolId: string, email: string) {
      const school = await this.schoolRepo.findOne({ where: { id: schoolId } });
      if (!school) throw new NotFoundException("School not found");
      school.email = email;
      return this.schoolRepo.save(school);
  }
}
