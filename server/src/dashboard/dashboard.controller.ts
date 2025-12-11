
import { Controller, Get, Request, UseInterceptors } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @UseInterceptors(CacheInterceptor) // Cache this endpoint
  @CacheTTL(60000) // Cache for 60 seconds
  getStats(@Request() req: any) {
    return this.dashboardService.getDashboardStats(req.user.schoolId);
  }
}
