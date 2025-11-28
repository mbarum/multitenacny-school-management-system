import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export const ExpenseCategory = {
  Salaries: 'Salaries',
  Utilities: 'Utilities',
  PettyCash: 'PettyCash',
  Supplies: 'Supplies',
  Maintenance: 'Maintenance',
} as const;
export type ExpenseCategory = typeof ExpenseCategory[keyof typeof ExpenseCategory];

@Entity()
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: ExpenseCategory })
  category!: ExpenseCategory;

  @Column()
  description!: string;

  @Column('float')
  amount!: number;

  @Column({ type: 'date' })
  date!: string;

  @Column({ nullable: true })
  attachmentUrl?: string;
}
