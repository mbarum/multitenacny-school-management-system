import { Controller, Get, Post, Body, Param, Patch, UseGuards, Query } from '@nestjs/common';
import { AdmissionsService } from './admissions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/user-role.enum';
import { Public } from '../auth/decorators/public.decorator';

@Controller('admissions')
export class AdmissionsController {
  constructor(private readonly admissionsService: AdmissionsService) {}

  @Public()
  @Post('public/:tenantId')
  submitPublic(@Param('tenantId') tenantId: string, @Body() data: any) {
    return this.admissionsService.submitPublicApplication(tenantId, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('applications')
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.admissionsService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('enrol/:id')
  @Roles(UserRole.ADMIN)
  enrol(@Param('id') id: string, @Body() enrollmentData: any) {
    return this.admissionsService.approveAndEnroll(id, enrollmentData);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('applications/:id/status')
  @Roles(UserRole.ADMIN)
  updateStatus(@Param('id') id: string, @Body('status') status: any) {
    return this.admissionsService.update(id, { status } as any);
  }
}
