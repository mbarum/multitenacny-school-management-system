
import { Entity, Column, Index, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { School } from './school.entity';
import { BaseEntity } from './base.entity';
import { ColumnNumericTransformer } from '../utils/transformers';

@Entity('monthly_financials')
@Unique(['schoolId', 'year', 'month'])
export class MonthlyFinancial extends BaseEntity {
  @Index()
  @Column({ name: 'school_id', type: 'uuid' })
  schoolId!: string;

  @ManyToOne(() => School, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school!: School;

  @Column('int')
  year!: number;

  @Column('int')
  month!: number; // 1-12

  @Column('decimal', { precision: 12, scale: 2, default: 0, transformer: new ColumnNumericTransformer() })
  totalIncome!: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0, transformer: new ColumnNumericTransformer() })
  totalExpenses!: number;
  
  // Virtual field for easy querying
  @Column({ type: 'varchar', length: 7 }) // Format: "YYYY-MM"
  monthKey!: string;
}
