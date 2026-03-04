import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportingService } from './reporting.service';
import { ReportingController } from './reporting.controller';
import { TenancyModule } from 'src/core/tenancy/tenancy.module';
import { UsersModule } from '../users/users.module';
import { Fee } from '../fees/entities/fee.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { Attendance } from '../attendance/entities/attendance.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Fee, Expense, Attendance]),
    TenancyModule,
    UsersModule,
  ],
  controllers: [ReportingController],
  providers: [ReportingService],
})
export class ReportingModule {}
