import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdmissionsService } from './admissions.service';
import { AdmissionsController } from './admissions.controller';
import { Application } from './entities/application.entity';
import { Student } from '../students/entities/student.entity';
import { FinanceModule } from '../finance/finance.module';
import { TenancyModule } from 'src/core/tenancy/tenancy.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Application, Student]),
    TenancyModule,
    FinanceModule,
  ],
  controllers: [AdmissionsController],
  providers: [AdmissionsService],
  exports: [AdmissionsService],
})
export class AdmissionsModule {}
