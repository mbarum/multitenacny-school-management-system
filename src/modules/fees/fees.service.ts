import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Fee } from './entities/fee.entity';
import { FeePayment } from './entities/fee-payment.entity';
import { FeeItem } from './entities/fee-item.entity';
import { FeeStructure } from './entities/fee-structure.entity';
import { Invoice } from './entities/invoice.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { FeeWaiver } from './entities/fee-waiver.entity';
import { Student } from 'src/modules/students/entities/student.entity';
import { TenancyService } from 'src/core/tenancy/tenancy.service';
import { TenantAwareCrudService } from 'src/core/common/tenant-aware-crud.service';

@Injectable()
export class FeesService extends TenantAwareCrudService<Fee> {
  constructor(
    @InjectRepository(Fee)
    private readonly feeRepository: Repository<Fee>,
    @InjectRepository(FeePayment)
    private readonly feePaymentRepository: Repository<FeePayment>,
    @InjectRepository(FeeItem)
    private readonly feeItemRepository: Repository<FeeItem>,
    @InjectRepository(FeeStructure)
    private readonly feeStructureRepository: Repository<FeeStructure>,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(InvoiceItem)
    private readonly invoiceItemRepository: Repository<InvoiceItem>,
    @InjectRepository(FeeWaiver)
    private readonly feeWaiverRepository: Repository<FeeWaiver>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    tenancyService: TenancyService,
  ) {
    super(feeRepository, tenancyService);
  }

  // --- Core Fee Management ---
  async findAll(): Promise<Fee[]> {
    return this.feeRepository.find({
      where: { tenantId: this.tenancyService.getTenantId() },
      relations: ['student'],
    });
  }

  // --- Invoicing ---
  async generateInvoicesForClass(
    classLevelId: string,
    term: string,
    dueDate: Date,
  ): Promise<Invoice[]> {
    const tenantId = this.tenancyService.getTenantId();
    const students = await this.studentRepository.find({
      where: { classLevelId, tenantId },
    });

    const feeStructures = await this.feeStructureRepository.find({
      where: { classLevelId, tenantId },
      relations: ['feeItem'],
    });

    const createdInvoices: Invoice[] = [];

    for (const student of students) {
      // Check if invoice already exists for this term
      const existing = await this.invoiceRepository.findOne({
        where: { studentId: student.id, term, tenantId },
      });
      if (existing) continue;

      // Get student specific waivers
      const waivers = await this.feeWaiverRepository.find({
        where: { studentId: student.id, isActive: true, tenantId },
      });

      const invoiceItems: Partial<InvoiceItem>[] = feeStructures.map((fs) => ({
        description: fs.feeItem.name,
        amount: Number(fs.amount),
        tenantId,
      }));

      // Add deductions for waivers
      waivers.forEach((w) => {
        invoiceItems.push({
          description: `Waiver: ${w.name}`,
          amount: -Number(w.amount),
          tenantId,
        });
      });

      const totalAmount = invoiceItems.reduce(
        (sum, item) => sum + Number(item.amount),
        0,
      );

      const invoice = this.invoiceRepository.create({
        studentId: student.id,
        term,
        dueDate,
        totalAmount,
        invoiceNumber: `INV-${Date.now()}-${student.registrationNumber}`,
        tenantId,
        status: 'unpaid',
      });

      const savedInvoice = await this.invoiceRepository.save(invoice);

      const items = invoiceItems.map((item) =>
        this.invoiceItemRepository.create({
          ...item,
          invoiceId: savedInvoice.id,
        }),
      );
      await this.invoiceItemRepository.save(items);

      createdInvoices.push(savedInvoice);

      // Create a legacy Fee record for backward compatibility/tracking
      const fee = this.feeRepository.create({
        studentId: student.id,
        amount: totalAmount,
        dueDate,
        status: 'unpaid',
        tenantId,
      });
      await this.feeRepository.save(fee);
    }

    return createdInvoices;
  }

  async findAllInvoices(): Promise<Invoice[]> {
    return this.invoiceRepository.find({
      where: { tenantId: this.tenancyService.getTenantId() },
      relations: ['student', 'items'],
      order: { createdAt: 'DESC' } as any,
    });
  }

