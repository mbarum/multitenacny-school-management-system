import { Entity, Column } from 'typeorm';
import { TenantAwareEntity } from 'src/core/tenancy/tenant-aware.entity';

@Entity({ name: 'students' })
export class Student extends TenantAwareEntity {
  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  classLevel: string;
}
