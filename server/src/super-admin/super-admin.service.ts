import { Injectable, NotFoundException, Logger, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { School } from '../entities/school.entity';
import { Subscription, SubscriptionStatus, SubscriptionPlan } from '../entities/subscription.entity';
import { SubscriptionPayment, SubscriptionPaymentStatus } from '../entities/subscription-payment.entity';
import { CommunicationsService } from '../communications/communications.service';

@Injectable()
export class SuperAdminService {
  private readonly logger = new Logger('SuperAdminService');

  constructor(
    @InjectRepository(School) private schoolRepo: Repository<School>,
    @InjectRepository(Subscription) private subRepo: Repository<Subscription>,
    @InjectRepository(SubscriptionPayment) private paymentRepo: Repository<SubscriptionPayment>,
    private communicationsService: CommunicationsService,
    private entityManager: EntityManager,
  ) {}

  async initiatePayment(schoolId: string, data: { amount: number, method: string, plan: SubscriptionPlan, transactionCode: string }) {
      const school = await this.schoolRepo.findOne({ where: { id: schoolId } });
      if (!school) throw new NotFoundException("School not found");

      const payment = this.paymentRepo.create({
          school,
          amount: data.amount,
          paymentMethod: data.method,
          targetPlan: data.plan,
          transactionCode: data.transactionCode,
          paymentDate: new Date().toISOString(),
          status: SubscriptionPaymentStatus.PENDING
      });

      return this.paymentRepo.save(payment);
  }

  async recordManualPayment(schoolId: string, data: { amount: number, transactionCode: string, date: string, method: string, plan?: SubscriptionPlan }) {
      this.logger.log(`[Billing] Validating transfer for School ${schoolId}. Ref: ${data.transactionCode}`);
      
      const existing = await this.paymentRepo.findOne({ where: { transactionCode: data.transactionCode } });
      if (existing && existing.status === SubscriptionPaymentStatus.APPLIED) {
          throw new BadRequestException("Transaction reference has already been applied.");
      }

      return await this.entityManager.transaction(async manager => {
          const school = await manager.findOne(School, { 
              where: { id: schoolId }, 
              relations: ['subscription', 'users'] 
          });
          
          if (!school) throw new NotFoundException("School context not found");
          const subscription = school.subscription;

          const payment = existing || manager.create(SubscriptionPayment, {
              school,
              amount: data.amount,
              transactionCode: data.transactionCode,
              paymentDate: data.date,
              paymentMethod: data.method,
              targetPlan: data.plan || (subscription ? subscription.plan : SubscriptionPlan.BASIC)
          });
          payment.status = SubscriptionPaymentStatus.CONFIRMED;
          await manager.save(payment);

          if (subscription) {
              const now = new Date();
              const currentEndDate = new Date(subscription.endDate);
              const isExpired = currentEndDate < now || subscription.status === SubscriptionStatus.EXPIRED;
              const baseDate = isExpired ? now : currentEndDate;
              
              const daysToAdd = subscription.billingCycle === 'ANNUALLY' ? 365 : 30;
              const newEndDate = new Date(baseDate);
              newEndDate.setDate(newEndDate.getDate() + daysToAdd);

              await manager.update(Subscription, subscription.id, {
                  status: SubscriptionStatus.ACTIVE,
                  plan: payment.targetPlan, 
                  endDate: newEndDate,
                  updatedAt: new Date()
              });

              payment.status = SubscriptionPaymentStatus.APPLIED;
              await manager.save(payment);
          }

          const admin = school.users.find(u => u.role === 'Admin');
          if (admin) {
              await this.communicationsService.sendEmail(
                  admin.email,
                  'License Upgrade Successful',
                  `<h1>License Active</h1><p>Your institutional portal has been upgraded to <strong>${payment.targetPlan}</strong>.</p>`
              );
          }

          return { success: true, status: SubscriptionPaymentStatus.APPLIED, plan: payment.targetPlan };
      });
  }

  async findAllSchools() { return this.schoolRepo.find({ relations: ['subscription'] }); }
  async getPlatformStats() { return { totalSchools: await this.schoolRepo.count() }; }
  async getSystemHealth() { return { status: 'ok' }; }
  async updatePricing(s: any) { return s; }
  async updateSubscription(id: string, d: any) { return d; }
  async getSubscriptionPayments() { return this.paymentRepo.find({ relations: ['school'], order: { createdAt: 'DESC' } }); }
  async updateSchoolEmail(id: string, e: string) { return e; }
  async updateSchoolPhone(id: string, p: string) { return p; }
}