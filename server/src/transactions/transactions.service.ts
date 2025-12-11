
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { Transaction, TransactionType, PaymentMethod } from '../entities/transaction.entity';
import { GetTransactionsDto } from './dto/get-transactions.dto';
import { Student } from '../entities/student.entity';
import { MpesaC2BTransaction } from '../entities/mpesa-c2b.entity';
import { EventsGateway } from '../events/events.gateway';
import { CsvUtil } from '../utils/csv.util';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(MpesaC2BTransaction)
    private mpesaRepo: Repository<MpesaC2BTransaction>,
    private eventsGateway: EventsGateway,
  ) {}

  private mapTransactionToDto(transaction: Transaction): any {
    return {
      ...transaction,
      studentName: transaction.student?.name,
      studentId: transaction.student?.id,
    };
  }

  // Normalize phone to format: 254XXXXXXXXX
  private normalizePhone(phone: string): string {
      return phone.replace(/^\+/, '').replace(/^0/, '254');
  }

  async create(createTransactionDto: any, schoolId: string): Promise<any> {
    const { studentId, ...rest } = createTransactionDto;

    // Verify student exists AND belongs to the school
    const student = await this.studentRepository.findOne({ where: { id: studentId, schoolId: schoolId as any } });
    if (!student) {
        throw new NotFoundException(`Student with ID ${studentId} not found in this school.`);
    }

    // Create and save with schoolId
    const transaction = this.transactionsRepository.create({
        ...rest,
        student: student,
        school: { id: schoolId } as any
    } as DeepPartial<Transaction>);
    
    const savedTransaction = await this.transactionsRepository.save(transaction);

    const reloadedTransaction = await this.transactionsRepository.findOne({
        where: { id: savedTransaction.id },
        relations: ['student']
    });

    if (!reloadedTransaction) {
        throw new BadRequestException('Failed to retrieve created transaction.');
    }

    return this.mapTransactionToDto(reloadedTransaction);
  }

  async createBatch(createTransactionDtos: any[], schoolId: string): Promise<Transaction[]> {
    const transactions = createTransactionDtos.map(dto => {
        const { studentId, ...rest } = dto;
        return this.transactionsRepository.create({
            ...rest,
            student: { id: studentId },
            school: { id: schoolId } as any
        } as DeepPartial<Transaction>);
    });
    return this.transactionsRepository.save(transactions);
  }

  async findAll(query: GetTransactionsDto | undefined, schoolId: string): Promise<any> {
    const { page = 1, limit = 10, search, startDate, endDate, type, studentId, pagination } = query || {};
    
    const qb = this.transactionsRepository.createQueryBuilder('transaction');
    qb.leftJoinAndSelect('transaction.student', 'student');
    
    // Multi-tenancy filter
    qb.where('transaction.schoolId = :schoolId', { schoolId });

    if (search) {
        qb.andWhere('(student.name LIKE :search OR transaction.description LIKE :search OR transaction.transactionCode LIKE :search)', { search: `%${search}%` });
    }

    if (studentId) {
        qb.andWhere('student.id = :studentId', { studentId });
    }

    if (type) {
        qb.andWhere('transaction.type = :type', { type });
    }

    if (startDate) {
        qb.andWhere('transaction.date >= :startDate', { startDate });
    }

    if (endDate) {
        qb.andWhere('transaction.date <= :endDate', { endDate });
    }

    qb.orderBy('transaction.date', 'DESC');
    qb.addOrderBy('transaction.id', 'DESC');

    if (pagination === 'false') {
        const allTransactions = await qb.getMany();
        return allTransactions.map(this.mapTransactionToDto);
    }

    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);

    const [transactions, total] = await qb.getManyAndCount();
    
    const flatTransactions = transactions.map(this.mapTransactionToDto);

    return {
      data: flatTransactions,
      total,
      page,
      limit,
      last_page: Math.ceil(total / limit),
    };
  }

  async update(id: string, updateDto: any, schoolId: string): Promise<any> {
    const transaction = await this.transactionsRepository.findOne({ 
        where: { id, schoolId: schoolId as any },
        relations: ['student']
    });
    if (!transaction) throw new NotFoundException('Transaction not found');

    const { studentId, ...updates } = updateDto;
    
    if (studentId && studentId !== transaction.student.id) {
        const student = await this.studentRepository.findOne({ where: { id: studentId, schoolId: schoolId as any } });
        if (!student) throw new NotFoundException('New student not found');
        transaction.student = student;
    }

    Object.assign(transaction, updates);
    const saved = await this.transactionsRepository.save(transaction);
    return this.mapTransactionToDto(saved);
  }

  async remove(id: string, schoolId: string): Promise<void> {
    const result = await this.transactionsRepository.delete({ id, schoolId: schoolId as any });
    if (result.affected === 0) throw new NotFoundException('Transaction not found');
  }

  async exportTransactions(schoolId: string): Promise<string> {
      const transactions = await this.transactionsRepository.find({
          where: { schoolId: schoolId as any },
          relations: ['student'],
          order: { date: 'DESC' }
      });

      const data = transactions.map(t => ({
          Date: t.date,
          Student: t.student ? t.student.name : 'Unknown',
          AdmissionNo: t.student ? t.student.admissionNumber : 'N/A',
          Type: t.type,
          Amount: t.amount,
          Description: t.description,
          Method: t.method || '',
          Reference: t.transactionCode || t.checkNumber || '',
      }));

      return CsvUtil.generate(data, ['Date', 'Student', 'AdmissionNo', 'Type', 'Amount', 'Description', 'Method', 'Reference']);
  }

  // --- M-Pesa Callback Handling ---
  async handleMpesaCallback(payload: any): Promise<any> {
      this.logger.log('Received M-Pesa Callback');

      const body = payload.Body.stkCallback;
      
      if (body.ResultCode !== 0) {
          this.logger.warn(`M-Pesa Transaction Failed: ${body.ResultDesc}`);
          return { status: 'failed', message: body.ResultDesc };
      }

      const metadata = body.CallbackMetadata.Item;
      const amountItem = metadata.find((i: any) => i.Name === 'Amount');
      const receiptItem = metadata.find((i: any) => i.Name === 'MpesaReceiptNumber');
      const phoneItem = metadata.find((i: any) => i.Name === 'PhoneNumber');

      const amount = amountItem?.Value;
      const receipt = receiptItem?.Value;
      const rawPhone = phoneItem?.Value ? phoneItem.Value.toString() : '';
      const normalizedPhone = this.normalizePhone(rawPhone);

      // Log raw transaction
      const rawTrans = this.mpesaRepo.create({
          transactionType: 'STK Push',
          transID: receipt,
          transTime: new Date().toISOString(),
          transAmount: amount.toString(),
          businessShortCode: '174379',
          billRefNumber: 'STK_PUSH',
          msisdn: rawPhone,
          firstName: 'Unknown',
          lastName: 'Unknown',
          isProcessed: false
      });
      await this.mpesaRepo.save(rawTrans);

      // Auto-Reconcile
      const significantDigits = normalizedPhone.slice(-9); 
      
      const student = await this.studentRepository
        .createQueryBuilder('student')
        .where('student.guardianContact LIKE :phone', { phone: `%${significantDigits}` })
        .getOne();
      
      if (student) {
          const transaction = this.transactionsRepository.create({
              student: student,
              school: { id: student.schoolId } as any,
              type: TransactionType.Payment,
              date: new Date().toISOString().split('T')[0],
              description: 'M-Pesa Fee Payment (Auto)',
              amount: Number(amount),
              method: PaymentMethod.MPesa,
              transactionCode: receipt,
              checkStatus: 'Cleared'
          });
          await this.transactionsRepository.save(transaction);
          
          rawTrans.isProcessed = true;
          rawTrans.firstName = student.guardianName.split(' ')[0];
          await this.mpesaRepo.save(rawTrans);
          
          this.logger.log(`Auto-reconciled payment ${receipt} for student ${student.name}`);
          
          // EMIT REAL-TIME EVENT
          this.eventsGateway.server.emit('payment_received', {
              studentName: student.name,
              amount: Number(amount),
              receipt,
              timestamp: new Date().toISOString(),
              schoolId: student.schoolId
          });

      } else {
          this.logger.warn(`Could not auto-reconcile payment ${receipt}. Phone ${rawPhone} matched no guardian.`);
      }

      return { status: 'success' };
  }
}
