
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from '../entities/expense.entity';
import { GetExpensesDto } from './dto/get-expenses.dto';
import { CsvUtil } from '../utils/csv.util';

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

  async findAll(query: GetExpensesDto, schoolId: string): Promise<any> {
    const { page = 1, limit = 10, pagination, startDate, endDate, category } = query;
    const qb = this.expensesRepository.createQueryBuilder('expense');
    qb.where('expense.schoolId = :schoolId', { schoolId });

    if (startDate) qb.andWhere('expense.date >= :startDate', { startDate });
    if (endDate) qb.andWhere('expense.date <= :endDate', { endDate });
    if (category) qb.andWhere('expense.category = :category', { category });

    qb.orderBy('expense.date', 'DESC');

    if (pagination === 'false') {
        return qb.getMany();
    }

    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);
    const [data, total] = await qb.getManyAndCount();

    return {
        data,
        total,
        page,
        limit,
        last_page: Math.ceil(total / limit)
    };
  }

  async update(id: string, updateDto: Partial<Expense>, schoolId: string): Promise<Expense> {
    const expense = await this.expensesRepository.findOne({ where: { id, schoolId: schoolId as any } });
    if (!expense) throw new NotFoundException(`Expense with ID "${id}" not found`);
    
    Object.assign(expense, updateDto);
    return this.expensesRepository.save(expense);
  }

  async remove(id: string, schoolId: string): Promise<void> {
    const result = await this.expensesRepository.delete({ id, schoolId: schoolId as any });
    if (result.affected === 0) {
      throw new NotFoundException(`Expense with ID "${id}" not found`);
    }
  }

  async exportExpenses(schoolId: string, query: GetExpensesDto): Promise<string> {
    const { startDate, endDate, category } = query;
    const qb = this.expensesRepository.createQueryBuilder('expense');
    qb.where('expense.schoolId = :schoolId', { schoolId });

    if (startDate) qb.andWhere('expense.date >= :startDate', { startDate });
    if (endDate) qb.andWhere('expense.date <= :endDate', { endDate });
    if (category) qb.andWhere('expense.category = :category', { category });

    qb.orderBy('expense.date', 'DESC');

    const expenses = await qb.getMany();
    
    const data = expenses.map(e => ({
        Date: e.date,
        Category: e.category,
        Description: e.description,
        Amount: e.amount
    }));
    return CsvUtil.generate(data, ['Date', 'Category', 'Description', 'Amount']);
  }
}
