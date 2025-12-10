
import { Controller, Get, UseGuards, Request, UseInterceptors } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';

@UseGuards(JwtAuthGuard)
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
