import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { School } from '../../entities/school.entity';
import { BaseEntity } from '../../entities/base.entity';

export enum FinancialActionType {
  FeePayment = 'FeePayment',
  ExpenseRecorded = 'ExpenseRecorded',
  PayrollRun = 'PayrollRun',
}

@Entity('gl_financial_audit_log')
export class FinancialAuditLog extends BaseEntity {
  @Index()
  @Column({ name: 'school_id', type: 'uuid' })
  schoolId!: string;

  @ManyToOne(() => School, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school!: School;

  @Column({ type: 'enum', enum: FinancialActionType })
  actionType!: FinancialActionType;

  @Column({ type: 'jsonb' })
  details!: Record<string, any>; // Store transaction details as JSON

  @Column({ length: 64, unique: true })
  hash!: string; // SHA-256 hash of the current record's data

  @Column({ name: 'previous_hash', length: 64, nullable: true })
  previousHash?: string; // SHA-256 hash of the previous record

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;
}
