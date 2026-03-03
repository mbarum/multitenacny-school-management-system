import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcademicsService } from './academics.service';
import { AcademicYearsService } from './academic-years.service';
import { ClassLevelsService } from './class-levels.service';
import { SectionsService } from './sections.service';
import { GradingService } from './grading.service';
import { AcademicsController } from './academics.controller';
import { Subject } from './entities/subject.entity';
import { AcademicYear } from './entities/academic-year.entity';
import { ClassLevel } from './entities/class-level.entity';
import { Section } from './entities/section.entity';
import { GradingScale } from './entities/grading-scale.entity';
import { TenancyModule } from 'src/core/tenancy/tenancy.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Subject,
      AcademicYear,
      ClassLevel,
      Section,
      GradingScale,
    ]),
    TenancyModule,
  ],
  controllers: [AcademicsController],
  providers: [
    AcademicsService,
    AcademicYearsService,
    ClassLevelsService,
    SectionsService,
    GradingService,
  ],
})
export class AcademicsModule {}
