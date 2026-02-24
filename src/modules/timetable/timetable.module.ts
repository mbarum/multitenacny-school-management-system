import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimetableService } from './timetable.service';
import { TimetableController } from './timetable.controller';
import { TimetableEntry } from './entities/timetable-entry.entity';
import { TenancyModule } from 'src/core/tenancy/tenancy.module';

@Module({
  imports: [TypeOrmModule.forFeature([TimetableEntry]), TenancyModule],
  controllers: [TimetableController],
  providers: [TimetableService],
})
export class TimetableModule {}
