import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CbeService } from './cbe.service';

@UseGuards(JwtAuthGuard)
@Controller('cbe')
export class CbeController {
  constructor(private readonly cbeService: CbeService) {}

  @Get('competencies')
  getCompetencies() {
    return this.cbeService.getCompetencies();
  }

  @Get('rubrics')
  getRubrics() {
    return this.cbeService.getRubrics();
  }

  @Get('assessments/student/:id')
  getStudentAssessments(@Param('id') id: string) {
    return this.cbeService.getStudentAssessments(id);
  }
}
