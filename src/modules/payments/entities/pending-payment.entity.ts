import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Tenant } from 'src/modules/tenants/entities/tenant.entity';
import { SubscriptionPlan } from 'src/common/subscription.enums';

export enum PaymentMethod {
  STRIPE = 'stripe',
  MPESA = 'mpesa',
  BANK_TRANSFER = 'bank_transfer',
}

@Entity({ name: 'pending_payments' })
export class PendingPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenant)
  tenant: Tenant;

  @Column()
  amount: number;

  @Column({ type: 'simple-enum', enum: PaymentMethod })
  method: PaymentMethod;

  @Column()
  reference: string; // e.g., Stripe Session ID, M-Pesa Transaction ID, or a bank transfer reference code

  @Column({
    type: 'simple-enum',
    enum: SubscriptionPlan,
    nullable: true,
  })
  plan: SubscriptionPlan;

  @Column({ default: false })
  isApproved: boolean;
}
