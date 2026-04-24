import { Entity, Column, ManyToOne } from 'typeorm';
import { TenantAwareEntity } from 'src/core/tenancy/tenant-aware.entity';
import { Staff } from '../../staff/entities/staff.entity';

@Entity({ name: 'payrolls' })
export class Payroll extends TenantAwareEntity {
  @ManyToOne(() => Staff, { eager: true })
  staff: Staff;

  @Column()
  staffId: string;

  @Column('decimal', { precision: 10, scale: 2 })
  salary: number;

  @Column()
  payDate: Date;

  @Column({ default: 'unpaid' })
  status: 'paid' | 'unpaid';
}
