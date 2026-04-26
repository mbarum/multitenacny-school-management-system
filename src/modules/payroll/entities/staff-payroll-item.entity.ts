import { Entity, Column, ManyToOne } from 'typeorm';
import { TenantAwareEntity } from 'src/core/tenancy/tenant-aware.entity';
import { Staff } from '../../staff/entities/staff.entity';
import { PayrollItemDefinition } from './payroll-item-definition.entity';

@Entity('staff_payroll_items')
export class StaffPayrollItem extends TenantAwareEntity {
  @ManyToOne(() => Staff)
  staff: Staff;

  @Column()
  staffId: string;

  @ManyToOne(() => PayrollItemDefinition)
  itemDefinition: PayrollItemDefinition;

  @Column()
  itemDefinitionId: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  customValue: number; // If set, overrides the default value in definition
}
