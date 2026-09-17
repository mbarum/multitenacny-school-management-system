
import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ColumnNumericTransformer } from '../utils/transformers';

@Entity('platform_settings')
export class PlatformSetting extends BaseEntity {
  @Column('decimal', { precision: 12, scale: 2, default: 3000, transformer: new ColumnNumericTransformer() })
  basicMonthlyPrice!: number;

  @Column('decimal', { precision: 12, scale: 2, default: 30000, transformer: new ColumnNumericTransformer() })
  basicAnnualPrice!: number;

  @Column('decimal', { precision: 12, scale: 2, default: 5000, transformer: new ColumnNumericTransformer() })
  premiumMonthlyPrice!: number;

  @Column('decimal', { precision: 12, scale: 2, default: 50000, transformer: new ColumnNumericTransformer() })
  premiumAnnualPrice!: number;

  // M-Pesa Integration for Super Admin (Receiving Platform Revenue)
  @Column({ default: '' })
  mpesaPaybill!: string;

  @Column({ default: '' })
  mpesaConsumerKey!: string;

  @Column({ default: '' })
  mpesaConsumerSecret!: string;

  @Column({ default: '' })
  mpesaPasskey!: string;

  // Stripe Integration
  @Column({ default: '' })
  stripePublishableKey!: string;

  @Column({ default: '' })
  stripeSecretKey!: string;

  @Column({ default: '' })
  stripeWebhookSecret!: string;

  @Column({ default: true })
  stripeEnabled!: boolean;

  @Column({ default: 'KES' })
  stripeCurrency!: string;

  @Column({ default: 'sandbox' })
  mpesaEnvironment!: 'sandbox' | 'production';

  // Bank Wire Details
  @Column({ default: 'NCBA Bank Kenya PLC' })
  wireBankName!: string;

  @Column({ default: 'SAASLINK TECHNOLOGIES LIMITED' })
  wireAccountName!: string;

  @Column({ default: '8809220019' })
  wireAccountNumber!: string;

  @Column({ default: 'Nairobi - Upperhill Branch' })
  wireBankBranch!: string;

  @Column({ default: 'CBAFKENX' })
  wireSwiftCode!: string;

  @Column({ default: 'Quote proforma reference in payment details' })
  wirePaymentInstructions!: string;
}
