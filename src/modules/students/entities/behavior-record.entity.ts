import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TenantAwareEntity } from 'src/core/tenancy/tenant-aware.entity';
import { Student } from '../../students/entities/student.entity';

@Entity({ name: 'behavior_records' })
export class BehaviorRecord extends TenantAwareEntity {
  @Column()
  studentId: string;

  @ManyToOne(() => Student)
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column()
  type: 'MERIT' | 'DEMERIT';

  @Column()
  points: number;

  @Column()
  description: string;

  @Column()
  date: Date;

  @Column({ nullable: true })
  reportedBy: string; // Staff name or ID
}
