import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from 'src/common/user-role.enum';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PromotionService } from './promotion.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('students/promotion')
export class PromotionController {
  constructor(private readonly promotionService: PromotionService) {}

  @Post('promote')
  @Roles(UserRole.ADMIN)
  promote(@Body() data: {
    studentIds: string[],
    nextClassLevelId: string,
    nextSectionId: string,
    nextAcademicYearId: string
  }) {
    return this.promotionService.promoteStudents(
      data.studentIds,
      data.nextClassLevelId,
      data.nextSectionId,
      data.nextAcademicYearId
    );
  }

  @Post('graduate')
  @Roles(UserRole.ADMIN)
  graduate(@Body() data: { studentIds: string[] }) {
    return this.promotionService.graduateStudents(data.studentIds);
  }
}
