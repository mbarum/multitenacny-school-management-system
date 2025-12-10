
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { School } from '../entities/school.entity';
import { Subscription, SubscriptionStatus, SubscriptionPlan } from '../entities/subscription.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class SuperAdminService {
  constructor(
    @InjectRepository(School) private schoolRepo: Repository<School>,
    @InjectRepository(Subscription) private subRepo: Repository<Subscription>,
    @InjectRepository(User) private userRepo: Repository<User>,
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
    
    // Simulate MRR (Monthly Recurring Revenue) based on active plans
    // Basic = 3000, Premium = 5000
    const basicCount = await this.subRepo.count({ where: { plan: SubscriptionPlan.BASIC, status: SubscriptionStatus.ACTIVE } });
    const premiumCount = await this.subRepo.count({ where: { plan: SubscriptionPlan.PREMIUM, status: SubscriptionStatus.ACTIVE } });
    const mrr = (basicCount * 3000) + (premiumCount * 5000);

    return {
      totalSchools,
      activeSubs,
      trialSubs,
      mrr
    };
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
}
