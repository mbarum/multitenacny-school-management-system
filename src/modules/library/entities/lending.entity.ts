import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Book } from './book.entity';
import { Student } from '../../students/entities/student.entity';

@Entity('lendings')
export class Lending {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @ManyToOne(() => Book, { eager: true })
  book: Book;

  @Column()
  bookId: string;

  @ManyToOne(() => Student, { eager: true })
  student: Student;

  @Column()
  studentId: string;

  @Column()
  borrowDate: Date;

  @Column({ nullable: true })
  dueDate: Date;

  @Column({ nullable: true })
  returnDate: Date;

  @Column({ default: 'borrowed' }) // borrowed, returned, overdue
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
