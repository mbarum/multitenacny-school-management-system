import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { School } from './school.entity';
import { BaseEntity } from './base.entity';
import { SubscriptionPlan } from './subscription.entity';
import { ColumnNumericTransformer } from '../utils/transformers';

export enum SubscriptionPaymentStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED', // Verified by Gateway/Admin
    APPLIED = 'APPLIED',     // Subscription updated successfully
    FAILED = 'FAILED',
    REFUNDED = 'REFUNDED'
}

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

  @Index({ unique: true })
  @Column()
  transactionCode!: string; 

  @Column()
  paymentDate!: string;

  @Column()
  paymentMethod!: string; // 'MPESA', 'CARD', 'WIRE'

  @Column({
      type: 'enum',
      enum: SubscriptionPlan,
      default: SubscriptionPlan.BASIC
  })
  targetPlan!: SubscriptionPlan;

  @Column({
      type: 'enum',
      enum: SubscriptionPaymentStatus,
      default: SubscriptionPaymentStatus.PENDING
  })
  status!: SubscriptionPaymentStatus;

  @Column({ type: 'text', nullable: true })
  gatewayResponse!: string;
}