import { Entity, Column } from 'typeorm';
import { TenantAwareEntity } from 'src/core/tenancy/tenant-aware.entity';

@Entity('grading_scales')
export class GradingScale extends TenantAwareEntity {
  @Column({ default: 'TRADITIONAL' })
  type: 'TRADITIONAL' | 'CBE';

  @Column()
  grade: string; // e.g., "A", "B", "C" or "Exceeding Expectations"

  @Column('decimal', { precision: 5, scale: 2 })
  minMark: number;

  @Column('decimal', { precision: 5, scale: 2 })
  maxMark: number;

  @Column('decimal', { precision: 5, scale: 2 })
  gradePoint: number; // e.g., 4.0, 3.0

  @Column({ nullable: true })
  remarks: string;
}
