
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
    if (!schoolId) {
        return {
            totalStudents: 0,
            totalRevenue: 0,
            totalExpenses: 0,
            totalProfit: 0,
            feesOverdue: 0,
            monthlyData: [],
            expenseDistribution: []
        };
    }

    try {
        // 1. Total Active Students
        const totalStudents = await this.studentRepo.count({ 
            where: { status: StudentStatus.Active, schoolId: schoolId as any } 
        }).catch(err => {
            console.error('Error counting students:', err);
            return 0;
        });

        // 2. Aggregate Revenue
        const revenueResult = await this.transactionRepo
            .createQueryBuilder('t')
            .select('SUM(t.amount)', 'total')
            .where('t.type = :type', { type: TransactionType.Payment })
            .andWhere('t.schoolId = :schoolId', { schoolId })
            .getRawOne()
            .catch(err => {
                console.error('Error aggregating revenue:', err);
                return { total: 0 };
            });
        const totalRevenue = parseFloat(revenueResult?.total) || 0;

        // 3. Aggregate Expenses
        const expenseResult = await this.expenseRepo
            .createQueryBuilder('e')
            .select('SUM(e.amount)', 'total')
            .where('e.schoolId = :schoolId', { schoolId })
            .getRawOne()
            .catch(err => {
                console.error('Error aggregating expenses:', err);
                return { total: 0 };
            });
        const totalExpenses = parseFloat(expenseResult?.total) || 0;

        // 4. Calculate Ledger Overdue
        const agingResult = await this.transactionRepo
            .createQueryBuilder('t')
            .select("SUM(CASE WHEN t.type IN ('Invoice', 'ManualDebit') THEN t.amount ELSE -t.amount END)", 'balance')
            .where('t.schoolId = :schoolId', { schoolId })
            .getRawOne()
            .catch(err => {
                console.error('Error calculating overdue:', err);
                return { balance: 0 };
            });
        const feesOverdue = Math.max(0, parseFloat(agingResult?.balance) || 0);

        // 5. Monthly Trend
        const monthlyData = await this.getMonthlyFinancials(schoolId);

        // 6. Distribution Analysis
        const expenseDistribution = await this.getExpenseDistribution(schoolId);

        return {
            totalStudents: totalStudents || 0,
            totalRevenue,
            totalExpenses,
            totalProfit: totalRevenue - totalExpenses,
            feesOverdue,
            monthlyData: monthlyData || [],
            expenseDistribution: expenseDistribution || []
        };
    } catch (error) {
        console.error(`Dashboard Stats Error for School ${schoolId}:`, error);
        throw error;
    }
  }

  private async getMonthlyFinancials(schoolId: string) {
    const today = new Date();
    const targetMonths: string[] = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        targetMonths.push(d.toISOString().slice(0, 7)); // YYYY-MM
    }

    try {
        const financials = await this.monthlyFinancialRepo
            .createQueryBuilder('mf')
            .where('mf.schoolId = :schoolId', { schoolId })
            .andWhere('mf.monthKey IN (:...keys)', { keys: targetMonths })
            .orderBy('mf.monthKey', 'ASC')
            .getMany();

        return targetMonths.map(key => {
            const entry = financials.find(f => f.monthKey === key);
            const [year, month] = key.split('-');
            const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
            return {
                name: dateObj.toLocaleString('en-US', { month: 'short' }),
                income: entry ? Number(entry.totalIncome) : 0,
                expenses: entry ? Number(entry.totalExpenses) : 0
            };
        });
    } catch (error) {
        console.error(`Failed to fetch monthly financials for school ${schoolId}`, error);
        return targetMonths.map(key => {
            const [year, month] = key.split('-');
            const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
            return {
                name: dateObj.toLocaleString('en-US', { month: 'short' }),
                income: 0,
                expenses: 0
            };
        });
    }
  }

  private async getExpenseDistribution(schoolId: string) {
    try {
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
    } catch (error) {
        console.error(`Failed to fetch expense distribution for school ${schoolId}`, error);
        return [];
    }
  }
}
