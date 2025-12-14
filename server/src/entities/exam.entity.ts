
import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { SchoolClass } from './school-class.entity';
import { School } from './school.entity';
import { BaseEntity } from './base.entity';

export const ExamType = {
  Traditional: 'Traditional',
  CBC: 'CBC',
} as const;
export type ExamType = typeof ExamType[keyof typeof ExamType];

@Entity('exams')
export class Exam extends BaseEntity {
  @Index()
  @Column({ name: 'school_id', type: 'uuid', nullable: true })
  schoolId!: string;

  @ManyToOne(() => School, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'school_id' })
  school!: School;

  @Column()
  name!: string;

  @Column({ type: 'date' })
  date!: string;

  @Column()
  classId!: string;
  
  @ManyToOne(() => SchoolClass, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'classId' })
  schoolClass!: SchoolClass;

  @Column({ type: 'enum', enum: ExamType })
  type!: ExamType;
}
