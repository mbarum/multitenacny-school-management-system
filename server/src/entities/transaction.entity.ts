
import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Student } from './student.entity';
import { School } from './school.entity';
import { BaseEntity } from './base.entity';
import { ColumnNumericTransformer } from '../utils/transformers';

export const PaymentMethod = {
  MPesa: 'MPesa',
  Cash: 'Cash',
  Check: 'Check',
} as const;
export type PaymentMethod = typeof PaymentMethod[keyof typeof PaymentMethod];

export const CheckStatus = {
  Pending: 'Pending',
  Cleared: 'Cleared',
  Bounced: 'Bounced',
} as const;
export type CheckStatus = typeof CheckStatus[keyof typeof CheckStatus];

export const TransactionType = {
  Invoice: 'Invoice',
  Payment: 'Payment',
  ManualDebit: 'ManualDebit',
  ManualCredit: 'ManualCredit',
} as const;
export type TransactionType = typeof TransactionType[keyof typeof TransactionType];

@Entity('transactions')
@Index(['schoolId', 'date']) // Optimized for date range reporting
@Index(['schoolId', 'type']) // Optimized for calculating totals
export class Transaction extends BaseEntity {
  @Index()
  @Column({ name: 'school_id', type: 'uuid', nullable: true })
  schoolId!: string;

  @ManyToOne(() => School, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'school_id' })
  school!: School;

  @Index()
  @Column({ type: 'uuid' })
  studentId!: string;

  @ManyToOne(() => Student, (student) => student.transactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student!: Student;

  @Column({ type: 'enum', enum: TransactionType })
  type!: TransactionType;

  @Column({ type: 'date' })
  date!: string;

  @Column()
  description!: string;

  // OPTIMIZATION: Use decimal for money, transformer converts string->number
  @Column('decimal', { precision: 12, scale: 2, default: 0, transformer: new ColumnNumericTransformer() })
  amount!: number;

  @Column({ type: 'enum', enum: PaymentMethod, nullable: true })
  method?: PaymentMethod;

  @Index() // Optimized for searching receipt numbers
  @Column({ nullable: true })
  transactionCode?: string;

  @Column({ nullable: true })
  checkNumber?: string;

  @Column({ nullable: true })
  checkBank?: string;

  @Column({ type: 'enum', enum: CheckStatus, nullable: true })
  checkStatus?: CheckStatus;
}