  async recordManualPayment(
    invoiceId: string,
    amount: number,
    method: string,
    reference: string,
  ): Promise<FeePayment> {
    const tenantId = this.tenancyService.getTenantId();
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId, tenantId },
      relations: ['student'],
    });

    if (!invoice) throw new NotFoundException('Invoice not found');

    const payment = this.feePaymentRepository.create({
      studentId: invoice.studentId,
      amount,
      paymentDate: new Date(),
      method,
      reference,
      tenantId,
    });

    const savedPayment = await this.feePaymentRepository.save(payment);

    // Update invoice status
    invoice.paidAmount = Number(invoice.paidAmount) + amount;
    if (invoice.paidAmount >= invoice.totalAmount) {
      invoice.status = 'paid';
    } else {
      invoice.status = 'partial';
    }
    await this.invoiceRepository.save(invoice);

    return savedPayment;
  }

  // --- Waivers ---
  async createWaiver(data: Partial<FeeWaiver>): Promise<FeeWaiver> {
    const waiver = this.feeWaiverRepository.create({
      ...data,
      tenantId: this.tenancyService.getTenantId(),
    });
    return this.feeWaiverRepository.save(waiver);
  }

  async findAllWaivers(): Promise<FeeWaiver[]> {
    return this.feeWaiverRepository.find({
      where: { tenantId: this.tenancyService.getTenantId() },
      relations: ['student'],
    });
  }

  // --- Fee Items Management ---
  findAllFeeItems(): Promise<FeeItem[]> {
    return this.feeItemRepository.find({
      where: { tenantId: this.tenancyService.getTenantId() },
    });
  }

  createFeeItem(data: Partial<FeeItem>): Promise<FeeItem> {
    const item = this.feeItemRepository.create({
      ...data,
      tenantId: this.tenancyService.getTenantId(),
    });
    return this.feeItemRepository.save(item);
  }

  async removeFeeItem(id: string): Promise<void> {
    const tenantId = this.tenancyService.getTenantId();
    const item = await this.feeItemRepository.findOne({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('Fee Item not found');
    await this.feeItemRepository.remove(item);
  }

  // --- Fee Structure Management ---
  findAllFeeStructures(): Promise<FeeStructure[]> {
    return this.feeStructureRepository.find({
      where: { tenantId: this.tenancyService.getTenantId() },
      relations: ['feeItem', 'classLevel'],
    });
  }

  createFeeStructure(data: Partial<FeeStructure>): Promise<FeeStructure> {
    const structure = this.feeStructureRepository.create({
      ...data,
      tenantId: this.tenancyService.getTenantId(),
    });
    return this.feeStructureRepository.save(structure);
  }

  async removeFeeStructure(id: string): Promise<void> {
    const tenantId = this.tenancyService.getTenantId();
    const structure = await this.feeStructureRepository.findOne({ where: { id, tenantId } });
    if (!structure) throw new NotFoundException('Fee Structure not found');
    await this.feeStructureRepository.remove(structure);
  }

  async processMpesaPayment(
    registrationNumber: string,
    amount: number,
    reference: string,
    tenantId: string,
  ): Promise<FeePayment> {
    const student = await this.studentRepository.findOne({
      where: { registrationNumber, tenantId },
    });

    if (!student) {
      throw new NotFoundException(
        `Student with admission number ${registrationNumber} not found.`,
      );
    }

    const payment = this.feePaymentRepository.create({
      studentId: student.id,
      amount,
      reference,
      paymentDate: new Date(),
      method: 'M-PESA',
      tenantId,
    });

    const savedPayment = await this.feePaymentRepository.save(payment);
    await this.reconcileFees(student.id, amount, tenantId);
    return savedPayment;
  }

  private async reconcileFees(
    studentId: string,
    paidAmount: number,
    tenantId: string,
  ) {
    const unpaidFees = await this.feeRepository.find({
      where: [
        { studentId, status: 'unpaid', tenantId },
        { studentId, status: 'overdue', tenantId },
      ],
      order: { dueDate: 'ASC' },
    });

    let remainingAmount = paidAmount;

    for (const fee of unpaidFees) {
      if (remainingAmount <= 0) break;

      if (remainingAmount >= Number(fee.amount)) {
        remainingAmount -= Number(fee.amount);
        fee.status = 'paid';
        await this.feeRepository.save(fee);
      } else {
        break;
      }
    }
  }
}
