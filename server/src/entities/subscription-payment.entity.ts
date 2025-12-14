
import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { School } from './school.entity';
import { BaseEntity } from './base.entity';
import { ColumnNumericTransformer } from '../utils/transformers';

@Entity('subscription_payments')
export class SubscriptionPayment extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  schoolId!: string;

  @ManyToOne(() => School, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schoolId' })
  school!: School;

  @Column('decimal', { precision: 12, scale: 2, default: 0, transformer: new ColumnNumericTransformer() })
  amount!: number;

  @Column()
  transactionCode!: string; // M-Pesa Receipt Number

  @Column()
  paymentDate!: string; // YYYY-MM-DD

  @Column()
  paymentMethod!: string; // 'M-Pesa', 'Bank', etc.

  @Column({ nullable: true })
  periodStart!: string;

  @Column({ nullable: true })
  periodEnd!: string;
}
