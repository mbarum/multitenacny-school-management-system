
import { Entity, Column, ManyToOne, Unique } from 'typeorm';
import { Student } from './student.entity';
import { Exam } from './exam.entity';
import { Subject } from './subject.entity';
import { BaseEntity } from './base.entity';

export const CbetScore = {
  Exceeds: 'Exceeds',
  Meets: 'Meets',
  Approaching: 'Approaching',
  Below: 'Below',
  Exceeds_Expectation: 'Exceeds Expectation',
  Meets_Expectation: 'Meets Expectation',
  Approaching_Expectation: 'Approaching Expectation',
  Below_Expectation: 'Below Expectation'
} as const;
export type CbetScore = typeof CbetScore[keyof typeof CbetScore];

@Entity('grades')
@Unique(['studentId', 'examId', 'subjectId'])
export class Grade extends BaseEntity {
  @Column()
  studentId!: string;

  @Column()
  examId!: string;

  @Column()
  subjectId!: string;
  
  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  student!: Student;
  
  @ManyToOne(() => Exam, { onDelete: 'CASCADE' })
  exam!: Exam;
  
  @ManyToOne(() => Subject, { onDelete: 'CASCADE' })
  subject!: Subject;
  
  @Column('float', { nullable: true })
  score!: number | null;

  @Column({ type: 'enum', enum: CbetScore, nullable: true })
  cbetScore!: CbetScore | null;

  @Column('text', { nullable: true })
  comments!: string | null;
}
