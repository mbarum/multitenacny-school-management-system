import { Entity, Column, Index, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { School } from '../../entities/school.entity';
import { BaseEntity } from '../../entities/base.entity';
import { JournalEntry } from './journal-entry.entity';

export enum JournalStatus {
  Draft = 'Draft',
  Posted = 'Posted',
  Reversed = 'Reversed',
}

@Entity('gl_journals')
export class Journal extends BaseEntity {
  @Index()
  @Column({ name: 'school_id', type: 'uuid' })
  schoolId!: string;

  @ManyToOne(() => School, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school!: School;

  @Column({ type: 'date' })
  date!: string;

  @Column()
  reference!: string; // e.g., INV-001, PAY-002

  @Column()
  memo!: string;

  @Column({ type: 'enum', enum: JournalStatus, default: JournalStatus.Posted })
  status!: JournalStatus;

  @OneToMany(() => JournalEntry, (entry) => entry.journal, { cascade: true })
  entries!: JournalEntry[];
}
