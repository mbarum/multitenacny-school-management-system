import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book } from './entities/book.entity';
import { Lending } from './entities/lending.entity';
import { TenancyService } from 'src/core/tenancy/tenancy.service';
import { TenantAwareCrudService } from 'src/core/common/tenant-aware-crud.service';

@Injectable()
export class LibraryService extends TenantAwareCrudService<Book> {
  constructor(
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
    @InjectRepository(Lending)
    private readonly lendingRepository: Repository<Lending>,
    tenancyService: TenancyService,
  ) {
    super(bookRepository, tenancyService);
  }

  async lendBook(bookId: string, studentId: string, dueDate?: Date) {
    const tenantId = this.tenancyService.getTenantId();
    const book = await this.bookRepository.findOne({ where: { id: bookId, tenantId } });

    if (!book) throw new BadRequestException('Book not found');
    if (book.availableQuantity <= 0) throw new BadRequestException('No copies available');

    const lending = this.lendingRepository.create({
      tenantId,
      bookId,
      studentId,
      borrowDate: new Date(),
      dueDate: dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Default 14 days
      status: 'borrowed'
    });

    book.availableQuantity -= 1;
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

    const book = await this.bookRepository.findOne({ where: { id: lending.bookId, tenantId } });
    if (book) {
      book.availableQuantity += 1;
      await this.bookRepository.save(book);
    }

    return this.lendingRepository.save(lending);
  }

  async getActiveLendings() {
    const tenantId = this.tenancyService.getTenantId();
    return this.lendingRepository.find({
      where: { tenantId, status: 'borrowed' },
      order: { borrowDate: 'DESC' }
    });
  }
}
