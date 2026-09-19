import { Controller, Get, Body, Patch, Param, Post, Put, Request } from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../entities/user.entity';
import { SubscriptionStatus, SubscriptionPlan } from '../entities/subscription.entity';
import { PlatformSetting } from '../entities/platform-setting.entity';
import { Public } from '../auth/public.decorator';

@Controller('super-admin')
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get('schools')
  @Roles(Role.SuperAdmin)
  findAllSchools() {
    return this.superAdminService.findAllSchools();
  }

  @Post('schools')
  @Roles(Role.SuperAdmin)
  createSchool(@Body() dto: any) {
    return this.superAdminService.createSchool(dto);
  }

  @Post('schools/:id/activate')
  @Roles(Role.SuperAdmin)
  activateSchool(@Param('id') id: string, @Body() payload: any) {
    return this.superAdminService.activateSchool(id, payload);
  }

  @Get('schools/:id')
  @Roles(Role.SuperAdmin)
  findSchoolDetails(@Param('id') id: string) {
    return this.superAdminService.findSchoolDetails(id);
  }

  @Get('stats')
  @Roles(Role.SuperAdmin)
  getPlatformStats() {
    return this.superAdminService.getPlatformStats();
  }
  
  @Get('health')
  @Roles(Role.SuperAdmin)
  getSystemHealth() {
      return this.superAdminService.getSystemHealth();
  }

  @Get('online-users')
  @Roles(Role.SuperAdmin)
  getOnlineUsers() {
      return this.superAdminService.getOnlineUsers();
  }

  @Post('health/ping-db')
  @Roles(Role.SuperAdmin)
  pingDatabase() {
      return this.superAdminService.pingDatabase();
  }

  @Post('health/test-queue')
  @Roles(Role.SuperAdmin)
  testQueueWorker() {
      return this.superAdminService.testQueueWorker();
  }

  @Post('health/retry-failed-jobs')
  @Roles(Role.SuperAdmin)
  retryFailedJobs() {
      return this.superAdminService.retryFailedJobs();
  }
  
  @Get('pricing')
  @Roles(Role.SuperAdmin)
  getPricing() {
      return this.superAdminService.getPricing();
  }

  @Put('pricing')
  @Roles(Role.SuperAdmin)
  updatePricing(@Body() settings: Partial<PlatformSetting>) {
      return this.superAdminService.updatePricing(settings);
  }

  @Post('test-stk-push')
  @Roles(Role.SuperAdmin)
  testStkPush(@Body() body: { phone: string; amount: number; paybill?: string }) {
      return this.superAdminService.testStkPush(body);
  }

  @Patch('schools/:schoolId/subscription')
  @Roles(Role.SuperAdmin)
  updateSubscription(
    @Param('schoolId') schoolId: string,
    @Body() updateDto: { status: SubscriptionStatus; plan: SubscriptionPlan; endDate?: string }
  ) {
    return this.superAdminService.updateSubscription(schoolId, updateDto);
  }

  @Get('payments')
  @Roles(Role.SuperAdmin)
  getSubscriptionPayments() {
      return this.superAdminService.getSubscriptionPayments();
  }

  @Get('receipts')
  @Roles(Role.SuperAdmin)
  getSaasReceipts() {
      return this.superAdminService.getSaasReceipts();
  }

  @Get('invoices')
  @Roles(Role.SuperAdmin)
  getSaasInvoices() {
      return this.superAdminService.getSaasInvoices();
  }

  @Post('invoices')
  @Roles(Role.SuperAdmin)
  createSaasInvoice(@Body() body: any) {
      return this.superAdminService.createSaasInvoice(body);
  }

  @Patch('invoices/:id/status')
  @Roles(Role.SuperAdmin)
  updateSaasInvoiceStatus(@Param('id') id: string, @Body() body: any) {
      return this.superAdminService.updateSaasInvoiceStatus(id, body);
  }

  @Post('payments/manual')
  @Roles(Role.SuperAdmin)
  recordManualPayment(@Body() body: { schoolId: string, amount: number, transactionCode: string, date: string, method: string }) {
      return this.superAdminService.recordManualPayment(body.schoolId, body);
  }

  @Public()
  @Post('payments/stk-push')
  initiateStkPush(@Request() req: any, @Body() body: { amount: number, phone: string, accountReference: string, schoolId?: string, type?: string }) {
      const effectiveSchoolId = req.user?.schoolId || body.schoolId || null;
      return this.superAdminService.initiateStkPush(effectiveSchoolId, body);
  }

  @Post('payments/initiate')
  @Roles(Role.Admin, Role.Accountant)
  initiatePayment(@Request() req: any, @Body() data: any) {
      return this.superAdminService.initiatePayment(req.user.schoolId, data);
  }

  @Post('payments/card-checkout')
  @Roles(Role.Admin, Role.Accountant, Role.SuperAdmin)
  cardCheckoutSubscription(@Request() req: any, @Body() data: any) {
      const targetSchoolId = data.schoolId || req.user.schoolId;
      return this.superAdminService.cardCheckoutSubscription(targetSchoolId, data);
  }

  @Patch('schools/:id/email')
  @Roles(Role.SuperAdmin)
  updateEmail(@Param('id') id: string, @Body('email') email: string) {
      return this.superAdminService.updateSchoolEmail(id, email);
  }

  @Patch('schools/:id/phone')
  @Roles(Role.SuperAdmin)
  updatePhone(@Param('id') id: string, @Body('phone') phone: string) {
      return this.superAdminService.updateSchoolPhone(id, phone);
  }

  @Post('lifecycle-sweep')
  @Roles(Role.SuperAdmin)
  runLifecycleSweep() {
      return this.superAdminService.runReminderAndLifecycleSweep();
  }

  @Post('schools/:id/reminder')
  @Roles(Role.SuperAdmin)
  sendReminder(@Param('id') id: string, @Body() body: { message?: string }) {
      return this.superAdminService.sendSchoolManualReminder(id, body?.message);
  }

  @Patch('schools/:id/toggle-access')
  @Roles(Role.SuperAdmin)
  toggleSchoolAccess(@Param('id') id: string, @Body('enabled') enabled: boolean) {
      return this.superAdminService.toggleSchoolAccess(id, enabled);
  }

  @Post('schools/:id/extend')
  @Roles(Role.SuperAdmin)
  extendSubscription(@Param('id') id: string, @Body('days') days: number) {
      return this.superAdminService.extendSubscription(id, days || 30);
  }
}