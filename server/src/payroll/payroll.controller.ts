
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PayrollItem } from '../entities/all-entities';
import { GetPayrollHistoryDto } from './dto/get-payroll-history.dto';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../entities/user.entity';

@UseGuards(JwtAuthGuard)
@Roles(Role.Admin, Role.Accountant)
@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Post('generate')
  generatePayrollRun(@Body() payrollData: any[]) {
    return this.payrollService.savePayrollRun(payrollData);
  }

  @Get('payroll-history')
  getPayrollHistory(@Query() query: GetPayrollHistoryDto) {
    return this.payrollService.getPayrollHistory(query);
  }

  @Post('payroll-items')
  createPayrollItem(@Body() itemData: Omit<PayrollItem, 'id'>) {
    return this.payrollService.createPayrollItem(itemData);
  }

  @Get('payroll-items')
  getPayrollItems() {
    return this.payrollService.getPayrollItems();
  }

  @Patch('payroll-items/:id')
  updatePayrollItem(@Param('id') id: string, @Body() itemData: Partial<PayrollItem>) {
    return this.payrollService.updatePayrollItem(id, itemData);
  }

  @Delete('payroll-items/:id')
  deletePayrollItem(@Param('id') id: string) {
    return this.payrollService.deletePayrollItem(id);
  }
}