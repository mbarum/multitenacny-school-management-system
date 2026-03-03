import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Student } from './entities/student.entity';
import { TenancyService } from 'src/core/tenancy/tenancy.service';

@Injectable()
export class PromotionService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    private readonly tenancyService: TenancyService,
  ) {}

  async promoteStudents(
    studentIds: string[],
    nextClassLevelId: string,
    nextSectionId: string,
    nextAcademicYearId: string,
  ): Promise<void> {
    const tenantId = this.tenancyService.getTenantId();
    
    const students = await this.studentRepository.find({
      where: {
        id: In(studentIds),
        tenantId,
      },
    });

    if (students.length === 0) {
      throw new NotFoundException('No students found for promotion');
    }

    const updatedStudents = students.map((student) => {
      return {
        ...student,
        classLevelId: nextClassLevelId,
        sectionId: nextSectionId,
        academicYearId: nextAcademicYearId,
      };
    });

    await this.studentRepository.save(updatedStudents);
  }

  async graduateStudents(studentIds: string[]): Promise<void> {
    const tenantId = this.tenancyService.getTenantId();
    await this.studentRepository.update(
      { id: In(studentIds), tenantId },
      { status: 'Graduated' },
    );
  }
}
