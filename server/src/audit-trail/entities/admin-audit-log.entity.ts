import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { School } from '../../entities/school.entity';
import { BaseEntity } from '../../entities/base.entity';

@Entity('gl_admin_audit_log')
export class AdminAuditLog extends BaseEntity {
  @Index()
  @Column({ name: 'school_id', type: 'uuid' })
  schoolId!: string;

  @ManyToOne(() => School, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school!: School;

  @Column()
  action!: string; // e.g., 'USER_LOGIN', 'SETTINGS_UPDATED'

  @Column({ type: 'jsonb', nullable: true })
  details?: Record<string, any>;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress?: string;

  @Column({ name: 'user_agent', nullable: true })
  userAgent?: string;
}
