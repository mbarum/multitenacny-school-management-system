import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MpesaController } from './mpesa.controller';
import { MpesaService } from './mpesa.service';
import { Tenant } from '../tenants/entities/tenant.entity';
import { PendingPayment } from '../payments/entities/pending-payment.entity';
import { TenancyModule } from 'src/core/tenancy/tenancy.module';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([Tenant, PendingPayment]),
    TenancyModule,
  ],
  controllers: [MpesaController],
  providers: [MpesaService],
})
export class MpesaModule {}
