import { Controller, Get, UseGuards, Param, Patch, Body, Put } from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from 'src/core/decorators/roles.decorator';
import { UserRole } from 'src/common/user-role.enum';
import { SystemConfigService } from '../config/system-config.service';

@Controller('super-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class SuperAdminController {
  constructor(
    private readonly superAdminService: SuperAdminService,
    private readonly systemConfigService: SystemConfigService,
  ) {}

  @Get('config')
  getAllConfig() {
    return this.systemConfigService.getAllSettings();
  }

  @Put('config')
  updateConfig(@Body() settings: Record<string, string>) {
    return this.systemConfigService.setMultiple(settings);
  }

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

  @Patch('tenants/:id/status')
  updateTenantStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.superAdminService.updateTenantStatus(id, status);
  }
}
