import { Entity, Column, ManyToOne } from 'typeorm';
import { TenantAwareEntity } from 'src/core/tenancy/tenant-aware.entity';
import { Student } from '../../students/entities/student.entity';

@Entity({ name: 'fees' })
export class Fee extends TenantAwareEntity {
  @ManyToOne(() => Student, { eager: true })
  student: Student;

  @Column()
  studentId: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column()
  dueDate: Date;

  @Column({ default: 'unpaid' })
  status: 'paid' | 'unpaid' | 'overdue';
}
