
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Student } from './student.entity';
import { User } from './user.entity';
import { BaseEntity } from './base.entity';

export const CommunicationType = {
  SMS: 'SMS',
  Email: 'Email',
  PortalMessage: 'PortalMessage',
} as const;
export type CommunicationType = typeof CommunicationType[keyof typeof CommunicationType];

@Entity('communication_logs')
export class CommunicationLog extends BaseEntity {
  @Column()
  studentId!: string;
  
  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  student!: Student;

  @Column({ type: 'enum', enum: CommunicationType })
  type!: CommunicationType;

  @Column('text')
  message!: string;

  // We keep 'date' as a specific business date, but BaseEntity adds createdAt which tracks insertion time
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  date!: Date;

  @Column()
  sentById!: string;
  
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sentById' })
  sentBy!: User;
}
