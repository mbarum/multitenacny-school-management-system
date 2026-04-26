import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TenantAwareEntity } from 'src/core/tenancy/tenant-aware.entity';
import { Assignment } from './assignment.entity';
import { Student } from '../../students/entities/student.entity';

@Entity({ name: 'submissions' })
export class Submission extends TenantAwareEntity {
  @Column()
  assignmentId: string;

  @ManyToOne(() => Assignment)
  @JoinColumn({ name: 'assignmentId' })
  assignment: Assignment;

  @Column()
  studentId: string;

  @ManyToOne(() => Student)
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column({ type: 'text', nullable: true })
  content: string; // or file URL

  @Column({ nullable: true })
  fileUrl: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  grade: number;

  @Column({ type: 'text', nullable: true })
  feedback: string;

  @Column({ default: 'submitted' })
  status: 'submitted' | 'graded' | 'late';
}
