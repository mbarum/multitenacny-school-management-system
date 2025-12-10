
import { Entity, PrimaryGeneratedColumn, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { School } from './school.entity';

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

  @Column('float')
  amount!: number;

  @Column({ type: 'date' })
  date!: string;

  @Column({ nullable: true })
  attachmentUrl?: string;
}
