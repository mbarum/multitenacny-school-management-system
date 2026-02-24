import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalendarService } from './calendar.service';
import { CalendarController } from './calendar.controller';
import { CalendarEvent } from './entities/calendar-event.entity';
import { TenancyModule } from 'src/core/tenancy/tenancy.module';

@Module({
  imports: [TypeOrmModule.forFeature([CalendarEvent]), TenancyModule],
  controllers: [CalendarController],
  providers: [CalendarService],
})
export class CalendarModule {}
