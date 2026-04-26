import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TenantAwareEntity } from 'src/core/tenancy/tenant-aware.entity';
import { Book } from './book.entity';
import { Student } from '../../students/entities/student.entity';

@Entity({ name: 'book_lendings' })
export class BookLending extends TenantAwareEntity {
  @Column()
  bookId: string;

  @ManyToOne(() => Book)
  @JoinColumn({ name: 'bookId' })
  book: Book;

  @Column()
  studentId: string;

  @ManyToOne(() => Student)
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column()
  issueDate: Date;

  @Column()
  dueDate: Date;

  @Column({ nullable: true })
  returnDate: Date;

  @Column({ default: 'borrowed' })
  status: 'borrowed' | 'returned' | 'overdue';

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  fineAmount: number;
}
