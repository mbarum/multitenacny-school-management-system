import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { SchoolClass } from './school-class.entity';

export const ExamType = {
  Traditional: 'Traditional',
  CBC: 'CBC',
} as const;
export type ExamType = typeof ExamType[keyof typeof ExamType];

@Entity()
export class Exam {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ type: 'date' })
  date!: string;

  @Column()
  classId!: string;
  
  @ManyToOne(() => SchoolClass, { onDelete: 'CASCADE' })
  schoolClass!: SchoolClass;

  @Column({ type: 'enum', enum: ExamType })
  type!: ExamType;
}
