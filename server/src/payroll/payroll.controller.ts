
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
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
  generatePayrollRun(@Request() req: any, @Body() payrollData: any[]) {
    return this.payrollService.savePayrollRun(payrollData, req.user.schoolId);
  }

  @Get('payroll-history')
  getPayrollHistory(@Request() req: any, @Query() query: GetPayrollHistoryDto) {
    return this.payrollService.getPayrollHistory(query, req.user.schoolId);
  }

  @Post('payroll-items')
  createPayrollItem(@Request() req: any, @Body() itemData: Omit<PayrollItem, 'id'>) {
    return this.payrollService.createPayrollItem(itemData, req.user.schoolId);
  }

  @Get('payroll-items')
  getPayrollItems(@Request() req: any) {
    return this.payrollService.getPayrollItems(req.user.schoolId);
  }

  @Patch('payroll-items/:id')
  updatePayrollItem(@Request() req: any, @Param('id') id: string, @Body() itemData: Partial<PayrollItem>) {
    return this.payrollService.updatePayrollItem(id, itemData, req.user.schoolId);
  }

  @Delete('payroll-items/:id')
  deletePayrollItem(@Request() req: any, @Param('id') id: string) {
    return this.payrollService.deletePayrollItem(id, req.user.schoolId);
  }
}
