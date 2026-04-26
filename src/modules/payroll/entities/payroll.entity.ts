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
  basicSalary: number;

  @Column('decimal', { precision: 10, scale: 2 })
  grossSalary: number;

  @Column('decimal', { precision: 10, scale: 2 })
  netSalary: number;

  @Column({ type: 'json', nullable: true })
  details: any; // Breakdown of allowances and deductions

  @Column()
  payDate: Date;

  @Column({ default: 'unpaid' })
  status: 'paid' | 'unpaid';
}
