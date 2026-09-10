import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { School } from '../entities/school.entity';
import { SubscriptionStatus, SubscriptionPlan } from '../entities/subscription.entity';
import { Role } from '../entities/user.entity';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    @InjectRepository(School)
    private schoolRepo: Repository<School>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const { method, url, user } = req;

    if (user?.role === Role.SuperAdmin) return true;
    if (url.includes('/auth/') || url.includes('/settings/public')) return true;
    if (!user?.schoolId) return true;

    const school = await this.schoolRepo.findOne({ 
        where: { id: user.schoolId },
        relations: ['subscription']
    });

    if (!school || !school.subscription) return true;
    const sub = school.subscription;
    const now = new Date();
    const isExpiredDate = new Date(sub.endDate) < now;

    // 1. HARD BLOCK: Expired or Disabled
    const isBlockedStatus = [
        SubscriptionStatus.CANCELLED, 
        SubscriptionStatus.SUSPENDED, 
        SubscriptionStatus.INACTIVE,
        SubscriptionStatus.EXPIRED,
        SubscriptionStatus.PAST_DUE
    ].includes(sub.status);

    if (isBlockedStatus || isExpiredDate) {
        const isRecoveryRoute = url.includes('/mpesa/stk-push') || url.includes('/create-payment-intent');
        if (isRecoveryRoute) return true;
        throw new ForbiddenException('Institutional access suspended. Active license required.');
    }

    // 2. FEATURE BLOCK: Plan-based constraints
    // Premium Modules: AI, Reporting (Advanced), Library
    const isPremiumRoute = url.includes('/ai/') || url.includes('/library/') || url.includes('/reporting');
    
    if (isPremiumRoute && sub.plan !== SubscriptionPlan.PREMIUM) {
        throw new ForbiddenException('This module requires a PREMIUM license. Please upgrade your subscription in Settings.');
    }

    // 3. TRIAL Matrix
    if (sub.status === SubscriptionStatus.TRIAL && method === 'DELETE') {
        throw new ForbiddenException('Trial accounts cannot purge data.');
    }

    return true;
  }
}