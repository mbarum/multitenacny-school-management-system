import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Payroll } from './payroll.entity';
import { PayrollItemType } from './payroll-item.entity';

@Entity()
export class PayrollEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  payrollId!: string;
  
  @ManyToOne(() => Payroll, (payroll) => payroll.payrollEntries, { onDelete: 'CASCADE' })
  payroll!: Payroll;

  @Column()
  name!: string;

  @Column('float')
  amount!: number;

  @Column({ type: 'enum', enum: PayrollItemType })
  type!: PayrollItemType;
}