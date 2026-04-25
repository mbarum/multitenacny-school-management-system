import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Account, AccountType } from './entities/account.entity';
import { JournalEntry, LedgerLine } from './entities/journal-entry.entity';
import { Invoice } from './entities/invoice.entity';
import { TenancyService } from 'src/core/tenancy/tenancy.service';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(JournalEntry)
    private readonly journalRepository: Repository<JournalEntry>,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    private readonly tenancyService: TenancyService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async seedDefaultAccounts(tenantId: string) {
    const defaults = [
      { name: 'Cash at Hand', code: '1001', type: AccountType.ASSET },
      { name: 'Bank Account', code: '1002', type: AccountType.ASSET },
      { name: 'Accounts Receivable', code: '1100', type: AccountType.ASSET },
      { name: 'School Fees Revenue', code: '4001', type: AccountType.REVENUE },
      { name: 'Operational Expenses', code: '5001', type: AccountType.EXPENSE },
      { name: 'Salary Expenses', code: '5100', type: AccountType.EXPENSE },
    ];

    for (const acc of defaults) {
      const exists = await this.accountRepository.findOne({
        where: { tenantId, code: acc.code },
      });
      if (!exists) {
        await this.accountRepository.save(
          this.accountRepository.create({ ...acc, tenantId }),
        );
      }
    }
  }

  async createJournalEntry(data: {
    reference: string;
    description: string;
    date: Date;
    sourceType?: string;
    sourceId?: string;
    lines: { accountCode: string; debit: number; credit: number }[];
  }) {
    const tenantId = this.tenancyService.getTenantId();

    // Validate balance
    const totalDebit = data.lines.reduce((sum, l) => sum + l.debit, 0);
    const totalCredit = data.lines.reduce((sum, l) => sum + l.credit, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      throw new BadRequestException(
        'Journal entry must be balanced (Debits must equal Credits)',
      );
    }

    return await this.dataSource.transaction(async (manager) => {
      const entry = manager.create(JournalEntry, {
        tenantId,
        reference: data.reference,
        description: data.description,
        date: data.date,
        sourceType: data.sourceType,
        sourceId: data.sourceId,
      });

      const ledgerLines: LedgerLine[] = [];
      for (const line of data.lines) {
        const account = await manager.findOne(Account, {
          where: { tenantId, code: line.accountCode },
        });
        if (!account)
          throw new BadRequestException(
            `Account with code ${line.accountCode} not found`,
          );

        const lLine = manager.create(LedgerLine, {
          accountId: account.id,
          debit: line.debit,
          credit: line.credit,
        });
        ledgerLines.push(lLine);

        // Update account balance
        // Assets/Expenses: +Debit -Credit
        // Liability/Equity/Revenue: -Debit +Credit
        const multiplier = [AccountType.ASSET, AccountType.EXPENSE].includes(
          account.type,
        )
          ? 1
          : -1;
        account.balance =
          Number(account.balance) + (line.debit - line.credit) * multiplier;
        await manager.save(account);
      }

      entry.lines = ledgerLines;
      return manager.save(entry);
    });
  }

  async createInvoice(data: {
    studentId: string;
    dueDate: Date;
    items: { description: string; amount: number }[];
  }) {
    const tenantId = this.tenancyService.getTenantId();
    const totalAmount = data.items.reduce((sum, i) => sum + i.amount, 0);
    const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const invoice = await this.invoiceRepository.save(
      this.invoiceRepository.create({
        tenantId,
        invoiceNumber,
        studentId: data.studentId,
        dueDate: data.dueDate,
        amount: totalAmount,
        items: data.items,
      }),
    );

    // Post to Ledger
    // Debit: Accounts Receivable (1100)
    // Credit: School Fees Revenue (4001)
    await this.createJournalEntry({
      reference: invoiceNumber,
      description: `Billing for student: ${data.studentId}`,
      date: new Date(),
      sourceType: 'invoice',
      sourceId: invoice.id,
      lines: [
        { accountCode: '1100', debit: totalAmount, credit: 0 },
        { accountCode: '4001', debit: 0, credit: totalAmount },
      ],
    });

    return invoice;
  }

  async recordPayment(data: {
    invoiceId: string;
    amount: number;
    method: 'cash' | 'bank' | 'mpesa';
    reference: string;
  }) {
    const tenantId = this.tenancyService.getTenantId();
    const invoice = await this.invoiceRepository.findOne({
      where: { id: data.invoiceId, tenantId },
    });
    if (!invoice) throw new BadRequestException('Invoice not found');

    const amount = Number(data.amount);
    invoice.paidAmount = Number(invoice.paidAmount) + amount;
    if (invoice.paidAmount >= invoice.amount) {
      invoice.status = 'paid';
    } else if (invoice.paidAmount > 0) {
      invoice.status = 'partial';
    }
    await this.invoiceRepository.save(invoice);

    // Post to Ledger
    // Debit: Cash/Bank (1001/1002)
    // Credit: Accounts Receivable (1100)
    const bankAccount = data.method === 'cash' ? '1001' : '1002';
    await this.createJournalEntry({
      reference: data.reference,
      description: `Payment for Invoice ${invoice.invoiceNumber}`,
      date: new Date(),
      sourceType: 'payment',
      sourceId: invoice.id,
      lines: [
        { accountCode: bankAccount, debit: amount, credit: 0 },
        { accountCode: '1100', debit: 0, credit: amount },
      ],
    });

    return invoice;
  }

  async getDashboardMetrics() {
    const tenantId = this.tenancyService.getTenantId();
    const accounts = await this.accountRepository.find({ where: { tenantId } });

    return {
      cashBalance:
        accounts.find((a) => a.code === '1001' || a.code === '1002')?.balance ||
        0,
      receivables: accounts.find((a) => a.code === '1100')?.balance || 0,
      revenue: accounts.find((a) => a.code === '4001')?.balance || 0,
      expenses:
        accounts.find((a) => a.code === '5001' || a.code === '5100')?.balance ||
        0,
    };
  }

  async getInvoices() {
    const tenantId = this.tenancyService.getTenantId();
    return this.invoiceRepository.find({
      where: { tenantId },
      relations: ['student'],
      order: { createdAt: 'DESC' },
    });
  }
}
