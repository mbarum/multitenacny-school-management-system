
import { Controller, Get, Put, Body, UseGuards, Post, Patch, Param, Delete, Query, Request } from '@nestjs/common';
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
  findAllClasses(@Request() req: any) { return this.academicsService.findAllClasses(req.user.schoolId); }
  
  @Post('classes')
  @Roles(Role.Admin)
  createClass(@Request() req: any, @Body() dto: CreateClassDto) { return this.academicsService.createClass(dto, req.user.schoolId); }
  
  @Patch('classes/:id')
  @Roles(Role.Admin)
  updateClass(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateClassDto) { return this.academicsService.updateClass(id, dto, req.user.schoolId); }
  
  @Delete('classes/:id')
  @Roles(Role.Admin)
  deleteClass(@Request() req: any, @Param('id') id: string) { return this.academicsService.deleteClass(id, req.user.schoolId); }
  
  @Put('classes/batch')
  @Roles(Role.Admin)
  batchUpdateClasses(@Request() req: any, @Body() data: SchoolClass[]) { return this.academicsService.batchUpdate(this.academicsService.classRepo, data, req.user.schoolId); }

  // --- Subjects (Admin Only) ---
  @Get('subjects')
  @Roles(Role.Admin, Role.Teacher)
  findAllSubjects(@Request() req: any) { return this.academicsService.findAllSubjects(req.user.schoolId); }
  
  @Post('subjects')
  @Roles(Role.Admin)
  createSubject(@Request() req: any, @Body() dto: CreateSubjectDto) { return this.academicsService.createSubject(dto, req.user.schoolId); }
  
  @Patch('subjects/:id')
  @Roles(Role.Admin)
  updateSubject(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateSubjectDto) { return this.academicsService.updateSubject(id, dto, req.user.schoolId); }
  
  @Delete('subjects/:id')
  @Roles(Role.Admin)
  deleteSubject(@Request() req: any, @Param('id') id: string) { return this.academicsService.deleteSubject(id, req.user.schoolId); }
  
  @Put('subjects/batch')
  @Roles(Role.Admin)
  batchUpdateSubjects(@Request() req: any, @Body() data: Subject[]) { return this.academicsService.batchUpdate(this.academicsService.subjectRepo, data, req.user.schoolId); }

  // --- Assignments (Admin Only) ---
  @Get('class-subject-assignments')
  @Roles(Role.Admin, Role.Teacher)
  findAllAssignments(@Request() req: any) { return this.academicsService.findAllAssignments(req.user.schoolId); }
  
  @Post('class-subject-assignments')
  @Roles(Role.Admin)
  createAssignment(@Request() req: any, @Body() dto: CreateAssignmentDto) { return this.academicsService.createAssignment(dto, req.user.schoolId); }
  
  @Patch('class-subject-assignments/:id')
  @Roles(Role.Admin)
  updateAssignment(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateAssignmentDto) { return this.academicsService.updateAssignment(id, dto, req.user.schoolId); }
  
  @Delete('class-subject-assignments/:id')
  @Roles(Role.Admin)
  deleteAssignment(@Request() req: any, @Param('id') id: string) { return this.academicsService.deleteAssignment(id, req.user.schoolId); }
  
  @Put('class-subject-assignments/batch')
  @Roles(Role.Admin)
  batchUpdateAssignments(@Request() req: any, @Body() data: ClassSubjectAssignment[]) { return this.academicsService.batchUpdate(this.academicsService.assignmentRepo, data, req.user.schoolId); }
  
  // --- Timetable (Admin & Teacher) ---
  @Get('timetable-entries')
  @Roles(Role.Admin, Role.Teacher, Role.Receptionist)
  findAllTimetableEntries(@Request() req: any) { return this.academicsService.findAllTimetableEntries(req.user.schoolId); }
  
  @Put('timetable-entries/batch')
  @Roles(Role.Admin)
  batchUpdateTimetable(@Request() req: any, @Body() data: TimetableEntry[]) { return this.academicsService.batchUpdate(this.academicsService.timetableRepo, data, req.user.schoolId); }

  // --- Exams (Admin & Teacher) ---
  @Get('exams')
  @Roles(Role.Admin, Role.Teacher, Role.Parent)
  findAllExams(@Request() req: any) { return this.academicsService.findAllExams(req.user.schoolId); }
  
  @Post('exams')
  @Roles(Role.Admin, Role.Teacher)
  createExam(@Request() req: any, @Body() dto: CreateExamDto) { return this.academicsService.createExam(dto, req.user.schoolId); }
  
  @Patch('exams/:id')
  @Roles(Role.Admin, Role.Teacher)
  updateExam(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateExamDto) { return this.academicsService.updateExam(id, dto, req.user.schoolId); }
  
  @Delete('exams/:id')
  @Roles(Role.Admin)
  deleteExam(@Request() req: any, @Param('id') id: string) { return this.academicsService.deleteExam(id, req.user.schoolId); }
  
  @Put('exams/batch')
  @Roles(Role.Admin)
  batchUpdateExams(@Request() req: any, @Body() data: Exam[]) { return this.academicsService.batchUpdate(this.academicsService.examRepo, data, req.user.schoolId); }

  // --- Grades (Admin & Teacher) ---
  @Get('grades')
  @Roles(Role.Admin, Role.Teacher, Role.Parent)
  getGrades(@Request() req: any, @Query() query: GetGradesDto) { return this.academicsService.findAllGrades(query, req.user.schoolId); }
  
  @Put('grades/batch')
  @Roles(Role.Admin, Role.Teacher)
  batchUpdateGrades(@Request() req: any, @Body() data: Grade[]) { return this.academicsService.batchUpdate(this.academicsService.gradeRepo, data, req.user.schoolId); }

  // --- Attendance (Admin & Teacher) ---
  @Get('attendance-records')
  @Roles(Role.Admin, Role.Teacher, Role.Parent)
  getAttendance(@Request() req: any, @Query() query: GetAttendanceDto) { return this.academicsService.findAllAttendance(query, req.user.schoolId); }
  
  @Put('attendance-records/batch')
  @Roles(Role.Admin, Role.Teacher)
  batchUpdateAttendance(@Request() req: any, @Body() data: AttendanceRecord[]) { return this.academicsService.batchUpdate(this.academicsService.attendanceRepo, data, req.user.schoolId); }

  // --- Events ---
  @Get('events')
  @Roles(Role.Admin, Role.Teacher, Role.Parent, Role.Receptionist)
  getEvents(@Request() req: any) { return this.academicsService.findAllEvents(req.user.schoolId); }
  
  @Put('events/batch')
  @Roles(Role.Admin)
  batchUpdateEvents(@Request() req: any, @Body() data: SchoolEvent[]) { return this.academicsService.batchUpdate(this.academicsService.eventRepo, data, req.user.schoolId); }

  // --- Grading Scale (Admin) ---
  @Get('grading-scale')
  @Roles(Role.Admin, Role.Teacher)
  getGradingScale(@Request() req: any) { return this.academicsService.findAllGradingRules(req.user.schoolId); }
  
  @Post('grading-scale')
  @Roles(Role.Admin)
  createGradingRule(@Request() req: any, @Body() dto: CreateGradingRuleDto) { return this.academicsService.createGradingRule(dto, req.user.schoolId); }
  
  @Patch('grading-scale/:id')
  @Roles(Role.Admin)
  updateGradingRule(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateGradingRuleDto) { return this.academicsService.updateGradingRule(id, dto, req.user.schoolId); }
  
  @Delete('grading-scale/:id')
  @Roles(Role.Admin)
  deleteGradingRule(@Request() req: any, @Param('id') id: string) { return this.academicsService.deleteGradingRule(id, req.user.schoolId); }

  // --- Fee Structure (Admin & Accountant) ---
  @Get('fee-structure')
  @Roles(Role.Admin, Role.Accountant)
  getFeeStructure(@Request() req: any) { return this.academicsService.findAllFeeItems(req.user.schoolId); }
  
  @Post('fee-structure')
  @Roles(Role.Admin, Role.Accountant)
  createFeeItem(@Request() req: any, @Body() dto: CreateFeeItemDto) { return this.academicsService.createFeeItem(dto, req.user.schoolId); }
  
  @Patch('fee-structure/:id')
  @Roles(Role.Admin, Role.Accountant)
  updateFeeItem(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateFeeItemDto) { return this.academicsService.updateFeeItem(id, dto, req.user.schoolId); }
  
  @Delete('fee-structure/:id')
  @Roles(Role.Admin, Role.Accountant)
  deleteFeeItem(@Request() req: any, @Param('id') id: string) { return this.academicsService.deleteFeeItem(id, req.user.schoolId); }
}
