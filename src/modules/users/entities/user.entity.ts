import { Entity, Column } from 'typeorm';
import { TenantAwareEntity } from 'src/core/tenancy/tenant-aware.entity';
import { UserRole } from 'src/common/user-role.enum';



@Entity({ name: 'users' })
export class User extends TenantAwareEntity {
  @Column({ unique: true })
  username: string;

  @Column()
  password_hash: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.ADMIN,
  })
  role: UserRole;
}
