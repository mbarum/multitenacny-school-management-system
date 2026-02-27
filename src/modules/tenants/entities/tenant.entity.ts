import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { SubscriptionPlan, SubscriptionStatus } from 'src/common/subscription.enums';

@Entity({ name: 'tenants' })
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  domain: string;

  @Column({ type: 'enum', enum: SubscriptionPlan, default: SubscriptionPlan.FREE })
  plan: SubscriptionPlan;

  @Column({ type: 'enum', enum: SubscriptionStatus, default: SubscriptionStatus.ACTIVE })
  subscriptionStatus: SubscriptionStatus;

  @Column({ nullable: true })
  expiresAt: Date;

  @Column({ nullable: true, name: 'stripe_customer_id' })
  stripeCustomerId: string;
}
