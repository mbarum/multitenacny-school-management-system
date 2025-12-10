import { Module } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { PayrollController } from './payroll.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payroll } from '../entities/payroll.entity';
import { PayrollItem } from '../entities/payroll-item.entity';
import { PayrollEntry } from '../entities/payroll-entry.entity';
import { Staff } from '../entities/staff.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Payroll, PayrollItem, PayrollEntry, Staff])],
  controllers: [PayrollController],
  providers: [PayrollService]
})
export class PayrollModule {}