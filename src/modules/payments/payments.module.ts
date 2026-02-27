import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { Tenant } from '../tenants/entities/tenant.entity';
import { PendingPayment } from './entities/pending-payment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, PendingPayment])],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
