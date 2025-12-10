
import { Controller, Get, Body, Patch, Param, UseGuards, Post } from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../entities/user.entity';
import { SubscriptionStatus, SubscriptionPlan } from '../entities/subscription.entity';

@UseGuards(JwtAuthGuard)
@Controller('super-admin')
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get('schools')
  @Roles(Role.SuperAdmin)
  findAllSchools() {
    return this.superAdminService.findAllSchools();
  }

  @Get('stats')
  @Roles(Role.SuperAdmin)
  getPlatformStats() {
    return this.superAdminService.getPlatformStats();
  }

  @Patch('schools/:schoolId/subscription')
  @Roles(Role.SuperAdmin)
  updateSubscription(
    @Param('schoolId') schoolId: string,
    @Body() updateDto: { status: SubscriptionStatus; plan: SubscriptionPlan; endDate?: string }
  ) {
    return this.superAdminService.updateSubscription(schoolId, updateDto);
  }
}
