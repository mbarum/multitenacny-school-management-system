import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExaminationsService } from './examinations.service';
import { ExaminationsController } from './examinations.controller';
import { Examination } from './entities/examination.entity';
import { TenancyModule } from 'src/core/tenancy/tenancy.module';

@Module({
  imports: [TypeOrmModule.forFeature([Examination]), TenancyModule],
  controllers: [ExaminationsController],
  providers: [ExaminationsService],
})
export class ExaminationsModule {}
