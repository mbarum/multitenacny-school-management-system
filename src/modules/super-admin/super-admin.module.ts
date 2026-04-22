import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuperAdminController } from './super-admin.controller';
import { SuperAdminService } from './super-admin.service';
import { Tenant } from '../tenants/entities/tenant.entity';
import { PendingPayment } from '../payments/entities/pending-payment.entity';
import { Student } from '../students/entities/student.entity';
import { Attendance } from '../attendance/entities/attendance.entity';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant, PendingPayment, Student, Attendance]),
    TenantsModule,
  ],
  controllers: [SuperAdminController],
  providers: [SuperAdminService],
})
export class SuperAdminModule {}
