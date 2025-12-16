
import { EventSubscriber, EntitySubscriberInterface, InsertEvent, UpdateEvent, RemoveEvent, DataSource, Repository } from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { Transaction, TransactionType } from '../entities/transaction.entity';
import { Expense } from '../entities/expense.entity';
import { MonthlyFinancial } from '../entities/monthly-financial.entity';

@Injectable()
@EventSubscriber()
export class FinancialSubscriber implements EntitySubscriberInterface {
    private readonly logger = new Logger(FinancialSubscriber.name);

    constructor(dataSource: DataSource) {
        dataSource.subscribers.push(this);
    }

    listenTo() {
        // We listen globally and filter in methods because we need to handle both Transaction and Expense
        return undefined; 
    }

    async afterInsert(event: InsertEvent<any>) {
        await this.handleFinancialChange(event.entity, event.manager.getRepository(MonthlyFinancial), event.manager);
    }

    async afterUpdate(event: UpdateEvent<any>) {
        await this.handleFinancialChange(event.entity, event.manager.getRepository(MonthlyFinancial), event.manager);
    }

    async afterRemove(event: RemoveEvent<any>) {
        await this.handleFinancialChange(event.databaseEntity, event.manager.getRepository(MonthlyFinancial), event.manager);
    }

    private async handleFinancialChange(entity: any, summaryRepo: Repository<MonthlyFinancial>, manager: any) {
        if (entity instanceof Transaction || entity instanceof Expense) {
            if (!entity.date || !entity.schoolId) return;

            const date = new Date(entity.date);
            const year = date.getFullYear();
            const month = date.getMonth() + 1; // 1-12
            const monthKey = `${year}-${String(month).padStart(2, '0')}`;
            const schoolId = entity.schoolId;

            // Recalculate totals for this specific month/school to ensure consistency
            // This avoids drift that happens with simple increment/decrement logic
            
            // 1. Calculate Income
            const incomeResult = await manager
                .getRepository(Transaction)
                .createQueryBuilder('t')
                .select('SUM(t.amount)', 'total')
                .where('t.type = :type', { type: TransactionType.Payment })
                .andWhere('t.schoolId = :schoolId', { schoolId })
                .andWhere('t.date LIKE :monthPattern', { monthPattern: `${monthKey}%` })
                .getRawOne();
            
            const totalIncome = parseFloat(incomeResult.total) || 0;

            // 2. Calculate Expenses
            const expenseResult = await manager
                .getRepository(Expense)
                .createQueryBuilder('e')
                .select('SUM(e.amount)', 'total')
                .where('e.schoolId = :schoolId', { schoolId })
                .andWhere('e.date LIKE :monthPattern', { monthPattern: `${monthKey}%` })
                .getRawOne();

            const totalExpenses = parseFloat(expenseResult.total) || 0;

            // 3. Upsert Summary Record
            let summary = await summaryRepo.findOne({ where: { schoolId: schoolId as any, year, month } });
            
            if (!summary) {
                summary = summaryRepo.create({
                    schoolId,
                    year,
                    month,
                    monthKey
                });
            }

            summary.totalIncome = totalIncome;
            summary.totalExpenses = totalExpenses;
            
            await summaryRepo.save(summary);
            this.logger.log(`Updated Monthly Financials for ${monthKey} (School: ${schoolId})`);
        }
    }
}
