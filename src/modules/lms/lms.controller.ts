import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { LmsService } from './lms.service';
import { ConnectLmsDto } from './dto/connect-lms.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from 'src/core/decorators/roles.decorator';
import { UserRole } from 'src/common/user-role.enum';

/**
 * @description The main controller for the LmsModule.
 * It exposes endpoints for connecting to an LMS and syncing data.
 * All endpoints are protected and require authentication and appropriate roles.
 */
@Controller('lms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LmsController {
  constructor(private readonly lmsService: LmsService) {}

  @Get('courses')
  findAllCourses() {
    return this.lmsService.findAllCourses();
  }

  @Post('courses')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  createCourse(@Body() data: any) {
    return this.lmsService.createCourse(data);
  }

  @Get('courses/:id')
  findCourseDetails(@Param('id') id: string) {
    return this.lmsService.findCourseDetails(id);
  }

  @Post('lessons')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  createLesson(@Body() data: any) {
    return this.lmsService.createLesson(data);
  }

  @Post('assignments')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  createAssignment(@Body() data: any) {
    return this.lmsService.createAssignment(data);
  }

  @Post('assignments/:id/submit')
  @Roles(UserRole.STUDENT)
  submitAssignment(@Param('id') id: string, @Body() data: any) {
    return this.lmsService.submitAssignment({ ...data, assignmentId: id });
  }

  @Get('assignments/:id/submissions')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  findSubmissions(@Param('id') id: string) {
    return this.lmsService.findSubmissions(id);
  }

  @Get('connections')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  getConnections() {
    return this.lmsService.getConnections();
  }

  @Post('connections')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  connect(@Body() connectLmsDto: ConnectLmsDto) {
    return this.lmsService.connect(connectLmsDto);
  }

  @Post('sync/students')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.ACCEPTED) // Use 202 Accepted for long-running jobs
  syncStudents() {
    // In a real app, this would trigger a background job.
    // For now, we call it directly but don't wait for the full result.
    this.lmsService.syncStudents().catch(console.error);
    return { message: 'Student synchronization has been initiated.' };
  }

  @Post('sync/courses')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.ACCEPTED)
  syncCourses() {
    this.lmsService.syncCourses().catch(console.error);
    return { message: 'Course synchronization has been initiated.' };
  }

  @Get('grades/:studentId')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TEACHER)
  getGrades(@Param('studentId') studentId: string) {
    return this.lmsService.getGrades(studentId);
  }
}
