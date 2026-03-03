import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { CryptoService } from './crypto.service';

@Module({
  providers: [EmailService, CryptoService],
  exports: [EmailService, CryptoService],
})
export class SharedModule {}
