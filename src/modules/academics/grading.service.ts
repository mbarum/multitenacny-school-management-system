import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GradingScale } from './entities/grading-scale.entity';
import { TenancyService } from 'src/core/tenancy/tenancy.service';
import { TenantAwareCrudService } from 'src/core/common/tenant-aware-crud.service';

@Injectable()
export class GradingService extends TenantAwareCrudService<GradingScale> {
  constructor(
    @InjectRepository(GradingScale)
    private readonly gradingScaleRepository: Repository<GradingScale>,
    tenancyService: TenancyService,
  ) {
    super(gradingScaleRepository, tenancyService);
  }

  async calculateGrade(marks: number): Promise<GradingScale | null> {
    const tenantId = this.tenancyService.getTenantId();
    return this.gradingScaleRepository.findOne({
      where: [
        {
          tenantId,
          minMark: marks, // Edge case for exact marks
        },
      ],
      // TypeORM doesn't support between directly in where object easily for this
      // We can use QueryBuilder for more precision if needed
    });
  }

  // Better implementation with QueryBuilder
  async getGradeForMark(marks: number): Promise<GradingScale | null> {
    const tenantId = this.tenancyService.getTenantId();
    return this.gradingScaleRepository
      .createQueryBuilder('scale')
      .where('scale.tenantId = :tenantId', { tenantId })
      .andWhere('scale.minMark <= :marks', { marks })
      .andWhere('scale.maxMark >= :marks', { marks })
      .getOne();
  }

  async calculateGPA(studentMarks: { subjectId: string, marks: number }[]): Promise<number> {
    let totalGradePoints = 0;
    let totalSubjects = 0;

    for (const entry of studentMarks) {
      const scale = await this.getGradeForMark(entry.marks);
      if (scale) {
        totalGradePoints += Number(scale.gradePoint);
        totalSubjects++;
      }
    }

    return totalSubjects > 0 ? totalGradePoints / totalSubjects : 0;
  }
}
