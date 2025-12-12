
import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { Staff } from './staff.entity';
import { PayrollEntry } from './payroll-entry.entity';
import { BaseEntity } from './base.entity';
import { ColumnNumericTransformer } from '../utils/transformers';

@Entity('payrolls')
export class Payroll extends BaseEntity {
  @Column()
  staffId!: string;
  
  @ManyToOne(() => Staff, (staff) => staff.payrolls, { onDelete: 'CASCADE' })
  staff!: Staff;

  @Column()
  month!: string; // e.g., "June 2024"

  @Column({ type: 'date' })
  payDate!: string;

  @Column('decimal', { precision: 12, scale: 2, default: 0, transformer: new ColumnNumericTransformer() })
  grossPay!: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0, transformer: new ColumnNumericTransformer() })
  totalDeductions!: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0, transformer: new ColumnNumericTransformer() })
  netPay!: number;

  @OneToMany(() => PayrollEntry, (entry) => entry.payroll, { cascade: true })
  payrollEntries!: PayrollEntry[];
}
