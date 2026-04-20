import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EmailService } from './email.service';
import { CryptoService } from './crypto.service';
import { EmailProcessor } from './email.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'emailQueue',
    }),
  ],
  providers: [EmailService, CryptoService, EmailProcessor],
  exports: [EmailService, CryptoService],
})
export class SharedModule {}
