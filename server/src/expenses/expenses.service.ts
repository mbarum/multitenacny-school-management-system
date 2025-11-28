
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

  create(createExpenseDto: Omit<Expense, 'id'>, schoolId: string): Promise<Expense> {
    const expense = this.expensesRepository.create({
        ...createExpenseDto,
        school: { id: schoolId } as any
    });
    return this.expensesRepository.save(expense);
  }

  findAll(schoolId: string): Promise<Expense[]> {
    return this.expensesRepository.find({ where: { schoolId: schoolId as any } });
  }

  async remove(id: string, schoolId: string): Promise<void> {
    const result = await this.expensesRepository.delete({ id, schoolId: schoolId as any });
    if (result.affected === 0) {
      throw new NotFoundException(`Expense with ID "${id}" not found`);
    }
  }
}
