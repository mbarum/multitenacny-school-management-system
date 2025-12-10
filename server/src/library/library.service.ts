
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, LessThan } from 'typeorm';
import { Book } from '../entities/book.entity';
import { LibraryTransaction, LibraryStatus } from '../entities/library-transaction.entity';
import { Student } from '../entities/student.entity';
import { CreateBookDto } from './dto/create-book.dto';
import { IssueBookDto } from './dto/issue-book.dto';

@Injectable()
export class LibraryService {
  constructor(
    @InjectRepository(Book) private bookRepo: Repository<Book>,
    @InjectRepository(LibraryTransaction) private transactionRepo: Repository<LibraryTransaction>,
    @InjectRepository(Student) private studentRepo: Repository<Student>,
    private dataSource: DataSource
  ) {}

  async findAllBooks(schoolId: string) {
    return this.bookRepo.find({ where: { schoolId: schoolId as any }, order: { title: 'ASC' } });
  }

  async createBook(dto: CreateBookDto, schoolId: string) {
    const book = this.bookRepo.create({
      ...dto,
      availableQuantity: dto.totalQuantity,
      school: { id: schoolId } as any
    });
    return this.bookRepo.save(book);
  }

  async updateBook(id: string, updates: Partial<Book>, schoolId: string) {
    const book = await this.bookRepo.findOne({ where: { id, schoolId: schoolId as any } });
    if (!book) throw new NotFoundException('Book not found');
    Object.assign(book, updates);
    return this.bookRepo.save(book);
  }

  async deleteBook(id: string, schoolId: string) {
    const result = await this.bookRepo.delete({ id, schoolId: schoolId as any });
    if (result.affected === 0) throw new NotFoundException('Book not found');
  }

  async issueBook(dto: IssueBookDto, schoolId: string) {
    return this.dataSource.transaction(async manager => {
      const book = await manager.findOne(Book, { where: { id: dto.bookId, schoolId: schoolId as any } });
      if (!book) throw new NotFoundException('Book not found');
      if (book.availableQuantity < 1) throw new BadRequestException('Book is not available');

      const student = await manager.findOne(Student, { where: { id: dto.studentId, schoolId: schoolId as any } });
      if (!student) throw new NotFoundException('Student not found');

      // Create transaction
      const transaction = manager.create(LibraryTransaction, {
        school: { id: schoolId } as any,
        book,
        student,
        borrowerName: student.name,
        borrowDate: new Date().toISOString().split('T')[0],
        dueDate: dto.dueDate,
        status: LibraryStatus.BORROWED
      });
      await manager.save(transaction);

      // Decrement quantity
      book.availableQuantity -= 1;
      await manager.save(book);

      return transaction;
    });
  }

  async returnBook(transactionId: string, schoolId: string) {
    return this.dataSource.transaction(async manager => {
      const transaction = await manager.findOne(LibraryTransaction, { 
        where: { id: transactionId, schoolId: schoolId as any },
        relations: ['book']
      });
      
      if (!transaction) throw new NotFoundException('Transaction not found');
      if (transaction.status === LibraryStatus.RETURNED) throw new BadRequestException('Book already returned');

      transaction.status = LibraryStatus.RETURNED;
      transaction.returnDate = new Date().toISOString().split('T')[0];
      await manager.save(transaction);

      // Increment quantity
      const book = transaction.book;
      book.availableQuantity += 1;
      await manager.save(book);

      return transaction;
    });
  }

  async getTransactions(schoolId: string) {
    return this.transactionRepo.find({
      where: { schoolId: schoolId as any },
      relations: ['book', 'student'],
      order: { borrowDate: 'DESC' }
    });
  }
}
