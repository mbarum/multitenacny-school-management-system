
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { SchoolClass } from './school-class.entity';

export const DayOfWeek = {
  Monday: 'Monday',
  Tuesday: 'Tuesday',
  Wednesday: 'Wednesday',
  Thursday: 'Thursday',
  Friday: 'Friday',
} as const;
export type DayOfWeek = typeof DayOfWeek[keyof typeof DayOfWeek];

@Entity()
export class TimetableEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  classId!: string;

  @ManyToOne(() => SchoolClass, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'classId' })
  class!: SchoolClass;

  @Column()
  subjectId!: string;

  @Column()
  teacherId!: string;

  @Column({ type: 'enum', enum: DayOfWeek })
  day!: DayOfWeek;

  @Column()
  startTime!: string; // "HH:MM"

  @Column()
  endTime!: string; // "HH:MM"
}
