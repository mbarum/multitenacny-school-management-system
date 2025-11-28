
import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from '../entities/student.entity';
import { Transaction } from '../entities/transaction.entity';
import { Expense } from '../entities/expense.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Student, Transaction, Expense])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
