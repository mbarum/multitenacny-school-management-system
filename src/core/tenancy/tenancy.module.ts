import { Module, MiddlewareConsumer, NestModule, Global, forwardRef } from '@nestjs/common';
import { TenancyService } from './tenancy.service';
import { TenantMiddleware } from './tenant.middleware';
import { TenantsModule } from 'src/modules/tenants/tenants.module'; // To find tenants

@Global()
@Module({
  imports: [forwardRef(() => TenantsModule)],
  providers: [TenancyService, TenantMiddleware],
  exports: [TenancyService],
})
export class TenancyModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*path');
  }
}
