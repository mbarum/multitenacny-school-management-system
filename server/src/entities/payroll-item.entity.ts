import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

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

@Entity()
export class PayrollItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  name!: string;

  @Column({ type: 'enum', enum: PayrollItemType })
  type!: PayrollItemType;

  @Column({ type: 'enum', enum: PayrollItemCategory })
  category!: PayrollItemCategory;

  @Column({ type: 'enum', enum: CalculationType })
  calculationType!: CalculationType;

  @Column('float')
  value!: number;

  @Column({ default: false })
  isRecurring!: boolean;
}
