import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantsService } from '../../tenants/tenants.service';
import {
  SubscriptionStatus,
  SubscriptionPlan,
} from '../../../common/subscription.enums';

export const SKIP_SUBSCRIPTION_CHECK = 'skipSubscriptionCheck';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private tenantsService: TenantsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skipCheck = this.reflector.getAllAndOverride<boolean>(
      SKIP_SUBSCRIPTION_CHECK,
      [context.getHandler(), context.getClass()],
    );

    if (skipCheck) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: { tenantId?: string } }>();
    const user = request.user;

    if (!user || !user.tenantId) {
      return true; // Let other guards handle unauthenticated or non-tenant users (e.g., super admin)
    }

    const tenant = await this.tenantsService.findOne(user.tenantId);

    if (!tenant) {
      throw new ForbiddenException('Tenant not found');
    }

    const now = new Date();
    const isExpired = tenant.expiresAt && tenant.expiresAt < now;

    if (
      (tenant.subscriptionStatus !== SubscriptionStatus.ACTIVE || isExpired) &&
      tenant.plan !== SubscriptionPlan.FREE
    ) {
      // If the subscription is past due, canceled, inactive, or expired, lock the account
      throw new HttpException(
        'Your subscription is inactive or past due. Please update your payment details to unlock your account.',
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    return true;
  }
}
