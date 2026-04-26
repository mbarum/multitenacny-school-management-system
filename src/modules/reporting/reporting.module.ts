import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportingService } from './reporting.service';
import { ReportingController } from './reporting.controller';
import { TenancyModule } from 'src/core/tenancy/tenancy.module';
import { UsersModule } from '../users/users.module';
import { Fee } from '../fees/entities/fee.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { Attendance } from '../attendance/entities/attendance.entity';
import { Student } from '../students/entities/student.entity';
import { TimetableEntry } from '../timetable/entities/timetable-entry.entity';
import { ReportCard } from '../report-cards/entities/report-card.entity';
import { CalendarEvent } from '../calendar/entities/calendar-event.entity';
import { Subject } from '../academics/entities/subject.entity';
import { Examination } from '../examinations/entities/examination.entity';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Fee,
      Expense,
      Attendance,
      Student,
      TimetableEntry,
      ReportCard,
      CalendarEvent,
      Subject,
      Examination,
    ]),
    TenancyModule,
    UsersModule,
    MediaModule,
  ],
  controllers: [ReportingController],
  providers: [ReportingService],
})
export class ReportingModule {}
