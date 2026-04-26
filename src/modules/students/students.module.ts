import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentsService } from './students.service';
import { PromotionService } from './promotion.service';
import { StudentsController } from './students.controller';
import { PromotionController } from './promotion.controller';
import { Student } from './entities/student.entity';
import { BehaviorRecord } from './entities/behavior-record.entity';
import { TenancyModule } from 'src/core/tenancy/tenancy.module';

@Module({
  imports: [TypeOrmModule.forFeature([Student, BehaviorRecord]), TenancyModule],
  controllers: [StudentsController, PromotionController],
  providers: [StudentsService, PromotionService],
  exports: [StudentsService, PromotionService],
})
export class StudentsModule {}
