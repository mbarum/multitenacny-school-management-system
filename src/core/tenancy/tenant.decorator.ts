import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Tenant } from 'src/modules/tenants/entities/tenant.entity';

export const GetTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Tenant => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenant;
  },
);
