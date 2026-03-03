import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column()
  userId: string;

  @Column()
  action: string; // e.g., "CREATE", "UPDATE", "DELETE"

  @Column()
  entity: string; // e.g., "Student", "Fee"

  @Column({ nullable: true })
  entityId: string;

  @Column({ type: 'text', nullable: true })
  oldValue: string; // JSON string

  @Column({ type: 'text', nullable: true })
  newValue: string; // JSON string

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @CreateDateColumn()
  createdAt: Date;
}
