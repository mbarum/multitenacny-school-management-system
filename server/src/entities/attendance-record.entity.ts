import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Unique } from 'typeorm';
import { Student } from './student.entity';
import { SchoolClass } from './school-class.entity';

export const AttendanceStatus = {
  Present: 'Present',
  Absent: 'Absent',
  Late: 'Late',
  Excused: 'Excused',
} as const;
export type AttendanceStatus = typeof AttendanceStatus[keyof typeof AttendanceStatus];

@Entity()
@Unique(['studentId', 'date'])
export class AttendanceRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  studentId!: string;

  @Column()
  classId!: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  student!: Student;
  
  @ManyToOne(() => SchoolClass, { onDelete: 'CASCADE' })
  schoolClass!: SchoolClass;
  
  @Column({ type: 'date' })
  date!: string;

  @Column({ type: 'enum', enum: AttendanceStatus })
  status!: AttendanceStatus;

  @Column({ nullable: true })
  remarks?: string;
}
