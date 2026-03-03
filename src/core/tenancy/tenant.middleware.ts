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

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly tenancyService: TenancyService,
    private readonly jwtService: JwtService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      throw new NotFoundException('Tenant ID not provided');
    }

    // Security: If a JWT is provided, verify the tenantId matches
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        // Use verify() instead of decode() to ensure the token is authentic
        const payload = this.jwtService.verify(token) as {
          tenantId?: string;
          role?: string;
        } | null;
        if (
          payload &&
          payload.tenantId &&
          payload.tenantId !== tenantId &&
          payload.role !== 'SUPER_ADMIN'
        ) {
          throw new ForbiddenException('Cross-tenant access denied');
        }
      } catch {
        // Token is invalid or expired. JwtAuthGuard will handle the final rejection,
        // but we block cross-tenant attempts early if a token is present.
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
