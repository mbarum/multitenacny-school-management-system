import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeesService } from './fees.service';
import { FeesController } from './fees.controller';
import { Fee } from './entities/fee.entity';
import { TenancyModule } from 'src/core/tenancy/tenancy.module';

@Module({
  imports: [TypeOrmModule.forFeature([Fee]), TenancyModule],
  controllers: [FeesController],
  providers: [FeesService],
})
export class FeesModule {}
