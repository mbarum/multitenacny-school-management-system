
import { Module } from '@nestjs/common';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from '../entities/student.entity';
import { SchoolClass } from '../entities/school-class.entity';
import { SchoolSetting } from '../entities/school-setting.entity';
import { Transaction } from '../entities/transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Student, SchoolClass, SchoolSetting, Transaction])],
  controllers: [StudentsController],
  providers: [StudentsService],
})
export class StudentsModule {}
