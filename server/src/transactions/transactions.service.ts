
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository, Like } from 'typeorm';
import { Transaction, TransactionType, PaymentMethod } from '../entities/transaction.entity';
import { GetTransactionsDto } from './dto/get-transactions.dto';
import { Student } from '../entities/student.entity';
import { MpesaC2BTransaction } from '../entities/mpesa-c2b.entity';
import { Subscription, SubscriptionStatus, SubscriptionPlan } from '../entities/subscription.entity';
import { School } from '../entities/school.entity';
import { SubscriptionPayment } from '../entities/subscription-payment.entity';
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
    @InjectRepository(Subscription)
    private subRepo: Repository<Subscription>,
    @InjectRepository(SubscriptionPayment)
    private subPaymentRepo: Repository<SubscriptionPayment>,
    private eventsGateway: EventsGateway,
  ) {}

  // ... (mapTransactionToDto and other helper methods)

  async handleMpesaCallback(payload: any): Promise<any> {
      this.logger.log('Received M-Pesa Callback');

      const body = payload.Body.stkCallback;
      const checkoutID = body.CheckoutRequestID;
      
      if (body.ResultCode !== 0) {
          this.logger.warn(`M-Pesa Transaction Failed [${checkoutID}]: ${body.ResultDesc}`);
          return { status: 'failed', message: body.ResultDesc };
      }

      const metadata = body.CallbackMetadata.Item;
      const amount = metadata.find((i: any) => i.Name === 'Amount')?.Value;
      const receipt = metadata.find((i: any) => i.Name === 'MpesaReceiptNumber')?.Value;
      const rawPhone = metadata.find((i: any) => i.Name === 'PhoneNumber')?.Value?.toString() || '';
      
      let rawTrans = await this.mpesaRepo.findOne({ where: { transID: checkoutID } });
      if (!rawTrans) {
           rawTrans = this.mpesaRepo.create({
                transID: receipt,
                transactionType: 'STK Push Callback',
                transAmount: amount.toString(),
                msisdn: rawPhone,
                isProcessed: false
           });
      }

      const accountRef = rawTrans.billRefNumber || 'UNKNOWN';

      // --- BRANCH LOGIC: PLATFORM SUB / UPGRADE vs STUDENT FEE ---
      
      if (accountRef.startsWith('SUB_') || accountRef.startsWith('UPG_')) {
          const isUpgrade = accountRef.startsWith('UPG_');
          const parts = accountRef.split('_'); // [PREFIX, PLAN_KEY, SCHOOL_PART]
          const planKey = parts[1];
          const schoolIdPart = parts[2];

          const school = await this.subRepo.manager.getRepository(School).createQueryBuilder('school')
            .leftJoinAndSelect('school.subscription', 'subscription')
            .where('school.id LIKE :id', { id: `${schoolIdPart}%` })
            .getOne();

          if (school && school.subscription) {
              const sub = school.subscription;
              
              // If it was an upgrade request, map the plan key back to the Enum
              if (isUpgrade) {
                  if (planKey === 'PREM') sub.plan = SubscriptionPlan.PREMIUM;
                  else if (planKey === 'BASI') sub.plan = SubscriptionPlan.BASIC;
                  this.logger.log(`Upgrading School ${school.name} to ${sub.plan}`);
              }

              sub.status = SubscriptionStatus.ACTIVE;
              const newEndDate = new Date(sub.endDate > new Date() ? sub.endDate : new Date());
              newEndDate.setMonth(newEndDate.getMonth() + 1); 
              sub.endDate = newEndDate;
              await this.subRepo.save(sub);

              const subPayment = this.subPaymentRepo.create({
                  school,
                  amount: Number(amount),
                  transactionCode: receipt,
                  paymentDate: new Date().toISOString().split('T')[0],
                  paymentMethod: 'M-Pesa'
              });
              await this.subPaymentRepo.save(subPayment);

              rawTrans.isProcessed = true;
              await this.mpesaRepo.save(rawTrans);
              
              this.eventsGateway.server.emit('subscription_renewed', { schoolId: school.id, status: 'ACTIVE', plan: sub.plan });
              return { status: 'success' };
          }
      }

      // --- FALLBACK: STUDENT FEE RECONCILE (Existing logic) ---
      const significantDigits = rawPhone.slice(-9); 
      const student = await this.studentRepository.createQueryBuilder('student')
        .where('student.guardianContact LIKE :phone', { phone: `%${significantDigits}` })
        .getOne();
      
      if (student) {
          const transaction = this.transactionsRepository.create({
              student,
              schoolId: student.schoolId,
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
          await this.mpesaRepo.save(rawTrans);
          
          this.eventsGateway.server.emit('payment_received', {
              studentName: student.name,
              amount: Number(amount),
              receipt,
              schoolId: student.schoolId
          });
      }

      return { status: 'success' };
  }
  
  // (Rest of the service remains identical)
  private mapTransactionToDto(transaction: Transaction): any {
    if (!transaction) return null;
    return {
      ...transaction,
      studentName: transaction.student?.name,
      studentId: transaction.studentId || transaction.student?.id,
    };
  }

  async create(createTransactionDto: Omit<Transaction, 'id'>, schoolId: string): Promise<Transaction> {
    const student = await this.studentRepository.findOne({ where: { id: (createTransactionDto as any).studentId, schoolId: schoolId as any } });
    if (!student) throw new NotFoundException('Student not found');
    const transaction = this.transactionsRepository.create({ ...createTransactionDto, student, schoolId: schoolId as any });
    const saved = await this.transactionsRepository.save(transaction);
    return this.mapTransactionToDto(saved);
  }

  async createBatch(createTransactionDtos: Omit<Transaction, 'id'>[], schoolId: string): Promise<Transaction[]> {
    const savedTransactions: Transaction[] = [];
    for (const dto of createTransactionDtos) {
      try {
        const saved = await this.create(dto, schoolId);
        savedTransactions.push(saved);
      } catch (error) {
        this.logger.error(`Failed to create batch transaction`, error);
      }
    }
    return savedTransactions;
  }

  async findAll(query: GetTransactionsDto, schoolId: string): Promise<any> {
    const { page = 1, limit = 10, search, startDate, endDate, type, studentId, pagination } = query;
    const qb = this.transactionsRepository.createQueryBuilder('transaction');
    qb.leftJoinAndSelect('transaction.student', 'student');
    qb.where('transaction.schoolId = :schoolId', { schoolId });
    if (search) qb.andWhere('(transaction.description LIKE :search OR transaction.transactionCode LIKE :search OR student.name LIKE :search)', { search: `%${search}%` });
    if (startDate) qb.andWhere('transaction.date >= :startDate', { startDate });
    if (endDate) qb.andWhere('transaction.date <= :endDate', { endDate });
    if (type) qb.andWhere('transaction.type = :type', { type });
    if (studentId) qb.andWhere('transaction.studentId = :studentId', { studentId });
    qb.orderBy('transaction.date', 'DESC');
    if (pagination === 'false') return (await qb.getMany()).map(t => this.mapTransactionToDto(t));
    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);
    const [transactions, total] = await qb.getManyAndCount();
    return { data: transactions.map(t => this.mapTransactionToDto(t)), total, page, limit, last_page: Math.ceil(total / limit) };
  }

  async exportTransactions(schoolId: string): Promise<string> {
    const transactions = await this.transactionsRepository.find({ where: { schoolId: schoolId as any }, relations: ['student'], order: { date: 'DESC' } });
    const data = transactions.map(t => ({ Date: t.date, Student: t.student?.name || 'N/A', Type: t.type, Description: t.description, Amount: t.amount, Method: t.method || '', Reference: t.transactionCode || '' }));
    return CsvUtil.generate(data, ['Date', 'Student', 'Type', 'Description', 'Amount', 'Method', 'Reference']);
  }

  async update(id: string, updateDto: Partial<Transaction>, schoolId: string): Promise<Transaction> {
    const transaction = await this.transactionsRepository.findOne({ where: { id, schoolId: schoolId as any } });
    if (!transaction) throw new NotFoundException(`Transaction not found`);
    Object.assign(transaction, updateDto);
    const saved = await this.transactionsRepository.save(transaction);
    return this.mapTransactionToDto(saved);
  }

  async remove(id: string, schoolId: string): Promise<void> {
    const result = await this.transactionsRepository.delete({ id, schoolId: schoolId as any });
    if (result.affected === 0) throw new NotFoundException(`Transaction not found`);
  }
}
