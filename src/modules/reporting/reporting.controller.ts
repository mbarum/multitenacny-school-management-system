import { Controller, Get, Query, UseGuards, Res } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { ReportingService } from './reporting.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
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
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
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
}
