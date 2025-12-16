
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';
import { School } from './school.entity';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'school_id', type: 'uuid', nullable: true })
  schoolId!: string;

  @ManyToOne(() => School, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'school_id' })
  school!: School;

  @Column({ nullable: true })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column()
  action!: string; // e.g., 'POST /students' or 'UPDATE Student'

  @Column()
  resource!: string; // e.g., 'Student'

  @Column({ nullable: true })
  entityId!: string; // The ID of the specific record changed

  @Column({ type: 'json', nullable: true })
  previousState!: any;

  @Column({ type: 'json', nullable: true })
  newState!: any;

  @Column({ nullable: true })
  details!: string;

  @Column({ nullable: true })
  ipAddress!: string;

  @CreateDateColumn()
  timestamp!: Date;
}
