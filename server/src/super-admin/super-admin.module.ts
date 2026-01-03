
import { Module } from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { SuperAdminController } from './super-admin.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { School } from '../entities/school.entity';
import { Subscription } from '../entities/subscription.entity';
import { User } from '../entities/user.entity';
import { PlatformSetting } from '../entities/platform-setting.entity';
import { SubscriptionPayment } from '../entities/subscription-payment.entity';
import { CommunicationsModule } from '../communications/communications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      School, 
      Subscription, 
      User, 
      PlatformSetting, 
      SubscriptionPayment
    ]),
    CommunicationsModule, // Resolved: CommunicationsService is now available in this context
  ],
  controllers: [SuperAdminController],
  providers: [SuperAdminService],
})
export class SuperAdminModule {}
