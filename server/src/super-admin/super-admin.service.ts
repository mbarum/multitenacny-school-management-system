
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { School } from '../entities/school.entity';
import { Subscription, SubscriptionStatus, SubscriptionPlan } from '../entities/subscription.entity';
import { User } from '../entities/user.entity';
import { PlatformSetting } from '../entities/platform-setting.entity';
import { SubscriptionPayment } from '../entities/subscription-payment.entity';
import * as os from 'os';

@Injectable()
export class SuperAdminService {
  constructor(
    @InjectRepository(School) private schoolRepo: Repository<School>,
    @InjectRepository(Subscription) private subRepo: Repository<Subscription>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(PlatformSetting) private platformSettingRepo: Repository<PlatformSetting>,
    @InjectRepository(SubscriptionPayment) private paymentRepo: Repository<SubscriptionPayment>,
  ) {}

  async findAllSchools() {
    // Return all schools with their subscription status and admin user details
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
        subscription: school.subscription,
        studentCount: 0, // In a real app, do a count query or subquery
      };
    });
  }

  async getPlatformStats() {
    const totalSchools = await this.schoolRepo.count();
    const activeSubs = await this.subRepo.count({ where: { status: SubscriptionStatus.ACTIVE } });
    const trialSubs = await this.subRepo.count({ where: { status: SubscriptionStatus.TRIAL } });
    
    // Recent Growth (Last 30 Days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newSchoolsLast30Days = await this.schoolRepo.count({
        where: { createdAt: MoreThan(thirtyDaysAgo) }
    });

    // Get Current Pricing
    let pricing = await this.platformSettingRepo.findOne({ where: {} });
    if (!pricing) pricing = { basicMonthlyPrice: 3000, premiumMonthlyPrice: 5000 } as PlatformSetting;

    const basicCount = await this.subRepo.count({ where: { plan: SubscriptionPlan.BASIC, status: SubscriptionStatus.ACTIVE } });
    const premiumCount = await this.subRepo.count({ where: { plan: SubscriptionPlan.PREMIUM, status: SubscriptionStatus.ACTIVE } });
    const mrr = (basicCount * pricing.basicMonthlyPrice) + (premiumCount * pricing.premiumMonthlyPrice);

    return {
      totalSchools,
      activeSubs,
      trialSubs,
      mrr,
      newSchoolsLast30Days,
      planDistribution: {
          basic: basicCount,
          premium: premiumCount,
          free: totalSchools - (basicCount + premiumCount)
      },
      pricing
    };
  }
  
  async getSystemHealth() {
      // 1. Database Check & Latency
      const start = Date.now();
      let dbStatus = 'down';
      try {
          await this.schoolRepo.query('SELECT 1');
          dbStatus = 'up';
      } catch (e) {
          dbStatus = 'down';
      }
      const dbLatency = Date.now() - start;

      // 2. System Resources
      const memoryUsage = (process as any).memoryUsage();
      const freeMem = os.freemem();
      const totalMem = os.totalmem();
      const memPercentage = ((totalMem - freeMem) / totalMem) * 100;

      return {
          status: dbStatus === 'up' ? 'healthy' : 'critical',
          timestamp: new Date().toISOString(),
          uptime: (process as any).uptime(), // Seconds
          database: {
              status: dbStatus,
              latency: `${dbLatency}ms`,
              type: 'MySQL'
          },
          server: {
              platform: (process as any).platform,
              nodeVersion: (process as any).version,
              memoryUsage: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
              systemMemoryLoad: `${memPercentage.toFixed(1)}%`
          }
      };
  }
  
  async updatePricing(settings: Partial<PlatformSetting>) {
      let pricing = await this.platformSettingRepo.findOne({ where: {} });
      if (!pricing) {
          pricing = this.platformSettingRepo.create(settings);
      } else {
          Object.assign(pricing, settings);
      }
      return this.platformSettingRepo.save(pricing);
  }

  async updateSubscription(schoolId: string, dto: { status: SubscriptionStatus; plan: SubscriptionPlan; endDate?: string }) {
    const school = await this.schoolRepo.findOne({ 
      where: { id: schoolId },
      relations: ['subscription']
    });

    if (!school) throw new NotFoundException('School not found');

    if (school.subscription) {
      school.subscription.status = dto.status;
      school.subscription.plan = dto.plan;
      if (dto.endDate) {
        school.subscription.endDate = new Date(dto.endDate);
      }
      return this.subRepo.save(school.subscription);
    } else {
      // Create new if missing (edge case)
      const sub = this.subRepo.create({
        school,
        status: dto.status,
        plan: dto.plan,
        endDate: dto.endDate ? new Date(dto.endDate) : new Date(Date.now() + 30*24*60*60*1000)
      });
      return this.subRepo.save(sub);
    }
  }

  // --- Subscription Payments ---
  
  async getSubscriptionPayments() {
      return this.paymentRepo.find({
          relations: ['school'],
          order: { paymentDate: 'DESC' },
          take: 50
      });
  }

  async recordManualPayment(schoolId: string, data: { amount: number, transactionCode: string, date: string, method: string }) {
      const school = await this.schoolRepo.findOne({ where: { id: schoolId } });
      if (!school) throw new NotFoundException("School not found");

      const payment = this.paymentRepo.create({
          school,
          amount: data.amount,
          transactionCode: data.transactionCode,
          paymentDate: data.date,
          paymentMethod: data.method,
          periodStart: new Date().toISOString(), // Mock logic
          periodEnd: new Date(Date.now() + 30*24*60*60*1000).toISOString()
      });

      return this.paymentRepo.save(payment);
  }
}
