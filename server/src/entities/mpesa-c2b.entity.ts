import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class MpesaC2BTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

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
