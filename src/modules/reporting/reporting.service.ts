import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Fee } from '../fees/entities/fee.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { Attendance } from '../attendance/entities/attendance.entity';
import { TenancyService } from 'src/core/tenancy/tenancy.service';
import * as ExcelJS from 'exceljs';

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
      (sum, fee) => sum + (fee.status === 'paid' ? Number(fee.amount) : 0),
      0,
    );
    const totalExpenses = expenses.reduce(
      (sum, expense) => sum + Number(expense.amount),
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

  async exportFinancialsToExcel(startDate: Date, endDate: Date): Promise<Buffer> {
    const report = await this.generateFinancialReport(startDate, endDate);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Financial Report');

    worksheet.columns = [
      { header: 'Type', key: 'type', width: 15 },
      { header: 'Description', key: 'description', width: 30 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Date', key: 'date', width: 20 },
    ];

    report.fees.forEach(fee => {
      worksheet.addRow({
        type: 'Income (Fee)',
        description: `Fee for student ${fee.studentId}`,
        amount: fee.amount,
        date: fee.dueDate,
      });
    });

    report.expenses.forEach(expense => {
      worksheet.addRow({
        type: 'Expense',
        description: expense.description,
        amount: expense.amount,
        date: expense.date,
      });
    });

    worksheet.addRow({});
    worksheet.addRow({ type: 'TOTAL INCOME', amount: report.totalIncome });
    worksheet.addRow({ type: 'TOTAL EXPENSES', amount: report.totalExpenses });
    worksheet.addRow({ type: 'NET PROFIT', amount: report.netProfit });

    return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
  }

  async generateAttendanceReport(classLevelId: string) {
    const tenantId = this.tenancyService.getTenantId();
    return this.attendanceRepository.find({
      where: { tenantId, classLevelId },
      relations: ['student'],
    });
  }
}
