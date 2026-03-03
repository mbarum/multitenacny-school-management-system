import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Fee } from '../fees/entities/fee.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { Attendance } from '../attendance/entities/attendance.entity';
import { TenancyService } from 'src/core/tenancy/tenancy.service';

@Injectable()
export class ReportingService {
  constructor(
    @InjectRepository(Fee)
    private readonly feeRepository: Repository<Fee>,
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    private readonly tenancyService: TenancyService,
  ) {}

  async generateFinancialReport(startDate: Date, endDate: Date) {
    const tenantId = this.tenancyService.getTenantId();
    const fees = await this.feeRepository.find({
      where: { tenantId, dueDate: Between(startDate, endDate) },
    });
    const expenses = await this.expenseRepository.find({
      where: { tenantId, date: Between(startDate, endDate) },
    });

    const totalIncome = fees.reduce(
      (sum, fee) => sum + (fee.status === 'paid' ? fee.amount : 0),
      0,
    );
    const totalExpenses = expenses.reduce(
      (sum, expense) => sum + expense.amount,
      0,
    );

    return {
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
      fees,
      expenses,
    };
  }

  async generateAttendanceReport(_classLevel: string) {
    const tenantId = this.tenancyService.getTenantId();
    // This is a simplified example. A real implementation would join with students table.
    const attendance = await this.attendanceRepository.find({
      where: { tenantId },
    });
    return attendance;
  }
}
