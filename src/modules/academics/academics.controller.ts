import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AcademicsService } from './academics.service';
import { AcademicYearsService } from './academic-years.service';
import { ClassLevelsService } from './class-levels.service';
import { SectionsService } from './sections.service';
import { GradingService } from './grading.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto';
import { CreateClassLevelDto } from './dto/create-class-level.dto';
import { CreateSectionDto } from './dto/create-section.dto';
import { GradingScale } from './entities/grading-scale.entity';

@UseGuards(JwtAuthGuard)
@Controller('academics')
export class AcademicsController {
  constructor(
    private readonly academicsService: AcademicsService,
    private readonly academicYearsService: AcademicYearsService,
    private readonly classLevelsService: ClassLevelsService,
    private readonly sectionsService: SectionsService,
    private readonly gradingService: GradingService,
  ) {}

  // Subjects
  @Post('subjects')
  createSubject(@Body() createSubjectDto: CreateSubjectDto) {
    return this.academicsService.create(createSubjectDto);
  }

  @Get('subjects')
  findAllSubjects() {
    return this.academicsService.findAll();
  }

  // Academic Years
  @Post('academic-years')
  createAcademicYear(@Body() createDto: CreateAcademicYearDto) {
    return this.academicYearsService.create(createDto);
  }

  @Get('academic-years')
  findAllAcademicYears() {
    return this.academicYearsService.findAll();
  }

  @Patch('academic-years/:id/set-current')
  setCurrentAcademicYear(@Param('id') id: string) {
    return this.academicYearsService.setCurrent(id);
  }

  // Class Levels
  @Post('class-levels')
  createClassLevel(@Body() createDto: CreateClassLevelDto) {
    return this.classLevelsService.create(createDto);
  }

  @Get('class-levels')
  findAllClassLevels() {
    return this.classLevelsService.findAllWithSections();
  }

  // Sections
  @Post('sections')
  createSection(@Body() createDto: CreateSectionDto) {
    return this.sectionsService.create(createDto);
  }

  @Get('sections')
  findAllSections() {
    return this.sectionsService.findAll();
  }

  // Grading Scales
  @Post('grading-scales')
  createGradingScale(@Body() createDto: Partial<GradingScale>) {
    return this.gradingService.create(createDto);
  }

  @Get('grading-scales')
  findAllGradingScales() {
    return this.gradingService.findAll();
  }
}
