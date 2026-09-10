
import { Module } from '@nestjs/common';
import { CommunicationsService } from './communications.service';
import { CommunicationsController } from './communications.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Announcement } from '../entities/announcement.entity';
import { CommunicationLog } from '../entities/communication-log.entity';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    TypeOrmModule.forFeature([Announcement, CommunicationLog]),
    BullModule.registerQueue({
      name: 'notifications',
    }),
  ],
  controllers: [CommunicationsController],
  providers: [CommunicationsService],
  exports: [CommunicationsService], // Critical for AuthModule to access it
})
export class CommunicationsModule {}
