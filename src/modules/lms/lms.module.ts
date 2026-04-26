import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LmsController } from './lms.controller';
import { LmsService } from './lms.service';
import { LmsConnection } from './entities/lms-connection.entity';
import { Course } from './entities/course.entity';
import { Lesson } from './entities/lesson.entity';
import { Assignment } from './entities/assignment.entity';
import { Submission } from './entities/submission.entity';
import { SharedModule } from 'src/shared/shared.module';
import { TenancyModule } from 'src/core/tenancy/tenancy.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LmsConnection,
      Course,
      Lesson,
      Assignment,
      Submission,
    ]),
    TenancyModule,
    SharedModule,
  ],
  controllers: [LmsController],
  providers: [LmsService],
})
export class LmsModule {}
