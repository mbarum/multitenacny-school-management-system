import { Entity, Column } from 'typeorm';
import { TenantAwareEntity } from 'src/core/tenancy/tenant-aware.entity';

@Entity({ name: 'subjects' })
export class Subject extends TenantAwareEntity {
  @Column()
  name: string;

  @Column()
  classLevel: string;

  @Column({ nullable: true })
  teacherId: string;
}
