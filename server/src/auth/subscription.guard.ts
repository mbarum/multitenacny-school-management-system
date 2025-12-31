
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
    const url = req.url;

    // 1. Allow all users to access public routes and auth routes (login/logout/me)
    if (url.includes('/auth/') || url.includes('/settings/public')) {
        return true;
    }

    // 2. Allow Read-Only access (GET) to the system so users can see the lockout screen/info
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
        return true;
    }

    // 3. Skip if no user (e.g., anonymous) - let JwtGuard handle it
    if (!req.user || !req.user.schoolId) {
        return true; 
    }

    // 4. Check School Subscription Status
    const school = await this.schoolRepo.findOne({ 
        where: { id: req.user.schoolId },
        relations: ['subscription']
    });

    // If no school found or no sub, allow (might be super admin or new account)
    if (!school || !school.subscription) {
        return true;
    }

    const sub = school.subscription;
    const now = new Date();

    // 5. ENFORCE LOCKOUT
    // If status is specifically CANCELLED or PAST_DUE
    if (sub.status === SubscriptionStatus.CANCELLED) {
        throw new ForbiddenException('Your subscription has been cancelled. Please contact billing to reactivate.');
    }

    // If the current date is past the end date and we aren't in a specifically exempt status
    if (new Date(sub.endDate) < now && sub.status !== SubscriptionStatus.ACTIVE) {
         // Special exception: allow the payment-related endpoints even if locked
         if (url.includes('/mpesa/stk-push') || url.includes('/auth/create-payment-intent')) {
             return true;
         }
         throw new ForbiddenException('Subscription expired. Access to data entry is locked until payment is settled.');
    }

    return true;
  }
}
