import { Entity, Column } from 'typeorm';
import { TenantAwareEntity } from 'src/core/tenancy/tenant-aware.entity';
import { UserRole } from 'src/common/user-role.enum';

@Entity({ name: 'users' })
export class User extends TenantAwareEntity {
  @Column({ unique: true })
  username: string;

  @Column({ select: false })
  password_hash: string;

  @Column({ nullable: true })
  password_reset_token: string;

  @Column({ nullable: true })
  password_reset_expires: Date;

  @Column({
    type: 'simple-enum',
    enum: UserRole,
    default: UserRole.PARENT,
  })
  role: UserRole;
}
