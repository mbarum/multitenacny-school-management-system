import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { Account } from './entities/account.entity';
import { JournalEntry, LedgerLine } from './entities/journal-entry.entity';
import { Invoice, InvoiceItem } from './entities/invoice.entity';
import { TenancyModule } from 'src/core/tenancy/tenancy.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Account, JournalEntry, LedgerLine, Invoice, InvoiceItem]),
    TenancyModule,
  ],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}
