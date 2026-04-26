import { Entity, Column } from 'typeorm';
import { TenantAwareEntity } from 'src/core/tenancy/tenant-aware.entity';

@Entity('payroll_item_definitions')
export class PayrollItemDefinition extends TenantAwareEntity {
  @Column()
  name: string;

  @Column({ type: 'enum', enum: ['ALLOWANCE', 'DEDUCTION'] })
  type: 'ALLOWANCE' | 'DEDUCTION';

  @Column({ type: 'enum', enum: ['FIXED', 'PERCENTAGE'] })
  computationType: 'FIXED' | 'PERCENTAGE';

  @Column('decimal', { precision: 10, scale: 2 })
  value: number; // Fixed amount or Percentage (e.g. 10 for 10%)

  @Column({ default: true })
  isActive: boolean;
}
