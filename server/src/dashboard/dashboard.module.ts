
import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from '../entities/student.entity';
import { Transaction } from '../entities/transaction.entity';
import { Expense } from '../entities/expense.entity';
import { MonthlyFinancial } from '../entities/monthly-financial.entity';
import { ClassFee } from '../entities/class-fee.entity';
import { FeeItem } from '../entities/fee-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Student, Transaction, Expense, MonthlyFinancial, ClassFee, FeeItem])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}

