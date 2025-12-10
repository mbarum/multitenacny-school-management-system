
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index, CreateDateColumn } from 'typeorm';
import { School } from './school.entity';
import { Book } from './book.entity';
import { Student } from './student.entity';
import { User } from './user.entity';

export enum LibraryStatus {
    BORROWED = 'Borrowed',
    RETURNED = 'Returned',
    OVERDUE = 'Overdue',
    LOST = 'Lost'
}

@Entity()
export class LibraryTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  schoolId!: string;

  @ManyToOne(() => School, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schoolId' })
  school!: School;

  @Column({ type: 'uuid' })
  bookId!: string;

  @ManyToOne(() => Book, (book) => book.transactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookId' })
  book!: Book;

  @Column({ type: 'uuid', nullable: true })
  studentId!: string | null;

  @ManyToOne(() => Student, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'studentId' })
  student!: Student | null;

  // Optional: Allow staff to borrow too (not strictly typed to Staff entity here to keep it simple, but linked via User if needed)
  @Column({ nullable: true })
  borrowerName!: string; 

  @Column({ type: 'date' })
  borrowDate!: string;

  @Column({ type: 'date' })
  dueDate!: string;

  @Column({ type: 'date', nullable: true })
  returnDate!: string | null;

  @Column({ type: 'enum', enum: LibraryStatus, default: LibraryStatus.BORROWED })
  status!: LibraryStatus;

  @Column({ nullable: true })
  remarks?: string;
}
