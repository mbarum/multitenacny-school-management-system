import { Module } from '@nestjs/common';
import { CommunicationsService } from './communications.service';
import { CommunicationsController } from './communications.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Announcement } from '../entities/announcement.entity';
import { CommunicationLog } from '../entities/communication-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Announcement, CommunicationLog])],
  controllers: [CommunicationsController],
  providers: [CommunicationsService]
})
export class CommunicationsModule {}
