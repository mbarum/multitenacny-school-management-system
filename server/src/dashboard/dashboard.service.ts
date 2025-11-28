
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student, StudentStatus } from '../entities/student.entity';
import { Transaction, TransactionType } from '../entities/transaction.entity';
import { Expense, ExpenseCategory } from '../entities/expense.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Student) private studentRepo: Repository<Student>,
    @InjectRepository(Transaction) private transactionRepo: Repository<Transaction>,
    @InjectRepository(Expense) private expenseRepo: Repository<Expense>,
  ) {}

  async getDashboardStats() {
    // 1. Count Total Students
    const totalStudents = await this.studentRepo.count({ where: { status: StudentStatus.Active } });

    // 2. Calculate Total Revenue (Sum of Payments)
    const revenueResult = await this.transactionRepo
      .createQueryBuilder('t')
      .select('SUM(t.amount)', 'total')
      .where('t.type = :type', { type: TransactionType.Payment })
      .getRawOne();
    const totalRevenue = parseFloat(revenueResult.total) || 0;

    // 3. Calculate Total Expenses
    const expenseResult = await this.expenseRepo
      .createQueryBuilder('e')
      .select('SUM(e.amount)', 'total')
      .getRawOne();
    const totalExpenses = parseFloat(expenseResult.total) || 0;

    // 4. Calculate Total Fees Overdue (Total Invoices + Manual Debits) - (Total Payments + Manual Credits)
    const invoiceResult = await this.transactionRepo
      .createQueryBuilder('t')
      .select('SUM(t.amount)', 'total')
      .where('t.type IN (:...types)', { types: [TransactionType.Invoice, TransactionType.ManualDebit] })
      .getRawOne();
    const totalInvoiced = parseFloat(invoiceResult.total) || 0;
    
    const creditResult = await this.transactionRepo
      .createQueryBuilder('t')
      .select('SUM(t.amount)', 'total')
      .where('t.type IN (:...types)', { types: [TransactionType.Payment, TransactionType.ManualCredit] })
      .getRawOne();
    const totalCredited = parseFloat(creditResult.total) || 0;
    
    const feesOverdue = Math.max(0, totalInvoiced - totalCredited);

    // 5. Get Monthly Data (Last 6 Months)
    const monthlyData = await this.getMonthlyFinancials();

    // 6. Get Expense Distribution
    const expenseDistribution = await this.getExpenseDistribution();

    return {
      totalStudents,
      totalRevenue,
      totalExpenses,
      feesOverdue,
      monthlyData,
      expenseDistribution
    };
  }

  private async getMonthlyFinancials() {
    const today = new Date();
    // Go back 5 months to get a 6-month range including current
    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);
    const startDateStr = sixMonthsAgo.toISOString().split('T')[0];

    // Group Payments by Month
    // Note: SUBSTRING(date, 1, 7) gets 'YYYY-MM' format from ISO date string stored in DB
    const incomeData = await this.transactionRepo
      .createQueryBuilder('t')
      .select("SUBSTRING(t.date, 1, 7)", 'month')
      .addSelect("SUM(t.amount)", 'income')
      .where("t.type = :type", { type: TransactionType.Payment })
      .andWhere("t.date >= :startDate", { startDate: startDateStr })
      .groupBy("month")
      .orderBy("month", "ASC")
      .getRawMany();

    // Group Expenses by Month
    const expenseData = await this.expenseRepo
      .createQueryBuilder('e')
      .select("SUBSTRING(e.date, 1, 7)", 'month')
      .addSelect("SUM(e.amount)", 'expense')
      .where("e.date >= :startDate", { startDate: startDateStr })
      .groupBy("month")
      .orderBy("month", "ASC")
      .getRawMany();

    // Merge Data into a clean array for the frontend
    const months: { name: string; income: number; expenses: number }[] = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthKey = d.toISOString().slice(0, 7); // YYYY-MM
        const monthName = d.toLocaleString('default', { month: 'short' });
        
        const incomeEntry = incomeData.find(i => i.month === monthKey);
        const expenseEntry = expenseData.find(e => e.month === monthKey);

        months.push({
            name: monthName,
            income: parseFloat(incomeEntry?.income) || 0,
            expenses: parseFloat(expenseEntry?.expense) || 0
        });
    }
    return months;
  }

  private async getExpenseDistribution() {
    const distribution = await this.expenseRepo
      .createQueryBuilder('e')
      .select('e.category', 'name')
      .addSelect('SUM(e.amount)', 'value')
      .groupBy('e.category')
      .getRawMany();

    return distribution.map(d => ({
        name: d.name,
        value: parseFloat(d.value) || 0
    }));
  }
}
