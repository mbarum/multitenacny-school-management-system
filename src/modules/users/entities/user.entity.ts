import { Entity, Column } from 'typeorm';
import { TenantAwareEntity } from 'src/core/tenancy/tenant-aware.entity';

export enum UserRole { 
  ADMIN = 'admin',
  TEACHER = 'teacher',
  ACCOUNTANT = 'accountant',
  PARENT = 'parent',
}

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
