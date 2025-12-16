
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student, StudentStatus } from '../entities/student.entity';
import { Transaction, TransactionType } from '../entities/transaction.entity';
import { Expense } from '../entities/expense.entity';
import { MonthlyFinancial } from '../entities/monthly-financial.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Student) private studentRepo: Repository<Student>,
    @InjectRepository(Transaction) private transactionRepo: Repository<Transaction>,
    @InjectRepository(Expense) private expenseRepo: Repository<Expense>,
    @InjectRepository(MonthlyFinancial) private monthlyFinancialRepo: Repository<MonthlyFinancial>,
  ) {}

  async getDashboardStats(schoolId: string) {
    // 1. Count Total Students (Filtered by School)
    const totalStudents = await this.studentRepo.count({ 
        where: { status: StudentStatus.Active, schoolId: schoolId as any } 
    });

    // 2. Calculate Total Revenue (Filtered by School)
    const revenueResult = await this.transactionRepo
      .createQueryBuilder('t')
      .select('SUM(t.amount)', 'total')
      .where('t.type = :type', { type: TransactionType.Payment })
      .andWhere('t.schoolId = :schoolId', { schoolId })
      .getRawOne();
    const totalRevenue = parseFloat(revenueResult.total) || 0;

    // 3. Calculate Total Expenses (Filtered by School)
    const expenseResult = await this.expenseRepo
      .createQueryBuilder('e')
      .select('SUM(e.amount)', 'total')
      .where('e.schoolId = :schoolId', { schoolId })
      .getRawOne();
    const totalExpenses = parseFloat(expenseResult.total) || 0;

    // 4. Calculate Total Fees Overdue (Filtered by School)
    const invoiceResult = await this.transactionRepo
      .createQueryBuilder('t')
      .select('SUM(t.amount)', 'total')
      .where('t.type IN (:...types)', { types: [TransactionType.Invoice, TransactionType.ManualDebit] })
      .andWhere('t.schoolId = :schoolId', { schoolId })
      .getRawOne();
    const totalInvoiced = parseFloat(invoiceResult.total) || 0;
    
    const creditResult = await this.transactionRepo
      .createQueryBuilder('t')
      .select('SUM(t.amount)', 'total')
      .where('t.type IN (:...types)', { types: [TransactionType.Payment, TransactionType.ManualCredit] })
      .andWhere('t.schoolId = :schoolId', { schoolId })
      .getRawOne();
    const totalCredited = parseFloat(creditResult.total) || 0;
    
    const feesOverdue = Math.max(0, totalInvoiced - totalCredited);

    // 5. Calculate Profit
    const totalProfit = totalRevenue - totalExpenses;

    // 6. Get Monthly Data (Optimized via Pre-calculated table)
    const monthlyData = await this.getMonthlyFinancials(schoolId);

    // 7. Get Expense Distribution (Filtered by School)
    const expenseDistribution = await this.getExpenseDistribution(schoolId);

    return {
      totalStudents,
      totalRevenue,
      totalExpenses,
      totalProfit,
      feesOverdue,
      monthlyData,
      expenseDistribution
    };
  }

  private async getMonthlyFinancials(schoolId: string) {
    const today = new Date();
    // Get last 6 months
    const targetMonths: string[] = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        targetMonths.push(d.toISOString().slice(0, 7)); // YYYY-MM
    }

    // Query pre-calculated table
    const financials = await this.monthlyFinancialRepo
        .createQueryBuilder('mf')
        .where('mf.schoolId = :schoolId', { schoolId })
        .andWhere('mf.monthKey IN (:...keys)', { keys: targetMonths })
        .orderBy('mf.monthKey', 'ASC')
        .getMany();

    // Map to response format, filling gaps with zeros
    const result = targetMonths.map(key => {
        const entry = financials.find(f => f.monthKey === key);
        const [year, month] = key.split('-');
        const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
        
        return {
            name: dateObj.toLocaleString('default', { month: 'short' }),
            income: entry ? Number(entry.totalIncome) : 0,
            expenses: entry ? Number(entry.totalExpenses) : 0
        };
    });

    return result;
  }

  private async getExpenseDistribution(schoolId: string) {
    const distribution = await this.expenseRepo
      .createQueryBuilder('e')
      .select('e.category', 'name')
      .addSelect('SUM(e.amount)', 'value')
      .where('e.schoolId = :schoolId', { schoolId })
      .groupBy('e.category')
      .getRawMany();

    return distribution.map(d => ({
        name: d.name,
        value: parseFloat(d.value) || 0
    }));
  }
}
