import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, DeepPartial, Like } from 'typeorm';
import { Transaction, TransactionType } from '../entities/transaction.entity';
import { Student } from '../entities/student.entity';
import { GetTransactionsDto } from './dto/get-transactions.dto';
import { DarajaSetting } from '../entities/daraja-setting.entity';
import { PlatformSetting } from '../entities/platform-setting.entity';
import { SubscriptionPayment, SubscriptionPaymentStatus } from '../entities/subscription-payment.entity';
import { School } from '../entities/school.entity';
import { Subscription, SubscriptionStatus } from '../entities/subscription.entity';
import { CommunicationsService } from '../communications/communications.service';
import axios from 'axios';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    @InjectRepository(Transaction) private transRepo: Repository<Transaction>,
    @InjectRepository(Student) private studentRepo: Repository<Student>,
    @InjectRepository(DarajaSetting) private darajaRepo: Repository<DarajaSetting>,
    @InjectRepository(PlatformSetting) private platformRepo: Repository<PlatformSetting>,
    @InjectRepository(SubscriptionPayment) private subPaymentRepo: Repository<SubscriptionPayment>,
    @InjectRepository(School) private schoolRepo: Repository<School>,
    @InjectRepository(Subscription) private subRepo: Repository<Subscription>,
    private communicationsService: CommunicationsService,
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

  private async getAccessToken(credentials: { consumerKey: string, consumerSecret: string }, environment: 'sandbox' | 'production'): Promise<string> {
    const auth = Buffer.from(`${credentials.consumerKey}:${credentials.consumerSecret}`).toString('base64');
    const url = environment === 'production' 
        ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
        : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
    
    try {
      const response = await axios.get(url, {
        headers: { Authorization: `Basic ${auth}` }
      });
      return response.data.access_token;
    } catch (error: any) {
      this.logger.error(`[Daraja] OAuth Error (${environment}): ${error.response?.data?.errorMessage || error.message}`);
      throw new BadRequestException(`M-Pesa Authentication failed: ${error.response?.data?.errorMessage || error.message}`);
    }
  }

  async initiateStkPush(amount: number, phone: string, ref: string, schoolId: string, isSubscription = false) {
      let credentials;
      let shortCode;
      let passkey;
      let environment: 'sandbox' | 'production' = 'sandbox';
      const callbackUrl = `${process.env.APP_URL || 'http://localhost:3000'}/api/mpesa/callback`;

      if (isSubscription) {
          const platform = await this.platformRepo.findOne({ where: {} });
          if (!platform || !platform.mpesaConsumerKey) throw new BadRequestException('Platform M-Pesa is not configured.');
          credentials = { consumerKey: platform.mpesaConsumerKey, consumerSecret: platform.mpesaConsumerSecret };
          shortCode = platform.mpesaPaybill;
          passkey = platform.mpesaPasskey;
          environment = platform.mpesaEnvironment || 'sandbox';
      } else {
          const daraja = await this.darajaRepo.findOne({ where: { schoolId: schoolId as any } });
          if (!daraja || !daraja.consumerKey) throw new BadRequestException('M-Pesa is not configured for this school.');
          credentials = { consumerKey: daraja.consumerKey, consumerSecret: daraja.consumerSecret };
          shortCode = daraja.shortCode;
          passkey = daraja.passkey;
          environment = daraja.environment || 'sandbox';
      }

      const token = await this.getAccessToken(credentials, environment);
      const timestamp = new Date().toISOString().replace(/[-:T]/g, '').split('.')[0];
      const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');

      const payload = {
          BusinessShortCode: shortCode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: "CustomerPayBillOnline",
          Amount: Math.round(amount),
          PartyA: phone,
          PartyB: shortCode,
          PhoneNumber: phone,
          CallBackURL: callbackUrl,
          AccountReference: ref.substring(0, 12),
          TransactionDesc: isSubscription ? "Saaslink License" : "School Fee Payment"
      };

      const stkUrl = environment === 'production'
          ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
          : 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

      try {
          const response = await axios.post(stkUrl, payload, {
              headers: { Authorization: `Bearer ${token}` }
          });
          
          if (isSubscription) {
              await this.subPaymentRepo.save({
                  schoolId,
                  amount,
                  transactionCode: ref,
                  paymentDate: new Date().toISOString().split('T')[0],
                  paymentMethod: 'MPESA',
                  status: SubscriptionPaymentStatus.PENDING,
                  gatewayResponse: JSON.stringify(response.data)
              });
          }

          return response.data;
      } catch (error: any) {
          this.logger.error(`[Daraja] STK Push Error (${environment}): ${error.response?.data?.errorMessage || error.message}`);
          throw new BadRequestException(error.response?.data?.errorMessage || 'M-Pesa STK Push failed.');
      }
  }

  async handleMpesaCallback(payload: any) {
    const { Body } = payload;
    if (!Body || !Body.stkCallback) return { ResultCode: 1, ResultDesc: "Invalid Payload" };

    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = Body.stkCallback;

    if (ResultCode === 0) {
        const metadata = CallbackMetadata.Item;
        const amount = metadata.find(i => i.Name === 'Amount')?.Value;
        const mpesaCode = metadata.find(i => i.Name === 'MpesaReceiptNumber')?.Value;
        
        this.logger.log(`[Daraja] Payment Success: ${mpesaCode} for KES ${amount}`);

        const subPayment = await this.subPaymentRepo.findOne({ 
            where: [
                { gatewayResponse: Like(`%${CheckoutRequestID}%`) },
                { gatewayResponse: Like(`%${MerchantRequestID}%`) }
            ],
            relations: ['school', 'school.subscription', 'school.users']
        });

        if (subPayment) {
            await this.processSubscriptionPayment(subPayment, mpesaCode, amount);
        }
    } else {
        this.logger.warn(`[Daraja] Payment Failed: ${ResultDesc}`);
    }

    return { ResultCode: 0, ResultDesc: "Accepted" };
  }

  private async processSubscriptionPayment(payment: SubscriptionPayment, mpesaCode: string, amount: number) {
      if (payment.status === SubscriptionPaymentStatus.APPLIED) return;

      await this.entityManager.transaction(async manager => {
          payment.status = SubscriptionPaymentStatus.CONFIRMED;
          payment.transactionCode = mpesaCode;
          await manager.save(payment);

          const school = payment.school;
          const subscription = school.subscription;

          if (subscription) {
              const now = new Date();
              const currentEndDate = new Date(subscription.endDate);
              const isExpired = currentEndDate < now || subscription.status === SubscriptionStatus.EXPIRED;
              
              const baseDate = isExpired ? now : currentEndDate;
              const monthsToAdd = subscription.billingCycle === 'ANNUALLY' ? 12 : 1;
              
              const newEndDate = new Date(baseDate);
              newEndDate.setMonth(newEndDate.getMonth() + monthsToAdd);

              await manager.update(Subscription, subscription.id, {
                  status: SubscriptionStatus.ACTIVE,
                  plan: payment.targetPlan, 
                  endDate: newEndDate,
                  updatedAt: new Date()
              });

              payment.status = SubscriptionPaymentStatus.APPLIED;
              await manager.save(payment);

              const admin = school.users.find(u => u.role === 'Admin');
              if (admin) {
                  await this.communicationsService.sendEmail(
                      admin.email,
                      'Institutional Access Restored - Saaslink',
                      `<h1>Verification Complete</h1><p>The M-Pesa payment <strong>${mpesaCode}</strong> for <strong>${school.name}</strong> has been confirmed. Your portal is now active until ${newEndDate.toLocaleDateString()}.</p>`
                  );
              }
          }
      });
  }

  async handleStripeWebhook(payload: any, signature: string) {
    this.logger.log('Stripe Webhook Received');
  }
}
