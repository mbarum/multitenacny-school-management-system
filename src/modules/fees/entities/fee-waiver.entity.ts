import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TenantAwareEntity } from 'src/core/tenancy/tenant-aware.entity';
import { Student } from '../../students/entities/student.entity';

@Entity({ name: 'fee_waivers' })
export class FeeWaiver extends TenantAwareEntity {
  @Column()
  studentId: string;

  @ManyToOne(() => Student)
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column()
  name: string; // e.g. "Merit Scholarship", "Bursary"

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  remarks: string;
}
