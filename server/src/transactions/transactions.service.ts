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

  async initiateStkPush(amount: number, phone: string, ref: string, schoolId?: string | null, isSubscription = false) {
      let credentials: { consumerKey: string; consumerSecret: string } | null = null;
      let shortCode = '';
      let passkey = '';
      let environment: 'sandbox' | 'production' = 'sandbox';
      let customCallbackUrl: string | undefined;

      // Normalize Kenyan phone number: 254XXXXXXXXX
      let cleanPhone = (phone || '').replace(/\D/g, '');
      if (cleanPhone.startsWith('0')) {
          cleanPhone = '254' + cleanPhone.slice(1);
      } else if (cleanPhone.startsWith('254')) {
          // already formatted
      } else if (cleanPhone.length === 9) {
          cleanPhone = '254' + cleanPhone;
      }

      if (cleanPhone.length !== 12 || !cleanPhone.startsWith('254')) {
          throw new BadRequestException(`Invalid M-Pesa phone number: "${phone}". Please enter a valid number (e.g. 0712345678 or 254712345678).`);
      }

      if (isSubscription) {
          const platform = await this.platformRepo.findOne({ where: {} });
          const consumerKey = platform?.mpesaConsumerKey || process.env.MPESA_CONSUMER_KEY;
          const consumerSecret = platform?.mpesaConsumerSecret || process.env.MPESA_CONSUMER_SECRET;
          const paybill = platform?.mpesaPaybill || platform?.mpesaShortcode || process.env.MPESA_PAYBILL || process.env.MPESA_SHORTCODE;
          const pk = platform?.mpesaPasskey || process.env.MPESA_PASSKEY;
          const env = (platform?.mpesaEnvironment || process.env.MPESA_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production';
          customCallbackUrl = platform?.mpesaCallbackUrl;

          if (!consumerKey || !consumerSecret || !paybill || !pk) {
              this.logger.warn('[M-Pesa STK] Incomplete M-Pesa platform credentials in SuperAdmin settings or .env');
              throw new BadRequestException('Platform M-Pesa is not configured. Please enter Consumer Key, Consumer Secret, Paybill, and Passkey in Super Admin Platform Settings.');
          }
          credentials = { consumerKey, consumerSecret };
          shortCode = paybill;
          passkey = pk;
          environment = env;
      } else {
          if (!schoolId) throw new BadRequestException('School ID is required for school fee M-Pesa payments.');
          const daraja = await this.darajaRepo.findOne({ where: { schoolId: schoolId as any } });
          if (!daraja || !daraja.consumerKey) throw new BadRequestException('M-Pesa is not configured for this school.');
          credentials = { consumerKey: daraja.consumerKey, consumerSecret: daraja.consumerSecret };
          shortCode = daraja.shortCode;
          passkey = daraja.passkey;
          environment = daraja.environment || 'sandbox';
      }

      const callbackUrl = (customCallbackUrl && customCallbackUrl.trim() !== '')
          ? customCallbackUrl.trim()
          : `${process.env.APP_URL || 'https://emis.saaslink.tech'}/api/mpesa/callback`;

      const token = await this.getAccessToken(credentials, environment);
      const timestamp = new Date().toISOString().replace(/[-:T]/g, '').split('.')[0];
      const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');

      const sanitizedRef = (ref || 'SAASLINK').replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 12);

      const payload = {
          BusinessShortCode: shortCode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: "CustomerPayBillOnline",
          Amount: Math.max(1, Math.round(amount)),
          PartyA: cleanPhone,
          PartyB: shortCode,
          PhoneNumber: cleanPhone,
          CallBackURL: callbackUrl,
          AccountReference: sanitizedRef,
          TransactionDesc: isSubscription ? "Saaslink License" : "School Fee Payment"
      };

      const stkUrl = environment === 'production'
          ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
          : 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

      this.logger.log(`[Daraja] Dispatching STK push to ${cleanPhone} for KES ${payload.Amount} (${environment})`);

      try {
          const response = await axios.post(stkUrl, payload, {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 25000
          });
          
          if (isSubscription) {
              const safeSchoolId = (schoolId && schoolId !== 'platform-test' && schoolId.length === 36) ? schoolId : null;
              await this.subPaymentRepo.save({
                  schoolId: safeSchoolId,
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
          const errorMsg = error.response?.data?.errorMessage || error.response?.data?.ResponseDescription || error.message;
          this.logger.error(`[Daraja] STK Push Error (${environment}): ${errorMsg}`);
          throw new BadRequestException(errorMsg || 'M-Pesa STK Push failed.');
      }
  }

  async handleMpesaCallback(payload: any) {
    const { Body } = payload;
    if (!Body || !Body.stkCallback) return { ResultCode: 1, ResultDesc: "Invalid Payload" };

    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = Body.stkCallback;

    if (ResultCode === 0) {
        const metadata = CallbackMetadata?.Item || [];
        const amount = metadata.find((i: any) => i.Name === 'Amount')?.Value;
        const mpesaCode = metadata.find((i: any) => i.Name === 'MpesaReceiptNumber')?.Value;
        
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
        this.logger.warn(`[Daraja] Payment Failed or Cancelled: ${ResultDesc}`);
    }

    return { ResultCode: 0, ResultDesc: "Accepted" };
  }

  private async processSubscriptionPayment(payment: SubscriptionPayment, mpesaCode: string, amount: number) {
      if (payment.status === SubscriptionPaymentStatus.APPLIED) return;

      await this.entityManager.transaction(async manager => {
          payment.status = SubscriptionPaymentStatus.CONFIRMED;
          payment.transactionCode = mpesaCode || payment.transactionCode;
          if (amount) payment.amount = Number(amount);
          await manager.save(payment);

          const school = payment.school;
          const subscription = school?.subscription;

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
                  plan: payment.targetPlan || subscription.plan, 
                  endDate: newEndDate,
                  updatedAt: new Date()
              });

              payment.status = SubscriptionPaymentStatus.APPLIED;
              await manager.save(payment);

              const admin = school.users?.find(u => u.role === 'Admin');
              if (admin) {
                  await this.communicationsService.sendEmail(
                      admin.email,
                      'Subscription Activated via M-Pesa',
                      `<h1>Payment Verified!</h1><p>Your M-Pesa payment <strong>${mpesaCode}</strong> of KES ${amount} has been confirmed. Your portal for <strong>${school.name}</strong> is active until ${newEndDate.toDateString()}.</p>`
                  ).catch(e => this.logger.error(`Failed to send M-Pesa receipt email: ${e.message}`));
              }
          }
      });
  }

  async handleStripeWebhook(payload: any, signature: string) {
    this.logger.log('Stripe Webhook Received');
  }
}
