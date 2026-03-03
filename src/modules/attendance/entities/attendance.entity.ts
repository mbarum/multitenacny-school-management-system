import { Entity, Column, ManyToOne } from 'typeorm';
import { TenantAwareEntity } from 'src/core/tenancy/tenant-aware.entity';
import { Student } from 'src/modules/students/entities/student.entity';

@Entity({ name: 'attendance' })
export class Attendance extends TenantAwareEntity {
  @Column()
  studentId: string;

  @ManyToOne(() => Student)
  student: Student;

  @Column()
  classLevelId: string;

  @Column()
  date: Date;

  @Column()
  status: 'present' | 'absent' | 'late';
}
