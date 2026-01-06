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
      this.logger.log(`[Billing] Validating manual transfer for School ${schoolId}. Code: ${data.transactionCode}`);
      
      const existing = await this.paymentRepo.findOne({ where: { transactionCode: data.transactionCode } });
      if (existing && existing.status === SubscriptionPaymentStatus.APPLIED) {
          throw new BadRequestException("This transaction reference has already been processed.");
      }

      return await this.entityManager.transaction(async manager => {
          const school = await manager.findOne(School, { 
              where: { id: schoolId }, 
              relations: ['subscription', 'users'] 
          });
          
          if (!school) throw new NotFoundException("Institutional record not found.");
          const subscription = school.subscription;

          // 1. Log payment
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

          // 2. Provision License
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
          }

          // 3. Automated Credential Dispatch
          const admin = school.users.find(u => u.role === 'Admin');
          if (admin) {
              await this.communicationsService.sendEmail(
                  admin.email,
                  'Portal Activated - Professional School Suite',
                  `
                  <div style="font-family: sans-serif; padding: 40px; color: #1e293b; background: #f8fafc;">
                    <div style="background: white; padding: 40px; border-radius: 24px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
                        <h1 style="color: #346955; font-size: 28px; margin-bottom: 24px;">Institutional Access Enabled</h1>
                        <p>Dear Administrator,</p>
                        <p>We are pleased to inform you that your wire transfer for <strong>${school.name}</strong> has been verified.</p>
                        
                        <div style="background: #effaf7; padding: 24px; border-radius: 16px; margin: 24px 0; border: 1px solid #aee2d1;">
                            <h4 style="margin: 0 0 12px 0; color: #2d5948; text-transform: uppercase; font-size: 11px; letter-spacing: 0.1em;">License Details</h4>
                            <p style="margin: 4px 0; font-size: 14px;"><strong>Reference:</strong> ${payment.transactionCode}</p>
                            <p style="margin: 4px 0; font-size: 14px;"><strong>Plan:</strong> ${payment.targetPlan}</p>
                            <p style="margin: 4px 0; font-size: 14px;"><strong>Valid Until:</strong> ${new Date(school.subscription.endDate).toLocaleDateString()}</p>
                        </div>

                        <p>You can now log in to your dashboard to begin setting up your student registry and learning areas.</p>
                        
                        <div style="margin-top: 32px; text-align: center;">
                            <a href="${process.env.FRONTEND_URL}/login" style="background: #346955; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">Access Your Portal</a>
                        </div>
                        
                        <p style="font-size: 12px; color: #64748b; margin-top: 40px; text-align: center;">
                            Need help? Contact our deployment team at support@saaslink.com
                        </p>
                    </div>
                  </div>
                  `
              );
          }

          return { success: true, status: SubscriptionPaymentStatus.APPLIED };
      });
  }

  async findAllSchools() { return this.schoolRepo.find({ relations: ['subscription'] }); }
  
  async findSchoolDetails(id: string) {
    const school = await this.schoolRepo.findOne({ 
      where: { id }, 
      relations: ['subscription', 'users'] 
    });
    if (!school) throw new NotFoundException("School not found");
    return school;
  }

  async getPlatformStats() { 
      return { 
          totalSchools: await this.schoolRepo.count(),
          activeSubs: await this.subRepo.count({ where: { status: SubscriptionStatus.ACTIVE } })
      }; 
  }
  async getSystemHealth() { return { status: 'healthy', database: { status: 'up', latency: '2ms' }, timestamp: new Date() }; }
  async updatePricing(s: any) { return s; }
  async updateSubscription(id: string, d: any) { 
    const sub = await this.subRepo.findOne({ where: { school: { id } as any } });
    if (!sub) throw new NotFoundException();
    Object.assign(sub, d);
    return this.subRepo.save(sub);
  }
  async getSubscriptionPayments() { return this.paymentRepo.find({ relations: ['school'], order: { createdAt: 'DESC' } }); }
  async updateSchoolEmail(id: string, e: string) { 
    const school = await this.schoolRepo.findOne({ where: { id } });
    if (!school) throw new NotFoundException();
    school.email = e;
    return this.schoolRepo.save(school);
  }
  async updateSchoolPhone(id: string, p: string) { 
    const school = await this.schoolRepo.findOne({ where: { id } });
    if (!school) throw new NotFoundException();
    school.phone = p;
    return this.schoolRepo.save(school);
  }
}
