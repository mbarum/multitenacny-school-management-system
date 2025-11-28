
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { School } from '../entities/school.entity';
import { SubscriptionStatus } from '../entities/subscription.entity';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    @InjectRepository(School)
    private schoolRepo: Repository<School>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;

    // Allow Read-Only access even if expired
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
        return true;
    }

    // Skip if no user (e.g., public login)
    if (!req.user || !req.user.schoolId) {
        return true; 
    }

    // Check School Subscription
    const school = await this.schoolRepo.findOne({ 
        where: { id: req.user.schoolId },
        relations: ['subscription']
    });

    if (!school || !school.subscription) {
        // Fallback for older data without sub
        return true;
    }

    const sub = school.subscription;
    const now = new Date();

    if (sub.status === SubscriptionStatus.CANCELLED) {
        throw new ForbiddenException('Subscription is cancelled. Read-only mode active.');
    }

    if (sub.endDate < now && sub.status !== SubscriptionStatus.ACTIVE) {
         throw new ForbiddenException('Subscription expired. Please renew to make changes.');
    }

    return true;
  }
}
