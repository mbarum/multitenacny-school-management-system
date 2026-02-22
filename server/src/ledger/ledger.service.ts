import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Journal, JournalEntry, Account } from './entities';
import { CreateJournalDto } from './dto/create-journal.dto';

@Injectable()
export class LedgerService {
  constructor(
    @InjectRepository(Journal) private journalRepo: Repository<Journal>,
    private readonly entityManager: EntityManager,
  ) {}

  async post(dto: CreateJournalDto, schoolId: string): Promise<Journal> {
    const debitSum = dto.entries.reduce((sum, e) => sum + e.debit, 0);
    const creditSum = dto.entries.reduce((sum, e) => sum + e.credit, 0);

    if (debitSum !== creditSum) {
      throw new BadRequestException('Journal entries must be balanced.');
    }

    return this.entityManager.transaction(async manager => {
      const journal = manager.create(Journal, { ...dto, schoolId });
      const savedJournal = await manager.save(journal);
      return savedJournal;
    });
  }

  async getAccountBalance(accountId: string, schoolId: string): Promise<number> {
    const { balance } = await this.journalRepo.createQueryBuilder('journal')
      .leftJoin('journal.entries', 'entry')
      .select('SUM(entry.debit) - SUM(entry.credit)', 'balance')
      .where('journal.schoolId = :schoolId', { schoolId })
      .andWhere('entry.accountId = :accountId', { accountId })
      .getRawOne();
    return parseFloat(balance) || 0;
  }
}
