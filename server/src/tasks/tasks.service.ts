import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
/* Added Between to typeorm imports */
import { Repository, LessThan, Between } from 'typeorm';
import { Subscription, SubscriptionStatus } from '../entities/subscription.entity';
import { User } from '../entities/user.entity';
import { CommunicationsService } from '../communications/communications.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(Subscription) private subRepo: Repository<Subscription>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private communicationsService: CommunicationsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async checkSubscriptionExpiry() {
    this.logger.log('Executing daily subscription audit...');
    const now = new Date();
    
    // 1. Lock accounts that expired yesterday
    const expiredSubs = await this.subRepo.find({
        where: { 
            status: SubscriptionStatus.ACTIVE,
            endDate: LessThan(now)
        },
        relations: ['school']
    });

    for (const sub of expiredSubs) {
        sub.status = SubscriptionStatus.PAST_DUE;
        await this.subRepo.save(sub);
        this.logger.warn(`LOCKOUT: School ${sub.school.name} restricted due to non-payment.`);
        
        if (sub.school.email) {
            await this.communicationsService.sendEmail(
                sub.school.email,
                'Urgent: Your Saaslink Account is Locked',
                `<h1>Service Interruption</h1>
                 <p>The subscription for ${sub.school.name} expired on ${sub.endDate.toLocaleDateString()}.</p>
                 <p>Access to your management portal is restricted until a payment is made.</p>
                 <p><a href="${process.env.FRONTEND_URL}/login">Login to Renew</a></p>`
            );
        }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendExpiryWarnings() {
      this.logger.log('Broadcasting subscription renewal warnings...');
      
      const sendWarning = async (days: number, subject: string) => {
          const targetDate = new Date();
          targetDate.setDate(targetDate.getDate() + days);
          
          // Find subscriptions ending on EXACTLY this day (range 24h)
          const startTime = new Date(targetDate.setHours(0,0,0,0));
          const endTime = new Date(targetDate.setHours(23,59,59,999));

          const nearing = await this.subRepo.find({
              where: {
                  status: SubscriptionStatus.ACTIVE,
                  endDate: Between(startTime, endTime)
              },
              relations: ['school']
          });

          for (const sub of nearing) {
              if (sub.school.email) {
                  await this.communicationsService.sendEmail(
                      sub.school.email,
                      subject,
                      `<h1>Renewal Notice</h1>
                       <p>Your subscription for ${sub.school.name} expires in ${days} day(s) on ${sub.endDate.toLocaleDateString()}.</p>
                       <p>To ensure uninterrupted service for your staff and parents, please renew your license today.</p>`
                  );
              }
          }
      };

      await sendWarning(7, 'Renewal Notice: 7 Days Remaining - Saaslink');
      await sendWarning(1, 'Urgent Renewal Notice: 24 Hours Remaining - Saaslink');
  }
}
