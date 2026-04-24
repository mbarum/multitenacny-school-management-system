import { Entity, Column } from 'typeorm';
import { TenantAwareEntity } from 'src/core/tenancy/tenant-aware.entity';

@Entity({ name: 'staff' })
export class Staff extends TenantAwareEntity {
  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  role: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ nullable: true })
  employeeId: string;

  @Column({ nullable: true })
  photoUrl: string;

  @Column({ nullable: true })
  phone: string;
}
