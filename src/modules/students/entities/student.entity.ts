import { Entity, Column, ManyToOne, Unique } from 'typeorm';
import { TenantAwareEntity } from 'src/core/tenancy/tenant-aware.entity';
import { ClassLevel } from 'src/modules/academics/entities/class-level.entity';
import { Section } from 'src/modules/academics/entities/section.entity';
import { AcademicYear } from 'src/modules/academics/entities/academic-year.entity';

@Entity({ name: 'students' })
@Unique('UQ_TENANT_REG_NUMBER', ['tenantId', 'registrationNumber'])
export class Student extends TenantAwareEntity {
  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  middleName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  registrationNumber: string;

  @Column({ type: 'text', nullable: true })
  photoUrl: string;

  @Column({ nullable: true })
  gender: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({ nullable: true })
  residence: string;

  @Column({ nullable: true })
  transportRoute: string;

  @ManyToOne(() => ClassLevel)
  classLevel: ClassLevel;

  @Column({ nullable: true })
  classLevelId: string;

  @ManyToOne(() => Section)
  section: Section;

  @Column({ nullable: true })
  sectionId: string;

  @ManyToOne(() => AcademicYear)
  academicYear: AcademicYear;

  @Column({ nullable: true })
  academicYearId: string;

  @Column({ default: 'Active' })
  status: string; // Active, Graduated, Transferred, Suspended

  @Column({ nullable: true })
  parentId: string;

  @Column({ nullable: true })
  parentFirstName: string;

  @Column({ nullable: true })
  parentLastName: string;

  @Column({ nullable: true })
  parentEmail: string;

  @Column({ nullable: true })
  parentPhone: string;
}
