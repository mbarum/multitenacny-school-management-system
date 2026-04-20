import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CbeCompetency } from './entities/cbe-competency.entity';
import { CbeRubric } from './entities/cbe-rubric.entity';
import { CbeAssessment } from './entities/cbe-assessment.entity';
import { TenancyService } from 'src/core/tenancy/tenancy.service';

@Injectable()
export class CbeService {
  constructor(
    @InjectRepository(CbeCompetency)
    private readonly competencyRepository: Repository<CbeCompetency>,
    @InjectRepository(CbeRubric)
    private readonly rubricRepository: Repository<CbeRubric>,
    @InjectRepository(CbeAssessment)
    private readonly assessmentRepository: Repository<CbeAssessment>,
    private readonly tenancyService: TenancyService,
  ) {}

  async getCompetencies(): Promise<CbeCompetency[]> {
    return this.competencyRepository.find({
      where: { tenantId: this.tenancyService.getTenantId() },
      relations: ['subject'],
    });
  }

  async getRubrics(): Promise<CbeRubric[]> {
    return this.rubricRepository.find({
      where: { tenantId: this.tenancyService.getTenantId() },
      order: { level: 'DESC' },
    });
  }

  async getStudentAssessments(studentId: string): Promise<CbeAssessment[]> {
    return this.assessmentRepository.find({
      where: { 
        tenantId: this.tenancyService.getTenantId(),
        studentId
      },
      relations: ['competency', 'rubric', 'academicYear'],
      order: { assessmentDate: 'DESC' },
    });
  }
}
