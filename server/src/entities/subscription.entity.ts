import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { School } from './school.entity';
import { BaseEntity } from './base.entity';

export enum SubscriptionPlan {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM'
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  CANCELLED = 'CANCELLED',
  TRIAL = 'TRIAL',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  PENDING_PAYMENT = 'PENDING_PAYMENT'
}

@Entity('subscriptions')
export class Subscription extends BaseEntity {
  @OneToOne(() => School, (school) => school.subscription, { onDelete: 'CASCADE' })
  @JoinColumn()
  school!: School;

  @Column({ type: 'enum', enum: SubscriptionPlan, default: SubscriptionPlan.FREE })
  plan!: SubscriptionPlan;

  @Column({ type: 'enum', enum: SubscriptionStatus, default: SubscriptionStatus.TRIAL })
  status!: SubscriptionStatus;

  @Column({ nullable: true })
  invoiceNumber!: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  startDate!: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  endDate!: Date;
}