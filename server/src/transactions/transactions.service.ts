
import { Injectable, NotFoundException, BadRequestException, Logger, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, DeepPartial } from 'typeorm';
import { Transaction, TransactionType, PaymentMethod } from '../entities/transaction.entity';
import { GetTransactionsDto } from './dto/get-transactions.dto';
import { Student } from '../entities/student.entity';
import { MpesaC2BTransaction } from '../entities/mpesa-c2b.entity';
import { Subscription, SubscriptionStatus, SubscriptionPlan } from '../entities/subscription.entity';
import { School } from '../entities/school.entity';
import { SubscriptionPayment } from '../entities/subscription-payment.entity';
import { DarajaSetting } from '../entities/daraja-setting.entity';
import { PlatformSetting } from '../entities/platform-setting.entity';
import { EventsGateway } from '../events/events.gateway';
import axios from 'axios';
import Stripe from 'stripe';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    @InjectRepository(Transaction) private transactionsRepository: Repository<Transaction>,
    @InjectRepository(Student) private studentRepository: Repository<Student>,
    @InjectRepository(MpesaC2BTransaction) private mpesaRepo: Repository<MpesaC2BTransaction>,
    @InjectRepository(Subscription) private subRepo: Repository<Subscription>,
    @InjectRepository(SubscriptionPayment) private subPaymentRepo: Repository<SubscriptionPayment>,
    @InjectRepository(DarajaSetting) private darajaRepo: Repository<DarajaSetting>,
    @InjectRepository(PlatformSetting) private platformRepo: Repository<PlatformSetting>,
    private eventsGateway: EventsGateway,
  ) {}

  async initiateStkPush(amount: number, phone: string, accountReference: string, schoolId: string) {
      // 1. Get Credentials
      // If it's a platform sub (Starts with SUB_ or UPG_), use Platform Settings (Super Admin's Paybill)
      // Otherwise, use the school's specific Daraja settings
      let config;
      if (accountReference.startsWith('SUB_') || accountReference.startsWith('UPG_')) {
          config = await this.platformRepo.findOne({ where: {} });
      } else {
          config = await this.darajaRepo.findOne({ where: { schoolId: schoolId as any } });
      }

      if (!config || !config.consumerKey || !config.paybillNumber) {
          throw new BadRequestException('M-Pesa integration is not configured for this operation.');
      }

      // 2. Log intent
      const pending = this.mpesaRepo.create({
          transID: `STK_${Date.now()}`,
          transactionType: 'STK_PUSH_INIT',
          transAmount: amount.toString(),
          msisdn: phone,
          billRefNumber: accountReference,
          isProcessed: false
      });
      await this.mpesaRepo.save(pending);

      this.logger.log(`Initiated STK Push for ${accountReference} - Amount: ${amount}`);
      
      // In a real implementation, you would perform the OAuth call and then the STK Push call to Safaricom here.
      // For this demo environment, we simulate a successful trigger.
      return {
          CustomerMessage: "Success. Request accepted for processing. Enter PIN on your phone.",
          CheckoutRequestID: pending.transID,
          ResponseCode: "0"
      };
  }

  // Added missing handleMpesaCallback to resolve TransactionsController error
  async handleMpesaCallback(payload: any) {
    this.logger.log(`Received M-Pesa Callback: ${JSON.stringify(payload)}`);
    const { Body } = payload;
    if (!Body || !Body.stkCallback) return { ResultCode: 1, ResultDesc: 'Invalid payload' };

    const { CheckoutRequestID, ResultCode, CallbackMetadata } = Body.stkCallback;

    if (ResultCode === 0 && CallbackMetadata) {
        // Find the pending transaction recorded during initiateStkPush
        const mpesaTrans = await this.mpesaRepo.findOne({ where: { transID: CheckoutRequestID } });
        if (mpesaTrans && !mpesaTrans.isProcessed) {
            const amount = CallbackMetadata.Item.find((i: any) => i.Name === 'Amount')?.Value;
            const receipt = CallbackMetadata.Item.find((i: any) => i.Name === 'MpesaReceiptNumber')?.Value;
            
            mpesaTrans.isProcessed = true;
            await this.mpesaRepo.save(mpesaTrans);

            // Handle platform subscriptions if ref starts with SUB_ or UPG_
            if (mpesaTrans.billRefNumber.startsWith('SUB_') || mpesaTrans.billRefNumber.startsWith('UPG_')) {
                // Platform level handling logic (Subscription update etc) would go here
            } else {
                // Student Fee Payment handling
                const student = await this.studentRepository.findOne({ 
                    where: { admissionNumber: mpesaTrans.billRefNumber } 
                });
                
                if (student) {
                    const transaction = this.transactionsRepository.create({
                        student,
                        studentId: student.id,
                        schoolId: student.schoolId,
                        amount: parseFloat(amount),
                        date: new Date().toISOString().split('T')[0],
                        description: 'M-Pesa Fee Payment',
                        type: TransactionType.Payment,
                        method: PaymentMethod.MPesa,
                        transactionCode: receipt
                    });
                    await this.transactionsRepository.save(transaction);
                    
                    // Notify frontend via WebSocket
                    this.eventsGateway.emitToSchool(student.schoolId, 'payment_confirmed', { 
                        studentId: student.id, 
                        amount: parseFloat(amount),
                        receipt 
                    });
                }
            }
        }
    }

    return { ResultCode: 0, ResultDesc: 'Success' };
  }

  async handleStripeWebhook(payload: any, signature: string) {
      const platformSettings = await this.platformRepo.findOne({ where: {} });
      if (!platformSettings?.stripeSecretKey) return;

      const stripe = new Stripe(platformSettings.stripeSecretKey, { apiVersion: '2023-10-16' });
      let event: Stripe.Event;

      try {
          event = stripe.webhooks.constructEvent(payload, signature, platformSettings.stripeWebhookSecret);
      } catch (err) {
          throw new BadRequestException(`Webhook Error: ${err.message}`);
      }

      if (event.type === 'payment_intent.succeeded') {
          const intent = event.data.object as Stripe.PaymentIntent;
          const { schoolId, plan, billingCycle } = intent.metadata;

          if (schoolId) {
              const school = await this.subRepo.manager.getRepository(School).findOne({ 
                  where: { id: schoolId },
                  relations: ['subscription'] 
              });

              if (school && school.subscription) {
                  const sub = school.subscription;
                  sub.status = SubscriptionStatus.ACTIVE;
                  sub.plan = plan as SubscriptionPlan;
                  const newEndDate = new Date();
                  newEndDate.setDate(newEndDate.getDate() + (billingCycle === 'ANNUALLY' ? 365 : 30));
                  sub.endDate = newEndDate;
                  await this.subRepo.save(sub);

                  const payment = this.subPaymentRepo.create({
                      school,
                      amount: intent.amount / 100,
                      transactionCode: intent.id,
                      paymentDate: new Date().toISOString().split('T')[0],
                      paymentMethod: 'Stripe Card'
                  });
                  await this.subPaymentRepo.save(payment);

                  this.eventsGateway.server.emit('subscription_activated', { schoolId, plan });
              }
          }
      }
  }

  // (Standard CRUD methods unchanged)
  async findAll(query: GetTransactionsDto, schoolId: string): Promise<any> {
    const { page = 1, limit = 10, search, startDate, endDate } = query;
    const qb = this.transactionsRepository.createQueryBuilder('t');
    qb.leftJoinAndSelect('t.student', 'student');
    qb.where('t.schoolId = :schoolId', { schoolId });
    if (search) qb.andWhere('(t.description LIKE :s OR t.transactionCode LIKE :s OR student.name LIKE :s)', { s: `%${search}%` });
    if (startDate) qb.andWhere('t.date >= :startDate', { startDate });
    if (endDate) qb.andWhere('t.date <= :endDate', { endDate });
    qb.orderBy('t.date', 'DESC');
    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);
    const [data, total] = await qb.getManyAndCount();
    return { data: data.map(t => ({ ...t, studentName: t.student?.name })), total, page, limit, last_page: Math.ceil(total / limit) };
  }

  async create(dto: any, schoolId: string) {
      const student = await this.studentRepository.findOne({ where: { id: dto.studentId, schoolId: schoolId as any } });
      const transaction = this.transactionsRepository.create({ ...dto, student, schoolId: schoolId as any });
      return this.transactionsRepository.save(transaction);
  }

  async createBatch(dtos: any[], schoolId: string) {
      const results = [];
      for (const dto of dtos) {
          results.push(await this.create(dto, schoolId));
      }
      return results;
  }
}
