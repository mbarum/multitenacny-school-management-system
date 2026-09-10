
import { Entity, Column, Index, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { School } from './school.entity';
import { LibraryTransaction } from './library-transaction.entity';
import { BaseEntity } from './base.entity';
import { ColumnNumericTransformer } from '../utils/transformers';

@Entity('books')
@Index(['schoolId', 'title'])
export class Book extends BaseEntity {
  @Index()
  @Column({ name: 'school_id', type: 'uuid', nullable: true })
  schoolId!: string;

  @ManyToOne(() => School, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'school_id' })
  school!: School;

  @Column()
  title!: string;

  @Column()
  author!: string;

  @Column({ nullable: true })
  isbn!: string;

  @Column()
  category!: string;

  @Column({ default: 1 })
  totalQuantity!: number;

  @Column({ default: 1 })
  availableQuantity!: number;

  @Column({ nullable: true })
  shelfLocation!: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0, transformer: new ColumnNumericTransformer() })
  price!: number;

  @OneToMany(() => LibraryTransaction, (transaction) => transaction.book)
  transactions!: LibraryTransaction[];
}
