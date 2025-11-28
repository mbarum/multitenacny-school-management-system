import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from '../entities/expense.entity';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private expensesRepository: Repository<Expense>,
  ) {}

  create(createExpenseDto: Omit<Expense, 'id'>): Promise<Expense> {
    const expense = this.expensesRepository.create(createExpenseDto);
    return this.expensesRepository.save(expense);
  }

  findAll(): Promise<Expense[]> {
    return this.expensesRepository.find();
  }

  async remove(id: string): Promise<void> {
    const result = await this.expensesRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Expense with ID "${id}" not found`);
    }
  }
}
