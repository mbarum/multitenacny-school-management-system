import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Staff } from './staff.entity';
import { PayrollEntry } from './payroll-entry.entity';

@Entity()
export class Payroll {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  staffId!: string;
  
  @ManyToOne(() => Staff, (staff) => staff.payrolls, { onDelete: 'CASCADE' })
  staff!: Staff;

  @Column()
  month!: string; // e.g., "June 2024"

  @Column({ type: 'date' })
  payDate!: string;

  @Column('float')
  grossPay!: number;

  @Column('float')
  totalDeductions!: number;

  @Column('float')
  netPay!: number;

  @OneToMany(() => PayrollEntry, (entry) => entry.payroll, { cascade: true })
  payrollEntries!: PayrollEntry[];
}