import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Student } from './student.entity';
import { User } from './user.entity';

export const CommunicationType = {
  SMS: 'SMS',
  Email: 'Email',
  PortalMessage: 'PortalMessage',
} as const;
export type CommunicationType = typeof CommunicationType[keyof typeof CommunicationType];

@Entity()
export class CommunicationLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  studentId!: string;
  
  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  student!: Student;

  @Column({ type: 'enum', enum: CommunicationType })
  type!: CommunicationType;

  @Column('text')
  message!: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  date!: Date;

  @Column()
  sentById!: string;
  
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sentById' })
  sentBy!: User;
}
