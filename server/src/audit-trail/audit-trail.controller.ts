import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuditTrailService } from './audit-trail.service';
import { SchoolId } from '../common/decorators/school-id.decorator';

@Controller('audit-trail')
@UseGuards(JwtAuthGuard)
export class AuditTrailController {
  constructor(private readonly auditTrailService: AuditTrailService) {}

  @Get('financial/verify')
  verifyFinancialAuditTrail(@SchoolId() schoolId: string) {
    return this.auditTrailService.verifyFinancialAuditTrail(schoolId);
  }
}
