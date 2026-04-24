import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/user-role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('dashboard')
  @Roles(UserRole.ADMIN)
  getDashboardMetrics() {
    return this.financeService.getDashboardMetrics();
  }

  @Get('invoices')
  @Roles(UserRole.ADMIN)
  getInvoices() {
    return this.financeService.getInvoices();
  }

  @Post('invoices')
  @Roles(UserRole.ADMIN)
  createInvoice(@Body() data: any) {
    return this.financeService.createInvoice(data);
  }

  @Post('payments')
  @Roles(UserRole.ADMIN)
  recordPayment(@Body() data: any) {
    return this.financeService.recordPayment(data);
  }

  @Post('seed-accounts')
  @Roles(UserRole.ADMIN)
  seedAccounts(@Body('tenantId') tenantId: string) {
    return this.financeService.seedDefaultAccounts(tenantId);
  }
}
