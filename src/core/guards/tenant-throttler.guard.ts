import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class TenantThrottlerGuard extends ThrottlerGuard {
  protected override getTracker(req: Record<string, any>): Promise<string> {
    const tenantId = (req.headers as Record<string, string | undefined>)['x-tenant-id'] || 'global';
    return Promise.resolve(`tenant_${tenantId}`);
  }
}
