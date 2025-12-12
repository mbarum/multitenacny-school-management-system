
import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { School } from './school.entity';
import { BaseEntity } from './base.entity';
import { ColumnNumericTransformer } from '../utils/transformers';

export const ExpenseCategory = {
  Salaries: 'Salaries',
  Utilities: 'Utilities',
  PettyCash: 'PettyCash',
  Supplies: 'Supplies',
  Maintenance: 'Maintenance',
} as const;
export type ExpenseCategory = typeof ExpenseCategory[keyof typeof ExpenseCategory];

@Entity('expenses')
@Index(['schoolId', 'date']) // Optimize for dashboard charts
export class Expense extends BaseEntity {
  @Index()
  @Column({ name: 'school_id', type: 'uuid', nullable: true })
  schoolId!: string;

  @ManyToOne(() => School, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'school_id' })
  school!: School;

  @Column({ type: 'enum', enum: ExpenseCategory })
  category!: ExpenseCategory;

  @Column()
  description!: string;

  @Column('decimal', { precision: 12, scale: 2, default: 0, transformer: new ColumnNumericTransformer() })
  amount!: number;

  @Column({ type: 'date' })
  date!: string;

  @Column({ nullable: true })
  attachmentUrl?: string;
}
