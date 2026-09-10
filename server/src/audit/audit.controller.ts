
import { Controller, Get, Request, Query } from '@nestjs/common';
import { AuditService } from './audit.service';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../entities/user.entity';

@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(Role.Admin, Role.Auditor)
  findAll(@Request() req: any, @Query('limit') limit: number) {
    return this.auditService.findAll(req.user.schoolId, limit);
  }
}
