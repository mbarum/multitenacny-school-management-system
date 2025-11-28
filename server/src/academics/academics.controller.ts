
import { Controller, Get, Put, Body, UseGuards, Post, Patch, Param, Delete, Query } from '@nestjs/common';
import { AcademicsService } from './academics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AttendanceRecord, Grade, SchoolEvent, SchoolClass, Subject, ClassSubjectAssignment, TimetableEntry, Exam } from '../entities/all-entities';
import { CreateGradingRuleDto, UpdateGradingRuleDto } from './dto/grading-rule.dto';
import { CreateFeeItemDto, UpdateFeeItemDto } from './dto/fee-item.dto';
import { CreateClassDto, UpdateClassDto } from './dto/class.dto';
import { CreateSubjectDto, UpdateSubjectDto } from './dto/subject.dto';
import { CreateAssignmentDto, UpdateAssignmentDto } from './dto/assignment.dto';
import { CreateExamDto, UpdateExamDto } from './dto/exam.dto';
import { GetAttendanceDto } from './dto/get-attendance.dto';
import { GetGradesDto } from './dto/get-grades.dto';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../entities/user.entity';

@UseGuards(JwtAuthGuard)
@Controller('academics')
export class AcademicsController {
  constructor(private readonly academicsService: AcademicsService) {}
  
  // --- Classes (Admin Only) ---
  @Get('classes')
  @Roles(Role.Admin, Role.Accountant, Role.Teacher, Role.Receptionist)
  findAllClasses() { return this.academicsService.findAllClasses(); }
  
  @Post('classes')
  @Roles(Role.Admin)
  createClass(@Body() dto: CreateClassDto) { return this.academicsService.createClass(dto); }
  
  @Patch('classes/:id')
  @Roles(Role.Admin)
  updateClass(@Param('id') id: string, @Body() dto: UpdateClassDto) { return this.academicsService.updateClass(id, dto); }
  
  @Delete('classes/:id')
  @Roles(Role.Admin)
  deleteClass(@Param('id') id: string) { return this.academicsService.deleteClass(id); }
  
  @Put('classes/batch')
  @Roles(Role.Admin)
  batchUpdateClasses(@Body() data: SchoolClass[]) { return this.academicsService.batchUpdate(this.academicsService.classRepo, data); }

  // --- Subjects (Admin Only) ---
  @Get('subjects')
  @Roles(Role.Admin, Role.Teacher)
  findAllSubjects() { return this.academicsService.findAllSubjects(); }
  
  @Post('subjects')
  @Roles(Role.Admin)
  createSubject(@Body() dto: CreateSubjectDto) { return this.academicsService.createSubject(dto); }
  
  @Patch('subjects/:id')
  @Roles(Role.Admin)
  updateSubject(@Param('id') id: string, @Body() dto: UpdateSubjectDto) { return this.academicsService.updateSubject(id, dto); }
  
  @Delete('subjects/:id')
  @Roles(Role.Admin)
  deleteSubject(@Param('id') id: string) { return this.academicsService.deleteSubject(id); }
  
  @Put('subjects/batch')
  @Roles(Role.Admin)
  batchUpdateSubjects(@Body() data: Subject[]) { return this.academicsService.batchUpdate(this.academicsService.subjectRepo, data); }

  // --- Assignments (Admin Only) ---
  @Get('class-subject-assignments')
  @Roles(Role.Admin, Role.Teacher)
  findAllAssignments() { return this.academicsService.findAllAssignments(); }
  
  @Post('class-subject-assignments')
  @Roles(Role.Admin)
  createAssignment(@Body() dto: CreateAssignmentDto) { return this.academicsService.createAssignment(dto); }
  
  @Patch('class-subject-assignments/:id')
  @Roles(Role.Admin)
  updateAssignment(@Param('id') id: string, @Body() dto: UpdateAssignmentDto) { return this.academicsService.updateAssignment(id, dto); }
  
  @Delete('class-subject-assignments/:id')
  @Roles(Role.Admin)
  deleteAssignment(@Param('id') id: string) { return this.academicsService.deleteAssignment(id); }
  
  @Put('class-subject-assignments/batch')
  @Roles(Role.Admin)
  batchUpdateAssignments(@Body() data: ClassSubjectAssignment[]) { return this.academicsService.batchUpdate(this.academicsService.assignmentRepo, data); }
  
  // --- Timetable (Admin & Teacher) ---
  @Get('timetable-entries')
  @Roles(Role.Admin, Role.Teacher, Role.Receptionist)
  findAllTimetableEntries() { return this.academicsService.findAllTimetableEntries(); }
  
