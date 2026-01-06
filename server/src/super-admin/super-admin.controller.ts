import { Controller, Get, Body, Patch, Param, Post, Put, Request } from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../entities/user.entity';
import { SubscriptionStatus, SubscriptionPlan } from '../entities/subscription.entity';
import { PlatformSetting } from '../entities/platform-setting.entity';

@Controller('super-admin')
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get('schools')
  @Roles(Role.SuperAdmin)
  findAllSchools() {
    return this.superAdminService.findAllSchools();
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
  
  @Put('pricing')
  @Roles(Role.SuperAdmin)
  updatePricing(@Body() settings: Partial<PlatformSetting>) {
      return this.superAdminService.updatePricing(settings);
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

  @Post('payments/manual')
  @Roles(Role.SuperAdmin)
  recordManualPayment(@Body() body: { schoolId: string, amount: number, transactionCode: string, date: string, method: string }) {
      return this.superAdminService.recordManualPayment(body.schoolId, body);
  }

  @Post('payments/initiate')
  @Roles(Role.Admin, Role.Accountant)
  initiatePayment(@Request() req: any, @Body() data: any) {
      return this.superAdminService.initiatePayment(req.user.schoolId, data);
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
}