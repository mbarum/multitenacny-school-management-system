import { Controller, Get, UseGuards, Param } from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from 'src/core/decorators/roles.decorator';
import { UserRole } from 'src/common/user-role.enum';

@Controller('super-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get('analytics')
  getDashboardAnalytics() {
    return this.superAdminService.getDashboardAnalytics();
  }

  @Get('tenants')
  getAllTenants() {
    return this.superAdminService.getAllTenants();
  }

  @Get('tenants/:id')
  getTenantById(@Param('id') id: string) {
    return this.superAdminService.getTenantById(id);
  }

  @Get('payments/pending')
  getPendingPayments() {
    return this.superAdminService.getPendingPayments();
  }
    return this.superAdminService.getTenantById(id);
  }
    return this.superAdminService.getDashboardAnalytics();
  }
}
