import { Entity, Column } from 'typeorm';
import { TenantAwareEntity } from 'src/core/tenancy/tenant-aware.entity';

@Entity('permissions')
export class Permission extends TenantAwareEntity {
  @Column()
  name: string; // e.g., "users.create", "academics.manage"

  @Column({ nullable: true })
  description: string;
}
