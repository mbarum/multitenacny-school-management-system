import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuperAdminController } from './super-admin.controller';
import { SuperAdminService } from './super-admin.service';
import { Tenant } from '../tenants/entities/tenant.entity';
import { PendingPayment } from '../payments/entities/pending-payment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, PendingPayment])],
  controllers: [SuperAdminController],
  providers: [SuperAdminService],
})
export class SuperAdminModule {}
