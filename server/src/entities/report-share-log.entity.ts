import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Student } from './student.entity';
import { User } from './user.entity';

@Entity()
export class ReportShareLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  studentId!: string;
  
  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  student!: Student;

  @Column()
  examId!: string;
  
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  sharedDate!: Date;
  
  @Column()
  sharedById!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sharedById' })
  sharedBy!: User;
}
