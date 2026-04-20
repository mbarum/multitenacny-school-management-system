import { Entity, Column, ManyToOne } from 'typeorm';
import { TenantAwareEntity } from 'src/core/tenancy/tenant-aware.entity';
import { Student } from 'src/modules/students/entities/student.entity';
import { CbeCompetency } from './cbe-competency.entity';
import { CbeRubric } from './cbe-rubric.entity';
import { AcademicYear } from 'src/modules/academics/entities/academic-year.entity';

@Entity({ name: 'cbe_assessments' })
export class CbeAssessment extends TenantAwareEntity {
  @ManyToOne(() => Student)
  student: Student;

  @Column()
  studentId: string;

  @ManyToOne(() => CbeCompetency)
  competency: CbeCompetency;

  @Column()
  competencyId: string;

  @ManyToOne(() => CbeRubric)
  rubric: CbeRubric;

  @Column()
  rubricId: string;

  @ManyToOne(() => AcademicYear)
  academicYear: AcademicYear;

  @Column()
  academicYearId: string;

  @Column({ type: 'text', nullable: true })
  evaluatorNotes: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  assessmentDate: Date;
}
