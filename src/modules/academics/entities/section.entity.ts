import { Entity, Column, ManyToOne } from 'typeorm';
import { TenantAwareEntity } from 'src/core/tenancy/tenant-aware.entity';
import { ClassLevel } from './class-level.entity';
import { Staff } from 'src/modules/staff/entities/staff.entity';
import { AcademicYear } from './academic-year.entity';

@Entity('sections')
export class Section extends TenantAwareEntity {
  @Column()
  name: string; // e.g., "A", "B", "Blue", "Green"

  @ManyToOne(() => ClassLevel, (classLevel) => classLevel.sections)
  classLevel: ClassLevel;

  @Column()
  classLevelId: string;

  @Column({ nullable: true })
  room: string;

  @ManyToOne(() => Staff, { nullable: true })
  classTeacher: Staff;

  @Column({ nullable: true })
  classTeacherId: string;

  @ManyToOne(() => AcademicYear, { nullable: true })
  academicYear: AcademicYear;

  @Column({ nullable: true })
  academicYearId: string;
}
