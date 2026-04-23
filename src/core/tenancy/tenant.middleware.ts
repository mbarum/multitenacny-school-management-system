import {
  Injectable,
  NestMiddleware,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantsService } from '../../modules/tenants/tenants.service';
import { TenancyService } from './tenancy.service';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '../../common/user-role.enum';

export interface JwtPayload {
  tenantId?: string;
  role?: UserRole;
  sub?: string;
  username?: string;
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantMiddleware.name);

  constructor(
    private readonly tenantsService: TenantsService,
    private readonly tenancyService: TenancyService,
    private readonly jwtService: JwtService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Skip tenant check for public auth routes
    if (req.originalUrl.includes('/api/auth/')) {
      return next();
    }

    let tenantId: string | undefined;
    let isImpersonating = false;
    const authHeader = req.headers.authorization;

    // 1. Try to extract and verify tenantId from JWT if Authorization header is present
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        // We use verify here to ensure the token is legitimate before trusting its tenantId
        const payload = this.jwtService.verify(token) as unknown as JwtPayload;

        if (payload && payload.tenantId) {
          tenantId = payload.tenantId;

          // Security: If an x-tenant-id header is also provided, it MUST match the JWT tenantId
          // This prevents tenant enumeration or spoofing by authenticated users.
          const headerTenantId = req.headers['x-tenant-id'] as string;
          if (headerTenantId && headerTenantId !== tenantId) {
            if (payload.role === UserRole.SUPER_ADMIN) {
              // Allow SUPER_ADMIN to override the tenantId for impersonation/management
              tenantId = headerTenantId;
              isImpersonating = true;
            } else {
              throw new ForbiddenException(
                'Security Violation: Provided Tenant ID does not match authenticated session',
              );
            }
          }
        } else if (payload && payload.role === UserRole.SUPER_ADMIN) {
          // If SUPER_ADMIN doesn't have a tenantId in their token, they can still provide one via header
          const headerTenantId = req.headers['x-tenant-id'] as string;
          if (headerTenantId) {
            tenantId = headerTenantId;
            isImpersonating = true;
          }
        }

        if (isImpersonating && tenantId) {
          this.logger.warn(`IMPERSONATION DETECTED: Super Admin ${payload.username} (${payload.sub}) is accessing Tenant ${tenantId}`);
        }
      } catch (error) {
        // If verification fails, we don't trust the JWT.
        // We fall back to checking the header, but JwtAuthGuard will likely block the request later if it's protected.
        if (error instanceof ForbiddenException) {
          throw error;
        }
      }
    }

    // 2. Fallback to x-tenant-id header if not set by JWT
    if (!tenantId) {
      tenantId = req.headers['x-tenant-id'] as string;
    }

    // 3. Final check for tenantId presence
    if (!tenantId) {
      // Allow health check without tenantId
      if (req.originalUrl.includes('/api/health')) {
        return next();
      }
      
      // Allow super-admin routes to bypass tenant check if no tenant is specified
      if (req.originalUrl.includes('/api/super-admin')) {
        return next();
      }
      
      throw new NotFoundException('Tenant ID not provided');
    }

    // 4. Verify tenant existence in database
    try {
      const tenant = await this.tenantsService.findOne(tenantId);
      if (!tenant) {
        throw new NotFoundException('Tenant not found');
      }
      this.tenancyService.setTenant(tenant);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('Invalid Tenant ID');
    }

    next();
  }
}
