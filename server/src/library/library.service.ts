import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Book } from '../entities/book.entity';
import { LibraryTransaction, LibraryStatus } from '../entities/library-transaction.entity';
import { Student } from '../entities/student.entity';
import { Transaction, TransactionType } from '../entities/transaction.entity';
import { CreateBookDto } from './dto/create-book.dto';
import { IssueBookDto } from './dto/issue-book.dto';
import { GetBooksDto } from './dto/get-books.dto';
import { GetLibraryTransactionsDto } from './dto/get-library-transactions.dto';

@Injectable()
export class LibraryService {
  constructor(
    @InjectRepository(Book) private bookRepo: Repository<Book>,
    @InjectRepository(LibraryTransaction) private transactionRepo: Repository<LibraryTransaction>,
    @InjectRepository(Student) private studentRepo: Repository<Student>,
    @InjectRepository(Transaction) private financeRepo: Repository<Transaction>,
    private dataSource: DataSource
  ) {}

  async findAllBooks(query: GetBooksDto, schoolId: string) {
    const { page = 1, limit = 10, search, pagination } = query;
    const qb = this.bookRepo.createQueryBuilder('book');
    qb.where('book.schoolId = :schoolId', { schoolId });

    if (search) {
        qb.andWhere('(book.title LIKE :search OR book.author LIKE :search OR book.isbn LIKE :search)', { search: `%${search}%` });
    }

    qb.orderBy('book.title', 'ASC');

    if (pagination === 'false') {
        const books = await qb.getMany();
        return { data: books, total: books.length };
    }

    const [data, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();
    return { data, total, page, limit, last_page: Math.ceil(total / limit) };
  }

  async createBook(dto: CreateBookDto, schoolId: string) {
    const book = this.bookRepo.create({
      ...dto,
      availableQuantity: dto.totalQuantity,
      schoolId
    });
    return this.bookRepo.save(book);
  }

  async updateBook(id: string, updates: Partial<Book>, schoolId: string) {
    const book = await this.bookRepo.findOne({ where: { id, schoolId: schoolId as any } });
    if (!book) throw new NotFoundException('Book not found');
    
    if (updates.totalQuantity !== undefined) {
        const currentlyBorrowed = book.totalQuantity - book.availableQuantity;
        if (updates.totalQuantity < currentlyBorrowed) {
            throw new BadRequestException(`Cannot reduce total quantity below currently borrowed count (${currentlyBorrowed})`);
        }
        book.availableQuantity = updates.totalQuantity - currentlyBorrowed;
    }
    
    Object.assign(book, updates);
    return this.bookRepo.save(book);
  }

  async deleteBook(id: string, schoolId: string) {
    const book = await this.bookRepo.findOne({ where: { id, schoolId: schoolId as any } });
    if (!book) throw new NotFoundException();
    
    if (book.availableQuantity < book.totalQuantity) {
        throw new BadRequestException('Cannot delete book while copies are still borrowed.');
    }
    await this.bookRepo.delete(id);
  }

  async issueBook(dto: IssueBookDto, schoolId: string) {
    return this.dataSource.transaction(async manager => {
      const book = await manager.findOne(Book, { where: { id: dto.bookId, schoolId: schoolId as any } });
      if (!book || book.availableQuantity < 1) throw new BadRequestException('Book unavailable');

      const student = await manager.findOne(Student, { where: { id: dto.studentId, schoolId: schoolId as any } });
      if (!student) throw new NotFoundException('Student not found');

      const transaction = manager.create(LibraryTransaction, {
        schoolId, bookId: book.id, studentId: student.id,
        bookTitle: book.title, borrowerName: student.name,
        borrowDate: new Date().toISOString().split('T')[0],
        dueDate: dto.dueDate, status: LibraryStatus.BORROWED
      });
      
      book.availableQuantity -= 1;
      await manager.save(book);
      return manager.save(transaction);
    });
  }

  async returnBook(transactionId: string, schoolId: string) {
    return this.dataSource.transaction(async manager => {
      const transaction = await manager.findOne(LibraryTransaction, { where: { id: transactionId, schoolId: schoolId as any } });
      if (!transaction || transaction.status !== LibraryStatus.BORROWED) throw new BadRequestException('Invalid return request');

      transaction.status = LibraryStatus.RETURNED;
      transaction.returnDate = new Date().toISOString().split('T')[0];
      
      const book = await manager.findOne(Book, { where: { id: transaction.bookId } });
      if (book) {
          book.availableQuantity += 1;
          await manager.save(book);
      }
      return manager.save(transaction);
    });
  }

  async markLost(transactionId: string, schoolId: string) {
    return this.dataSource.transaction(async manager => {
      const transaction = await manager.findOne(LibraryTransaction, { where: { id: transactionId, schoolId: schoolId as any } });
      if (!transaction || transaction.status !== LibraryStatus.BORROWED) throw new BadRequestException('Invalid lost book request');

      transaction.status = LibraryStatus.LOST;
      transaction.remarks = 'Lost by student. Fine applied.';
      
      const book = await manager.findOne(Book, { where: { id: transaction.bookId } });
      if (book) {
          book.totalQuantity -= 1; // Permanently removed from inventory
          await manager.save(book);
          
          if (book.price > 0) {
              await manager.save(Transaction, manager.create(Transaction, {
                  schoolId, studentId: transaction.studentId!,
                  type: TransactionType.Invoice, amount: book.price,
                  date: new Date().toISOString().split('T')[0],
                  description: `Library Fine: Lost Book - ${book.title}`
              }));
          }
      }
      return manager.save(transaction);
    });
  }

  async getTransactions(query: GetLibraryTransactionsDto, schoolId: string) {
    const { page = 1, limit = 10, status, studentId } = query;
    const qb = this.transactionRepo.createQueryBuilder('t')
        .where('t.schoolId = :schoolId', { schoolId });

    if (status) qb.andWhere('t.status = :status', { status });
    if (studentId) qb.andWhere('t.studentId = :studentId', { studentId });

    const [data, total] = await qb.orderBy('t.borrowDate', 'DESC').skip((page - 1) * limit).take(limit).getManyAndCount();
    return { data, total, page, limit, last_page: Math.ceil(total / limit) };
  }
}