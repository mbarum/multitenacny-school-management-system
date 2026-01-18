import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, DeepPartial } from 'typeorm';
import { Transaction, TransactionType } from '../entities/transaction.entity';
import { Student } from '../entities/student.entity';
import { GetTransactionsDto } from './dto/get-transactions.dto';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    @InjectRepository(Transaction) private transRepo: Repository<Transaction>,
    @InjectRepository(Student) private studentRepo: Repository<Student>,
    private readonly entityManager: EntityManager,
  ) {}

  async findAll(query: GetTransactionsDto, schoolId: string): Promise<any> {
    const { page = 1, limit = 10, search, startDate, endDate, type, studentId, pagination } = query;
    
    const qb = this.transRepo.createQueryBuilder('t')
        .leftJoinAndSelect('t.student', 'student')
        .where('t.schoolId = :schoolId', { schoolId });

    if (search) {
        qb.andWhere('(t.transactionCode LIKE :search OR t.description LIKE :search OR student.name LIKE :search)', { search: `%${search}%` });
    }
    if (startDate) qb.andWhere('t.date >= :startDate', { startDate });
    if (endDate) qb.andWhere('t.date <= :endDate', { endDate });
    if (type) qb.andWhere('t.type = :type', { type });
    if (studentId) qb.andWhere('t.studentId = :studentId', { studentId });

    qb.orderBy('t.date', 'DESC').addOrderBy('t.createdAt', 'DESC');

    if (pagination === 'false') {
        return { data: await qb.getMany() };
    }

    const [data, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();

    return {
        data: data.map(t => ({ ...t, studentName: t.student?.name })),
        total,
        page,
        limit,
        last_page: Math.ceil(total / limit)
    };
  }

  async create(dto: any, schoolId: string): Promise<Transaction> {
    const student = await this.studentRepo.findOne({ where: { id: dto.studentId, schoolId: schoolId as any } });
    if (!student) throw new NotFoundException('Student record not found in your school');

    // FIX: Use DeepPartial<Transaction> and create as a single object explicitly.
    const transData: DeepPartial<Transaction> = {
        type: dto.type,
        date: dto.date,
        description: dto.description,
        amount: dto.amount,
        method: dto.method,
        transactionCode: dto.transactionCode,
        checkNumber: dto.checkNumber,
        checkBank: dto.checkBank,
        checkStatus: dto.checkStatus,
        schoolId,
        student: { id: student.id }
    };
    
    const transaction = this.transRepo.create(transData);
    return this.transRepo.save(transaction);
  }

  async createBatch(dtos: any[], schoolId: string): Promise<Transaction[]> {
      return this.entityManager.transaction(async manager => {
          const results: Transaction[] = [];
          for (const dto of dtos) {
              const trans = manager.create(Transaction, { ...dto, schoolId });
              results.push(await manager.save(trans));
          }
          return results;
      });
  }

  async update(id: string, dto: any, schoolId: string): Promise<Transaction> {
      const trans = await this.transRepo.findOne({ where: { id, schoolId: schoolId as any } });
      if (!trans) throw new NotFoundException();
      Object.assign(trans, dto);
      return this.transRepo.save(trans);
  }

  async remove(id: string, schoolId: string): Promise<void> {
      const result = await this.transRepo.delete({ id, schoolId: schoolId as any });
      if (result.affected === 0) throw new NotFoundException();
  }

  async initiateStkPush(amount: number, phone: string, ref: string, schoolId: string) {
      this.logger.log(`[Daraja] STK Push initiated: ${amount} to ${phone} (Ref: ${ref})`);
      return { ResponseCode: "0", CustomerMessage: "Success. Please check your phone to enter M-Pesa PIN." };
  }

  async handleMpesaCallback(payload: any) {
    this.logger.log('M-Pesa Callback Received');
    return { ResultCode: 0, ResultDesc: "Accepted" };
  }

  async handleStripeWebhook(payload: any, signature: string) {
    this.logger.log('Stripe Webhook Received');
  }
}
