import { Entity, Column, Index, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { School } from '../../entities/school.entity';
import { BaseEntity } from '../../entities/base.entity';

export enum AccountType {
  Asset = 'Asset',
  Liability = 'Liability',
  Equity = 'Equity',
  Revenue = 'Revenue',
  Expense = 'Expense',
}

export enum AccountCategory {
  // Assets
  CashAndBank = 'CashAndBank',
  AccountsReceivable = 'AccountsReceivable',
  Inventory = 'Inventory',
  FixedAssets = 'FixedAssets',
  // Liabilities
  AccountsPayable = 'AccountsPayable',
  AccruedExpenses = 'AccruedExpenses',
  UnearnedRevenue = 'UnearnedRevenue',
  // Equity
  RetainedEarnings = 'RetainedEarnings',
  // Revenue
  TuitionFees = 'TuitionFees',
  OtherIncome = 'OtherIncome',
  // Expenses
  Salaries = 'Salaries',
  Utilities = 'Utilities',
  Rent = 'Rent',
}

@Entity('gl_accounts')
export class Account extends BaseEntity {
  @Index()
  @Column({ name: 'school_id', type: 'uuid' })
  schoolId!: string;

  @ManyToOne(() => School, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school!: School;

  @Column({ unique: true, length: 10 })
  accountCode!: string;

  @Column()
  name!: string;

  @Column({ type: 'enum', enum: AccountType })
  type!: AccountType;

  @Column({ type: 'enum', enum: AccountCategory })
  category!: AccountCategory;

  @Column({ default: false })
  isControlAccount!: boolean; // e.g., Accounts Receivable, cannot be posted to directly

  @Column({ nullable: true })
  description?: string;
}
