import { Entity, Column } from 'typeorm';
import { TenantAwareEntity } from 'src/core/tenancy/tenant-aware.entity';

@Entity({ name: 'cbe_rubrics' })
export class CbeRubric extends TenantAwareEntity {
  @Column()
  level: number; // e.g., 4, 3, 2, 1

  @Column()
  name: string; // e.g., 'Advanced', 'Proficient', 'Developing', 'Beginning'

  @Column({ type: 'text', nullable: true })
  description: string;
}
