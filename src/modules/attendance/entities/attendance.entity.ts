import { Entity, Column } from 'typeorm';
import { TenantAwareEntity } from 'src/core/tenancy/tenant-aware.entity';

@Entity({ name: 'attendance' })
export class Attendance extends TenantAwareEntity {
  @Column()
  studentId: string;

  @Column()
  date: Date;

  @Column()
  status: 'present' | 'absent' | 'late';
}
