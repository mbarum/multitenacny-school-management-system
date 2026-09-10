
import { Entity, Column, ManyToOne } from 'typeorm';
import { Payroll } from './payroll.entity';
import { PayrollItemType } from './payroll-item.entity';
import { BaseEntity } from './base.entity';
import { ColumnNumericTransformer } from '../utils/transformers';

@Entity('payroll_entries')
export class PayrollEntry extends BaseEntity {
  @Column()
  payrollId!: string;
  
  @ManyToOne(() => Payroll, (payroll) => payroll.payrollEntries, { onDelete: 'CASCADE' })
  payroll!: Payroll;

  @Column()
  name!: string;

  @Column('decimal', { precision: 12, scale: 2, default: 0, transformer: new ColumnNumericTransformer() })
  amount!: number;

  @Column({ type: 'enum', enum: PayrollItemType })
  type!: PayrollItemType;
}
