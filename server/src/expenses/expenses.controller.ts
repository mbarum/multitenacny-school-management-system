
import { Controller, Get, Post, Body, UseGuards, Param, Delete } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Expense } from '../entities/expense.entity';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../entities/user.entity';

@UseGuards(JwtAuthGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @Roles(Role.Admin, Role.Accountant)
  create(@Body() createExpenseDto: Omit<Expense, 'id'>) {
    return this.expensesService.create(createExpenseDto);
  }

  @Get()
  @Roles(Role.Admin, Role.Accountant)
  findAll() {
    return this.expensesService.findAll();
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.Accountant)
  remove(@Param('id') id: string) {
    return this.expensesService.remove(id);
  }
}
