
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Student } from './student.entity';
import { User } from './user.entity';
import { BaseEntity } from './base.entity';

@Entity('report_share_logs')
export class ReportShareLog extends BaseEntity {
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
