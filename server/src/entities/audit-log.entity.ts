
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';
import { School } from './school.entity';

@Entity()
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  schoolId!: string;

  @ManyToOne(() => School, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schoolId' })
  school!: School;

  @Column({ nullable: true })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column()
  action!: string; // e.g., 'POST /students'

  @Column()
  resource!: string; // e.g., 'Student'

  @Column({ nullable: true })
  details!: string; // Short description or ID of affected item

  @Column()
  ipAddress!: string;

  @CreateDateColumn()
  timestamp!: Date;
}
