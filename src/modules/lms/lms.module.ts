import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LmsController } from './lms.controller';
import { LmsService } from './lms.service';
import { LmsConnection } from './entities/lms-connection.entity';
import { CryptoService } from 'src/shared/crypto.service';

@Module({
  imports: [TypeOrmModule.forFeature([LmsConnection]), TenancyModule],
  controllers: [LmsController],
  providers: [LmsService, CryptoService],
})
export class LmsModule {}
