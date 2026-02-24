import { Injectable, Scope } from '@nestjs/common';
import { Tenant } from 'src/modules/tenants/entities/tenant.entity';

@Injectable({ scope: Scope.REQUEST })
export class TenancyService {
  private tenant: Tenant;

  setTenant(tenant: Tenant) {
    this.tenant = tenant;
  }

  getTenant(): Tenant {
    return this.tenant;
  }

  getTenantId(): string {
    return this.tenant?.id;
  }
}
