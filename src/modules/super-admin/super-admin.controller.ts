import {
  Controller,
  Post,
  Get,
  UseGuards,
  Param,
  Patch,
  Body,
  Put,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { SuperAdminService } from './super-admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from 'src/core/decorators/roles.decorator';
import { UserRole } from 'src/common/user-role.enum';
import { SystemConfigService } from '../config/system-config.service';
import { TenantsService } from '../tenants/tenants.service';
import { CreateTenantDto } from '../tenants/dto/create-tenant.dto';

@Controller('super-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class SuperAdminController {
  constructor(
    private readonly superAdminService: SuperAdminService,
    private readonly systemConfigService: SystemConfigService,
    private readonly tenantsService: TenantsService,
  ) {}

  @Post('tenants')
  createTenant(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantsService.create(createTenantDto);
  }

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

  @Post('payments/:id/confirm')
  confirmPayment(@Param('id') id: string) {
    return this.superAdminService.confirmPayment(id);
  }

  @Get('payments/:id/invoice')
  async getInvoice(@Param('id') id: string, @Res() res: Response) {
    const { pdfBase64, filename } = await this.superAdminService.getInvoicePDF(id);
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=${filename}`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }

  @Get('payments/:id/receipt')
  async getReceipt(@Param('id') id: string, @Res() res: Response) {
    const { pdfBase64, filename } = await this.superAdminService.getReceiptPDFForDownload(id);
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=${filename}`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }

  @Post('payments/:id/resend')
  async resendReceipt(@Param('id') id: string) {
    return this.superAdminService.resendReceipt(id);
  }

  @Patch('tenants/:id/status')
  updateTenantStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.superAdminService.updateTenantStatus(id, status);
  }

  @Patch('tenants/:id/plan')
  updateTenantPlan(
    @Param('id') id: string,
    @Body('plan') plan: string,
    @Body('status') status?: string,
  ) {
    return this.superAdminService.updateTenantPlan(id, plan, status);
  }
}
