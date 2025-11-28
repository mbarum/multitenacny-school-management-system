
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { Transaction, TransactionType, PaymentMethod } from '../entities/transaction.entity';
import { GetTransactionsDto } from './dto/get-transactions.dto';
import { Student } from '../entities/student.entity';
import { MpesaC2BTransaction } from '../entities/mpesa-c2b.entity';

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

  async create(createTransactionDto: any): Promise<any> {
    const { studentId, ...rest } = createTransactionDto;

    // Validate student existence to provide a clear error if missing
    const student = await this.studentRepository.findOne({ where: { id: studentId } });
    if (!student) {
        throw new NotFoundException(`Student with ID ${studentId} not found. Cannot create transaction.`);
    }

    // Create and save
    const transaction = this.transactionsRepository.create({
        ...rest,
        student: student
    } as DeepPartial<Transaction>);
    
    const savedTransaction = await this.transactionsRepository.save(transaction);

    // Reload with relations to return a complete object to the frontend
    const reloadedTransaction = await this.transactionsRepository.findOne({
        where: { id: savedTransaction.id },
        relations: ['student']
    });

    if (!reloadedTransaction) {
        throw new BadRequestException('Failed to retrieve created transaction.');
    }

    return this.mapTransactionToDto(reloadedTransaction);
  }

  async createBatch(createTransactionDtos: any[]): Promise<Transaction[]> {
    // For batch, we prioritize speed over individual reloading/mapping
    const transactions = createTransactionDtos.map(dto => {
        const { studentId, ...rest } = dto;
        return this.transactionsRepository.create({
            ...rest,
            student: { id: studentId }
        } as DeepPartial<Transaction>);
    });
    return this.transactionsRepository.save(transactions);
  }

  async findAll(query?: GetTransactionsDto): Promise<any> {
    const { page = 1, limit = 10, search, startDate, endDate, type, studentId, pagination } = query || {};
    
    const qb = this.transactionsRepository.createQueryBuilder('transaction');
    qb.leftJoinAndSelect('transaction.student', 'student');

    if (search) {
        qb.andWhere('(student.name LIKE :search OR transaction.description LIKE :search OR transaction.transactionCode LIKE :search)', { search: `%${search}%` });
    }

    if (studentId) {
        // Filter via relation alias since studentId column is removed
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
    qb.addOrderBy('transaction.id', 'DESC'); // Stable sort

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

  // --- M-Pesa Callback Handling ---
  async handleMpesaCallback(payload: any): Promise<any> {
      this.logger.log('Received M-Pesa Callback', JSON.stringify(payload));

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

      // Step 1: Log raw transaction
      const rawTrans = this.mpesaRepo.create({
          transactionType: 'STK Push',
          transID: receipt,
          transTime: new Date().toISOString(),
          transAmount: amount.toString(),
          businessShortCode: '174379', // Example
          billRefNumber: 'STK_PUSH',
          msisdn: rawPhone,
          firstName: 'Unknown',
          lastName: 'Unknown',
          isProcessed: false
      });
      await this.mpesaRepo.save(rawTrans);

      // Step 2: Attempt to Auto-Reconcile using robust phone matching
      // We look for students whose contact contains the main part of the number (last 9 digits)
      const significantDigits = normalizedPhone.slice(-9); 
      
      const student = await this.studentRepository
        .createQueryBuilder('student')
        .where('student.guardianContact LIKE :phone', { phone: `%${significantDigits}` })
        .getOne();
      
      if (student) {
          const transaction = this.transactionsRepository.create({
              student: student,
              type: TransactionType.Payment,
              date: new Date().toISOString().split('T')[0],
              description: 'M-Pesa Fee Payment (Auto)',
              amount: Number(amount),
              method: PaymentMethod.MPesa,
              transactionCode: receipt,
              checkStatus: 'Cleared'
          });
          await this.transactionsRepository.save(transaction);
          
          // Mark as processed
          rawTrans.isProcessed = true;
          rawTrans.firstName = student.guardianName.split(' ')[0]; // Approx name logic
          await this.mpesaRepo.save(rawTrans);
          
          this.logger.log(`Auto-reconciled payment ${receipt} for student ${student.name}`);
      } else {
          this.logger.warn(`Could not auto-reconcile payment ${receipt}. Phone ${rawPhone} matched no guardian.`);
      }

      return { status: 'success' };
  }
}
