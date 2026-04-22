import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import {
  SubscriptionPlan,
  SubscriptionStatus,
} from 'src/common/subscription.enums';

@Entity({ name: 'tenants' })
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  domain: string;

  @Column({
    type: 'simple-enum',
    enum: SubscriptionPlan,
    default: SubscriptionPlan.FREE,
  })
  plan: SubscriptionPlan;

  @Column({
    type: 'simple-enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  subscriptionStatus: SubscriptionStatus;

  @Column({ nullable: true })
  expiresAt: Date;

  @Column({ nullable: true, name: 'stripe_customer_id' })
  stripeCustomerId: string;

  @Column({ default: 'TRADITIONAL' })
  gradingMode: string; // 'TRADITIONAL', 'CBE', 'HYBRID'

  @Column({ nullable: true })
  contactEmail: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subscriptionFee: number;
}
