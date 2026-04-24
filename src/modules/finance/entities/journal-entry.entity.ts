import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, CreateDateColumn } from 'typeorm';

@Entity('journal_entries')
export class JournalEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column()
  reference: string;

  @Column()
  description: string;

  @Column()
  date: Date;

  @Column({ nullable: true })
  sourceType: string; // e.g., 'invoice', 'payment', 'expense'

  @Column({ nullable: true })
  sourceId: string;

  @OneToMany(() => LedgerLine, (line) => line.journalEntry, { cascade: true })
  lines: LedgerLine[];

  @Column({ default: false })
  isReversed: boolean;

  @Column({ nullable: true })
  reversedByEntryId: string;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('ledger_lines')
export class LedgerLine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => JournalEntry, (entry) => entry.lines)
  journalEntry: JournalEntry;

  @Column()
  accountId: string;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  debit: number;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  credit: number;
}
