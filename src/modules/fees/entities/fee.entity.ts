import { Entity, Column } from 'typeorm';
import { TenantAwareEntity } from 'src/core/tenancy/tenant-aware.entity';

@Entity({ name: 'fees' })
export class Fee extends TenantAwareEntity {
  @Column()
  studentId: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column()
  dueDate: Date;

  @Column({ default: 'unpaid' })
  status: 'paid' | 'unpaid' | 'overdue';
}
