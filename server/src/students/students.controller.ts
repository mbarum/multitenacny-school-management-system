
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { GetStudentsDto } from './dto/get-students.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../entities/user.entity';

@UseGuards(JwtAuthGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @Roles(Role.Admin, Role.Accountant)
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(createStudentDto);
  }

  @Post('batch-update')
  @Roles(Role.Admin, Role.Accountant)
  batchUpdate(@Body() updates: UpdateStudentDto[]) {
    return this.studentsService.batchUpdate(updates);
  }

  @Get()
  // Allow Teachers, Accountants, Admins to view students. 
  // Parents are restricted by service logic if accessing specific data, or should rely on dedicated parent endpoints.
  @Roles(Role.Admin, Role.Accountant, Role.Teacher, Role.Receptionist)
  findAll(@Query() query: GetStudentsDto) {
    return this.studentsService.findAll(query);
  }

  @Get('export')
  @Roles(Role.Admin, Role.Accountant)
  async export(@Res() res: Response) {
    const csv = await this.studentsService.exportStudents();
    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename="students.csv"');
    res.send(csv);
  }

  @Post('import')
  @Roles(Role.Admin)
  @UseInterceptors(FileInterceptor('file'))
  async import(@UploadedFile() file: any) {
    return this.studentsService.importStudents(file.buffer);
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Accountant, Role.Teacher, Role.Receptionist, Role.Parent)
  findOne(@Param('id') id: string) {
    // Note: In a strict environment, we'd add an ownership check here for Parents.
    return this.studentsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.Accountant)
  update(@Param('id') id: string, @Body() updateStudentDto: UpdateStudentDto) {
    return this.studentsService.update(id, updateStudentDto);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  remove(@Param('id') id: string) {
    return this.studentsService.remove(id);
  }
}
