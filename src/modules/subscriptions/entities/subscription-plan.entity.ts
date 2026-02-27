import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

export enum PlanInterval {
  MONTH = 'month',
  YEAR = 'year',
}

@Entity({ name: 'subscription_plans' })
export class SubscriptionPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string; // e.g., 'Basic', 'Premium'

  @Column()
  description: string;

  @Column()
  price: number; // Price in the smallest currency unit (e.g., cents)

  @Column({ type: 'enum', enum: PlanInterval, default: PlanInterval.MONTH })
  interval: PlanInterval;

  @Column()
  stripePriceId: string; // The ID of the price object in Stripe

  @Column('simple-json')
  features: string[];

  @Column({ default: true })
  isActive: boolean;
}
