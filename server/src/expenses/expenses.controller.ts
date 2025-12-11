
import { Controller, Get, Post, Body, Param, Delete, Request, Patch, Res } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { Expense } from '../entities/expense.entity';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../entities/user.entity';

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @Roles(Role.Admin, Role.Accountant)
  create(@Request() req: any, @Body() createExpenseDto: Omit<Expense, 'id'>) {
    return this.expensesService.create(createExpenseDto, req.user.schoolId);
  }

  @Get()
  @Roles(Role.Admin, Role.Accountant)
  findAll(@Request() req: any) {
    return this.expensesService.findAll(req.user.schoolId);
  }

  @Get('export')
  @Roles(Role.Admin, Role.Accountant)
  async export(@Request() req: any, @Res() res: any) {
    const csv = await this.expensesService.exportExpenses(req.user.schoolId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="expenses.csv"');
    res.send(csv);
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.Accountant)
  update(@Request() req: any, @Param('id') id: string, @Body() updateExpenseDto: Partial<Expense>) {
    return this.expensesService.update(id, updateExpenseDto, req.user.schoolId);
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.Accountant)
  remove(@Request() req: any, @Param('id') id: string) {
    return this.expensesService.remove(id, req.user.schoolId);
  }
}
