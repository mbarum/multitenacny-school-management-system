import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book } from './entities/book.entity';
import { BookLending } from './entities/book-lending.entity';
import { TenancyService } from 'src/core/tenancy/tenancy.service';
import { TenantAwareCrudService } from 'src/core/common/tenant-aware-crud.service';

@Injectable()
export class LibraryService extends TenantAwareCrudService<Book> {
  constructor(
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
    @InjectRepository(BookLending)
    private readonly lendingRepository: Repository<BookLending>,
    tenancyService: TenancyService,
  ) {
    super(bookRepository, tenancyService);
  }

  async lendBook(bookId: string, studentId: string, dueDate?: Date) {
    const tenantId = this.tenancyService.getTenantId();
    const book = await this.bookRepository.findOne({ where: { id: bookId, tenantId } });

    if (!book) throw new BadRequestException('Book not found');
    if (book.availableCopies <= 0) throw new BadRequestException('No copies available');

    const lending = this.lendingRepository.create({
      tenantId,
      bookId,
      studentId,
      issueDate: new Date(),
      dueDate: dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Default 14 days
      status: 'borrowed'
    });

    book.availableCopies -= 1;
    await this.bookRepository.save(book);
    return this.lendingRepository.save(lending);
  }

  async returnBook(lendingId: string) {
    const tenantId = this.tenancyService.getTenantId();
    const lending = await this.lendingRepository.findOne({ where: { id: lendingId, tenantId } });

    if (!lending) throw new BadRequestException('Lending record not found');
    if (lending.status === 'returned') throw new BadRequestException('Book already returned');

    lending.returnDate = new Date();
    lending.status = 'returned';

    // Calculate fine (e.g., 50 units per day overdue)
    if (lending.returnDate > lending.dueDate) {
      const diffTime = Math.abs(lending.returnDate.getTime() - lending.dueDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      lending.fineAmount = diffDays * 50; 
    }

    const book = await this.bookRepository.findOne({ where: { id: lending.bookId, tenantId } });
    if (book) {
      book.availableCopies += 1;
      await this.bookRepository.save(book);
    }

    return this.lendingRepository.save(lending);
  }

  async getActiveLendings() {
    const tenantId = this.tenancyService.getTenantId();
    return this.lendingRepository.find({
      where: { 
        tenantId, 
        status: 'borrowed'
      },
      relations: ['book', 'student']
    });
  }

  async getOverdueBooks() {
    const tenantId = this.tenancyService.getTenantId();
    // Overdue is where status is borrowed AND dueDate < now
    const lendings = await this.lendingRepository.find({
      where: { 
        tenantId, 
        status: 'borrowed'
      },
      relations: ['book', 'student']
    });

    return lendings.filter(l => new Date(l.dueDate) < new Date());
  }
}
