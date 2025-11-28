
import { Module } from '@nestjs/common';
import { AcademicsService } from './academics.service';
import { AcademicsController } from './academics.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchoolClass } from '../entities/school-class.entity';
import { Subject } from '../entities/subject.entity';
import { ClassSubjectAssignment } from '../entities/class-subject-assignment.entity';
import { TimetableEntry } from '../entities/timetable-entry.entity';
import { Exam } from '../entities/exam.entity';
import { Grade } from '../entities/grade.entity';
import { AttendanceRecord } from '../entities/attendance-record.entity';
import { SchoolEvent } from '../entities/school-event.entity';
import { GradingRule } from '../entities/grading-rule.entity';
import { FeeItem } from '../entities/fee-item.entity';
import { ClassFee } from '../entities/class-fee.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    SchoolClass, Subject, ClassSubjectAssignment, TimetableEntry,
    Exam, Grade, AttendanceRecord, SchoolEvent, GradingRule, FeeItem, ClassFee
  ])],
  controllers: [AcademicsController],
  providers: [AcademicsService]
})
export class AcademicsModule {}
