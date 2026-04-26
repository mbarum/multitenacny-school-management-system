import { Entity, Column } from 'typeorm';
import { TenantAwareEntity } from 'src/core/tenancy/tenant-aware.entity';

@Entity({ name: 'announcements' })
export class Announcement extends TenantAwareEntity {
  @Column()
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column()
  category: 'URGENT' | 'GENERAL' | 'ACADEMIC' | 'EVENT';

  @Column({ nullable: true })
  targetAudience: string; // "ALL", "STAFF", "STUDENTS", "PARENTS"

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  expiresAt: Date;
}
