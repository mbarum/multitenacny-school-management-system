
import { Entity, PrimaryGeneratedColumn, Column, Index, ManyToOne, JoinColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { School } from './school.entity';
import { LibraryTransaction } from './library-transaction.entity';

@Entity()
export class Book {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

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
  category!: string; // e.g., "Fiction", "Science", "History"

  @Column({ default: 1 })
  totalQuantity!: number;

  @Column({ default: 1 })
  availableQuantity!: number;

  @Column({ nullable: true })
  shelfLocation!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => LibraryTransaction, (transaction) => transaction.book)
  transactions!: LibraryTransaction[];
}
