import { Controller, Get, Query, UseGuards, Res, Req } from '@nestjs/common';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/user-role.enum';
import { ReportingService } from './reporting.service';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    username: string;
    role: string;
    tenantId: string;
  };
}

@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('reporting')
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  @Get('financials')
  @Permissions('reporting.financials')
  getFinancialReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportingService.generateFinancialReport(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('financials/excel')
  @Permissions('reporting.financials.export')
  async exportFinancials(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() res: Response,
  ) {
    const buffer = await this.reportingService.exportFinancialsToExcel(
      new Date(startDate),
      new Date(endDate),
    );
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="financial-report.xlsx"',
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('attendance')
  @Permissions('reporting.attendance')
  getAttendanceReport(@Query('classLevelId') classLevelId: string) {
    return this.reportingService.generateAttendanceReport(classLevelId);
  }

  @Get('dashboard-stats')
  getDashboardStats() {
    return this.reportingService.getDashboardStats();
  }

  @Get('teacher-dashboard-stats')
  @Roles(UserRole.TEACHER)
  getTeacherDashboardStats(@Req() req: AuthenticatedRequest) {
    return this.reportingService.getTeacherDashboardStats(req.user.userId);
  }

  @Get('parent-dashboard-stats')
  @Roles(UserRole.PARENT)
  getParentDashboardStats(@Req() req: AuthenticatedRequest) {
    return this.reportingService.getParentDashboardStats(req.user.userId);
  }
}
