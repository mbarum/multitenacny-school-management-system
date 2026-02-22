import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../entities/base.entity';
import { Journal } from './journal.entity';
import { Account } from './account.entity';
import { ColumnNumericTransformer } from '../../utils/transformers';

@Entity('gl_journal_entries')
export class JournalEntry extends BaseEntity {
  @Column({ name: 'journal_id', type: 'uuid' })
  journalId!: string;

  @ManyToOne(() => Journal, (journal) => journal.entries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'journal_id' })
  journal!: Journal;

  @Column({ name: 'account_id', type: 'uuid' })
  accountId!: string;

  @ManyToOne(() => Account, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'account_id' })
  account!: Account;

  @Column('decimal', { precision: 12, scale: 2, transformer: new ColumnNumericTransformer() })
  debit!: number;

  @Column('decimal', { precision: 12, scale: 2, transformer: new ColumnNumericTransformer() })
  credit!: number;
}
