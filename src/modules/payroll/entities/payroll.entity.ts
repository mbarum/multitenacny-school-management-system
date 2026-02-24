import { Entity, Column } from 'typeorm';
import { TenantAwareEntity } from 'src/core/tenancy/tenant-aware.entity';

@Entity({ name: 'payrolls' })
export class Payroll extends TenantAwareEntity {
  @Column()
  staffId: string;

  @Column('decimal', { precision: 10, scale: 2 })
  salary: number;

  @Column()
  payDate: Date;

  @Column({ default: 'unpaid' })
  status: 'paid' | 'unpaid';
}
