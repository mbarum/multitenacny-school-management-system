import { Entity, Column, ManyToOne } from 'typeorm';
import { TenantAwareEntity } from 'src/core/tenancy/tenant-aware.entity';
import { ClassLevel } from 'src/modules/academics/entities/class-level.entity';
import { Section } from 'src/modules/academics/entities/section.entity';
import { AcademicYear } from 'src/modules/academics/entities/academic-year.entity';

@Entity({ name: 'students' })
export class Student extends TenantAwareEntity {
  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  registrationNumber: string;

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
}
