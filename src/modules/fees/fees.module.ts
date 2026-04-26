import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeesService } from './fees.service';
import { FeesController } from './fees.controller';
import { Fee } from './entities/fee.entity';
import { FeePayment } from './entities/fee-payment.entity';
import { FeeItem } from './entities/fee-item.entity';
import { FeeStructure } from './entities/fee-structure.entity';
import { Invoice } from './entities/invoice.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { FeeWaiver } from './entities/fee-waiver.entity';
import { Student } from 'src/modules/students/entities/student.entity';
import { ClassLevel } from 'src/modules/academics/entities/class-level.entity';
import { TenancyModule } from 'src/core/tenancy/tenancy.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Fee,
      FeePayment,
      FeeItem,
      FeeStructure,
      Invoice,
      InvoiceItem,
      FeeWaiver,
      Student,
      ClassLevel,
    ]),
    TenancyModule
  ],
  controllers: [FeesController],
  providers: [FeesService],
  exports: [FeesService],
})
export class FeesModule {}
