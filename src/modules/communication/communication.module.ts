import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommunicationService } from './communication.service';
import { CommunicationController } from './communication.controller';
import { Message } from './entities/message.entity';
import { Announcement } from './entities/announcement.entity';
import { TenancyModule } from 'src/core/tenancy/tenancy.module';

@Module({
  imports: [TypeOrmModule.forFeature([Message, Announcement]), TenancyModule],
  controllers: [CommunicationController],
  providers: [CommunicationService],
})
export class CommunicationModule {}
