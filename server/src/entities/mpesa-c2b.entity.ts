
import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('mpesa_c2b_transactions')
export class MpesaC2BTransaction extends BaseEntity {
  @Column()
  transactionType!: string;

  @Column({ unique: true })
  transID!: string;

  @Column()
  transTime!: string;

  @Column()
  transAmount!: string;

  @Column()
  businessShortCode!: string;

  @Column()
  billRefNumber!: string;

  @Column()
  msisdn!: string;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column({ default: false })
  isProcessed!: boolean;
}
