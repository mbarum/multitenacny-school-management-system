
import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../entities/user.entity';

@UseGuards(JwtAuthGuard)
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(Role.Admin, Role.Auditor)
  findAll(@Request() req: any, @Query('limit') limit: number) {
    return this.auditService.findAll(req.user.schoolId, limit);
  }
}
