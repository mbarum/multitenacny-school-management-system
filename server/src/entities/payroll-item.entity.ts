
import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { School } from './school.entity';
import { BaseEntity } from './base.entity';

export const PayrollItemType = {
  Earning: 'Earning',
  Deduction: 'Deduction',
} as const;
export type PayrollItemType = typeof PayrollItemType[keyof typeof PayrollItemType];


export const PayrollItemCategory = {
  Allowance: 'Allowance',
  Bonus: 'Bonus',
  Statutory: 'Statutory',
  Loan: 'Loan',
  Advance: 'Advance',
  Other: 'Other',
} as const;
export type PayrollItemCategory = typeof PayrollItemCategory[keyof typeof PayrollItemCategory];

export const CalculationType = {
  Fixed: 'Fixed',
  Percentage: 'Percentage',
} as const;
export type CalculationType = typeof CalculationType[keyof typeof CalculationType];

@Entity('payroll_items')
export class PayrollItem extends BaseEntity {
  @Index()
  @Column({ name: 'school_id', type: 'uuid', nullable: true })
  schoolId!: string;

  @ManyToOne(() => School, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'school_id' })
  school!: School;

  @Column()
  name!: string;

  @Column({ type: 'enum', enum: PayrollItemType })
  type!: PayrollItemType;

  @Column({ type: 'enum', enum: PayrollItemCategory })
  category!: PayrollItemCategory;

  @Column({ type: 'enum', enum: CalculationType })
  calculationType!: CalculationType;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  value!: number;

  @Column({ default: false })
  isRecurring!: boolean;
}
