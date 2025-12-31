
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Subscription, SubscriptionStatus } from '../entities/subscription.entity';
import { Student } from '../entities/student.entity';
import { Transaction, TransactionType } from '../entities/transaction.entity';
import { User, Role } from '../entities/user.entity';
import { CommunicationsService } from '../communications/communications.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(Subscription) private subRepo: Repository<Subscription>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Transaction) private transactionRepo: Repository<Transaction>,
    private communicationsService: CommunicationsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async checkSubscriptionExpiry() {
    this.logger.log('Auditing subscription statuses...');
    const now = new Date();
    
    // 1. Find ACTIVE subscriptions that have passed their end date
    const expiredSubs = await this.subRepo.find({
        where: { 
            status: SubscriptionStatus.ACTIVE,
            endDate: LessThan(now)
        },
        relations: ['school']
    });

    for (const sub of expiredSubs) {
        // Mark as PAST_DUE to trigger system lockout
        sub.status = SubscriptionStatus.PAST_DUE;
        await this.subRepo.save(sub);
        
        this.logger.warn(`Lockout triggered for school: ${sub.school.name} due to expiry.`);
        
        // Notify school admin
        if (sub.school.email) {
            await this.communicationsService.sendEmail(
                sub.school.email,
                'Subscription Expired - Saaslink',
                `Your school management system access for ${sub.school.name} has been locked due to an expired subscription. Please log in to reactivate.`
            );
        }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendExpiryWarnings() {
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      
      const nearingExpiry = await this.subRepo.find({
          where: {
              status: SubscriptionStatus.ACTIVE,
              endDate: LessThan(threeDaysFromNow)
          },
          relations: ['school']
      });

      for (const sub of nearingExpiry) {
          if (sub.school.email) {
              await this.communicationsService.sendEmail(
                  sub.school.email,
                  'Action Required: Subscription Expiring Soon',
                  `Your subscription for ${sub.school.name} expires on ${sub.endDate.toLocaleDateString()}. Renew now to avoid system lockout.`
              );
          }
      }
  }
}
