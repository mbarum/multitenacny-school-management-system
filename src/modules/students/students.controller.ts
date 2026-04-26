import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from 'src/common/user-role.enum';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { BulkUpdateStudentDto } from './dto/bulk-update-student.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Patch('bulk/update')
  @Roles(UserRole.ADMIN)
  bulkUpdate(@Body() bulkUpdateStudentDto: BulkUpdateStudentDto) {
    return this.studentsService.bulkUpdate(bulkUpdateStudentDto);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(createStudentDto);
  }

  @Get()
  findAll(@Query() query?: any) {
    return this.studentsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateStudentDto: UpdateStudentDto) {
    return this.studentsService.update(id, updateStudentDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.studentsService.remove(id);
  }

  @Post(':id/behavior')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  addBehavior(@Param('id') id: string, @Body() data: any) {
    return this.studentsService.addBehaviorRecord({ ...data, studentId: id });
  }

  @Get(':id/behavior')
  getBehavior(@Param('id') id: string) {
    return this.studentsService.getStudentBehavior(id);
  }

  @Get(':id/behavior/summary')
  getBehaviorSummary(@Param('id') id: string) {
    return this.studentsService.getBehaviorSummary(id);
  }
}
