import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { Tenant } from '../tenants/entities/tenant.entity';
import { PendingPayment } from './entities/pending-payment.entity';
import { User } from '../users/entities/user.entity';
import { TenancyModule } from 'src/core/tenancy/tenancy.module';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, PendingPayment, User]), TenancyModule, SharedModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
