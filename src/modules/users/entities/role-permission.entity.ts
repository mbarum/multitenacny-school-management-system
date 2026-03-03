import { Entity, Column, ManyToOne } from 'typeorm';
import { TenantAwareEntity } from 'src/core/tenancy/tenant-aware.entity';
import { Permission } from './permission.entity';
import { UserRole } from 'src/common/user-role.enum';

@Entity('role_permissions')
export class RolePermission extends TenantAwareEntity {
  @Column({
    type: 'simple-enum',
    enum: UserRole,
  })
  role: UserRole;

  @ManyToOne(() => Permission)
  permission: Permission;

  @Column()
  permissionId: string;
}
