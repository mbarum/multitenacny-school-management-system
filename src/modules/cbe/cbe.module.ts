import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CbeController } from './cbe.controller';
import { CbeService } from './cbe.service';
import { CbeCompetency } from './entities/cbe-competency.entity';
import { CbeRubric } from './entities/cbe-rubric.entity';
import { CbeAssessment } from './entities/cbe-assessment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CbeCompetency, CbeRubric, CbeAssessment])],
  controllers: [CbeController],
  providers: [CbeService]
})
export class CbeModule {}
