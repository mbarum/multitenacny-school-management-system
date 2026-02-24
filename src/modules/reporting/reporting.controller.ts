import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReportingService } from './reporting.service';

@UseGuards(JwtAuthGuard)
@Controller('reporting')
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  @Get('financials')
  getFinancialReport(@Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    return this.reportingService.generateFinancialReport(new Date(startDate), new Date(endDate));
  }

  @Get('attendance')
  getAttendanceReport(@Query('classLevel') classLevel: string) {
    return this.reportingService.generateAttendanceReport(classLevel);
  }
}
