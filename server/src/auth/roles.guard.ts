
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../entities/user.entity';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are required, allow access
    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) return false;

    // SuperAdmin has God Mode (can access everything)
    if (user.role === Role.SuperAdmin) {
        return true;
    }

    // Protection for SuperAdmin routes: Only SuperAdmin can access
    if (requiredRoles.includes(Role.SuperAdmin)) {
        return user.role === Role.SuperAdmin;
    }

    // Admin can access all School-level routes
    if (user.role === Role.Admin) {
        return true;
    }

    return requiredRoles.some((role) => user.role === role);
  }
}
