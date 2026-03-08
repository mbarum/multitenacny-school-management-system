import {
  Injectable,
  NestMiddleware,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantsService } from 'src/modules/tenants/tenants.service';
import { TenancyService } from './tenancy.service';
import { JwtService } from '@nestjs/jwt';

export interface JwtPayload {
  tenantId?: string;
  role?: string;
  sub?: string;
  username?: string;
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
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

    let tenantId = req.headers['x-tenant-id'] as string;

    // If tenantId is not in header, try to get it from JWT
    const authHeader = req.headers.authorization;
    if (!tenantId && authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decodedToken: unknown = this.jwtService.decode(token);
        if (decodedToken && typeof decodedToken === 'object' && 'tenantId' in decodedToken) {
          const payload = decodedToken as { tenantId?: string };
          if (payload.tenantId) {
            tenantId = payload.tenantId;
          }
        }
      } catch {
        // Ignore decoding errors here, JwtAuthGuard will handle it later
      }
    }

    if (!tenantId) {
      // For some routes, we might want to allow missing tenantId (e.g. health check)
      if (req.originalUrl.includes('/api/health')) {
        return next();
      }
      throw new NotFoundException('Tenant ID not provided');
    }

    // Security: If a JWT is provided, verify the tenantId matches
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const payload = this.jwtService.verify(
          token,
        ) as unknown as JwtPayload | null;
        if (
          payload &&
          payload.tenantId &&
          payload.tenantId !== tenantId &&
          payload.role !== 'super_admin'
        ) {
          throw new ForbiddenException('Cross-tenant access denied');
        }
      } catch {
        // Token is invalid or expired. JwtAuthGuard will handle the final rejection.
      }
    }

    const tenant = await this.tenantsService.findOne(tenantId);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    this.tenancyService.setTenant(tenant);
    next();
  }
}
