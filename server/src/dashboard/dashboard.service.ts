
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student, StudentStatus } from '../entities/student.entity';
import { Transaction, TransactionType } from '../entities/transaction.entity';
import { Expense } from '../entities/expense.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Student) private studentRepo: Repository<Student>,
    @InjectRepository(Transaction) private transactionRepo: Repository<Transaction>,
    @InjectRepository(Expense) private expenseRepo: Repository<Expense>,
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

    // 5. Get Monthly Data (Filtered by School)
    const monthlyData = await this.getMonthlyFinancials(schoolId);

    // 6. Get Expense Distribution (Filtered by School)
    const expenseDistribution = await this.getExpenseDistribution(schoolId);

    return {
      totalStudents,
      totalRevenue,
      totalExpenses,
      feesOverdue,
      monthlyData,
      expenseDistribution
    };
  }

  private async getMonthlyFinancials(schoolId: string) {
    const today = new Date();
    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);
    const startDateStr = sixMonthsAgo.toISOString().split('T')[0];

    const incomeData = await this.transactionRepo
      .createQueryBuilder('t')
      .select("SUBSTRING(t.date, 1, 7)", 'month')
      .addSelect("SUM(t.amount)", 'income')
      .where("t.type = :type", { type: TransactionType.Payment })
      .andWhere("t.date >= :startDate", { startDate: startDateStr })
      .andWhere("t.schoolId = :schoolId", { schoolId })
      .groupBy("month")
      .orderBy("month", "ASC")
      .getRawMany();

    const expenseData = await this.expenseRepo
      .createQueryBuilder('e')
      .select("SUBSTRING(e.date, 1, 7)", 'month')
      .addSelect("SUM(e.amount)", 'expense')
      .where("e.date >= :startDate", { startDate: startDateStr })
      .andWhere("e.schoolId = :schoolId", { schoolId })
      .groupBy("month")
      .orderBy("month", "ASC")
      .getRawMany();

    const months: { name: string; income: number; expenses: number }[] = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthKey = d.toISOString().slice(0, 7);
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
