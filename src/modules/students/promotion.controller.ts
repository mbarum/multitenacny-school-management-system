import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PromotionService } from './promotion.service';

@UseGuards(JwtAuthGuard)
@Controller('students/promotion')
export class PromotionController {
  constructor(private readonly promotionService: PromotionService) {}

  @Post('promote')
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
  graduate(@Body() data: { studentIds: string[] }) {
    return this.promotionService.graduateStudents(data.studentIds);
  }
}
