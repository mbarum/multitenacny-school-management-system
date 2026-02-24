import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcademicsService } from './academics.service';
import { AcademicsController } from './academics.controller';
import { Subject } from './entities/subject.entity';
import { TenancyModule } from 'src/core/tenancy/tenancy.module';

@Module({
  imports: [TypeOrmModule.forFeature([Subject]), TenancyModule],
  controllers: [AcademicsController],
  providers: [AcademicsService],
})
export class AcademicsModule {}
