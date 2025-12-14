
import { Entity, Column, ManyToOne, Unique, JoinColumn, Index } from 'typeorm';
import { Student } from './student.entity';
import { Exam } from './exam.entity';
import { Subject } from './subject.entity';
import { School } from './school.entity';
import { BaseEntity } from './base.entity';

export const CbetScore = {
  EE: 'Exceeding Expectations (EE)',
  ME: 'Meeting Expectations (ME)',
  AE: 'Approaching Expectations (AE)',
  BE: 'Below Expectations (BE)'
} as const;
export type CbetScore = typeof CbetScore[keyof typeof CbetScore];

@Entity('grades')
@Unique(['studentId', 'examId', 'subjectId'])
export class Grade extends BaseEntity {
  @Index()
  @Column({ name: 'school_id', type: 'uuid', nullable: true })
  schoolId!: string;

  @ManyToOne(() => School, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'school_id' })
  school!: School;

  @Column()
  studentId!: string;

  @Column()
  examId!: string;

  @Column()
  subjectId!: string;
  
  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student!: Student;
  
  @ManyToOne(() => Exam, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'examId' })
  exam!: Exam;
  
  @ManyToOne(() => Subject, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subjectId' })
  subject!: Subject;
  
  @Column('float', { nullable: true })
  score!: number | null;

  @Column({ type: 'enum', enum: CbetScore, nullable: true })
  cbetScore!: CbetScore | null;

  @Column('text', { nullable: true })
  comments!: string | null;
}
