import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from './entities/expense.entity';
import { TenancyService } from 'src/core/tenancy/tenancy.service';
import { TenantAwareCrudService } from 'src/core/common/tenant-aware-crud.service';
import { FinanceService } from '../finance/finance.service';
import { CreateExpenseDto } from './dto/create-expense.dto';

@Injectable()
export class ExpensesService extends TenantAwareCrudService<Expense> {
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    tenancyService: TenancyService,
    private readonly financeService: FinanceService,
  ) {
    super(expenseRepository, tenancyService);
  }

  async create(createDto: CreateExpenseDto): Promise<Expense> {
    const expense = await super.create(createDto);

    // Automatically post to general ledger
    // Debit: Expense Account (5001 Default)
    // Credit: Cash/Bank (1001 Default)
    try {
      await this.financeService.createJournalEntry({
        reference: `EXP-${expense.id}`,
        description: `Expense: ${expense.category} - ${expense.description || 'N/A'}`,
        date: new Date(expense.date),
        lines: [
          { accountCode: '5001', debit: Number(expense.amount), credit: 0 },
          { accountCode: '1001', debit: 0, credit: Number(expense.amount) },
        ],
      });
    } catch (error) {
      console.error('Failed to post expense to ledger', error);
      // We still return the expense even if ledger posting fails, 
      // but in production we might want to wrap this in a transaction.
    }

    return expense;
  }
}
