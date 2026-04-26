import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayrollService } from './payroll.service';
import { PayrollController } from './payroll.controller';
import { Payroll } from './entities/payroll.entity';
import { PayrollItemDefinition } from './entities/payroll-item-definition.entity';
import { StaffPayrollItem } from './entities/staff-payroll-item.entity';
import { TenancyModule } from 'src/core/tenancy/tenancy.module';
import { StaffModule } from '../staff/staff.module';

import { Staff } from '../staff/entities/staff.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Payroll,
      PayrollItemDefinition,
      StaffPayrollItem,
      Staff,
    ]),
    TenancyModule,
    StaffModule,
  ],
  controllers: [PayrollController],
  providers: [PayrollService],
})
export class PayrollModule {}
