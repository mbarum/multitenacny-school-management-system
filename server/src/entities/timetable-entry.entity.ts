import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

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