  @Put('timetable-entries/batch')
  @Roles(Role.Admin)
  batchUpdateTimetable(@Body() data: TimetableEntry[]) { return this.academicsService.batchUpdate(this.academicsService.timetableRepo, data); }

  // --- Exams (Admin & Teacher) ---
  @Get('exams')
  @Roles(Role.Admin, Role.Teacher, Role.Parent)
  findAllExams() { return this.academicsService.findAllExams(); }
  
  @Post('exams')
  @Roles(Role.Admin, Role.Teacher)
  createExam(@Body() dto: CreateExamDto) { return this.academicsService.createExam(dto); }
  
  @Patch('exams/:id')
  @Roles(Role.Admin, Role.Teacher)
  updateExam(@Param('id') id: string, @Body() dto: UpdateExamDto) { return this.academicsService.updateExam(id, dto); }
  
  @Delete('exams/:id')
  @Roles(Role.Admin)
  deleteExam(@Param('id') id: string) { return this.academicsService.deleteExam(id); }
  
  @Put('exams/batch')
  @Roles(Role.Admin)
  batchUpdateExams(@Body() data: Exam[]) { return this.academicsService.batchUpdate(this.academicsService.examRepo, data); }

  // --- Grades (Admin & Teacher) ---
  @Get('grades')
  @Roles(Role.Admin, Role.Teacher, Role.Parent)
  getGrades(@Query() query: GetGradesDto) { return this.academicsService.findAllGrades(query); }
  
  @Put('grades/batch')
  @Roles(Role.Admin, Role.Teacher)
  batchUpdateGrades(@Body() data: Grade[]) { return this.academicsService.batchUpdate(this.academicsService.gradeRepo, data); }

  // --- Attendance (Admin & Teacher) ---
  @Get('attendance-records')
  @Roles(Role.Admin, Role.Teacher, Role.Parent)
  getAttendance(@Query() query: GetAttendanceDto) { return this.academicsService.findAllAttendance(query); }
  
  @Put('attendance-records/batch')
  @Roles(Role.Admin, Role.Teacher)
  batchUpdateAttendance(@Body() data: AttendanceRecord[]) { return this.academicsService.batchUpdate(this.academicsService.attendanceRepo, data); }

  // --- Events ---
  @Get('events')
  @Roles(Role.Admin, Role.Teacher, Role.Parent, Role.Receptionist)
  getEvents() { return this.academicsService.findAllEvents(); }
  
  @Put('events/batch')
  @Roles(Role.Admin)
  batchUpdateEvents(@Body() data: SchoolEvent[]) { return this.academicsService.batchUpdate(this.academicsService.eventRepo, data); }

  // --- Grading Scale (Admin) ---
  @Get('grading-scale')
  @Roles(Role.Admin, Role.Teacher)
  getGradingScale() { return this.academicsService.findAllGradingRules(); }
  
  @Post('grading-scale')
  @Roles(Role.Admin)
  createGradingRule(@Body() dto: CreateGradingRuleDto) { return this.academicsService.createGradingRule(dto); }
  
  @Patch('grading-scale/:id')
  @Roles(Role.Admin)
  updateGradingRule(@Param('id') id: string, @Body() dto: UpdateGradingRuleDto) { return this.academicsService.updateGradingRule(id, dto); }
  
  @Delete('grading-scale/:id')
  @Roles(Role.Admin)
  deleteGradingRule(@Param('id') id: string) { return this.academicsService.deleteGradingRule(id); }

  // --- Fee Structure (Admin & Accountant) ---
  @Get('fee-structure')
  @Roles(Role.Admin, Role.Accountant)
  getFeeStructure() { return this.academicsService.findAllFeeItems(); }
  
  @Post('fee-structure')
  @Roles(Role.Admin, Role.Accountant)
  createFeeItem(@Body() dto: CreateFeeItemDto) { return this.academicsService.createFeeItem(dto); }
  
  @Patch('fee-structure/:id')
  @Roles(Role.Admin, Role.Accountant)
  updateFeeItem(@Param('id') id: string, @Body() dto: UpdateFeeItemDto) { return this.academicsService.updateFeeItem(id, dto); }
  
  @Delete('fee-structure/:id')
  @Roles(Role.Admin, Role.Accountant)
  deleteFeeItem(@Param('id') id: string) { return this.academicsService.deleteFeeItem(id); }
}
