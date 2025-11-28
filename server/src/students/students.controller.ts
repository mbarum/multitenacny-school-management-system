
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, UseInterceptors, UploadedFile, Res, Request } from '@nestjs/common';
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
  create(@Request() req: any, @Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(createStudentDto, req.user.schoolId);
  }

  @Post('batch-update')
  @Roles(Role.Admin, Role.Accountant)
  batchUpdate(@Request() req: any, @Body() updates: UpdateStudentDto[]) {
    return this.studentsService.batchUpdate(updates, req.user.schoolId);
  }

  @Get()
  @Roles(Role.Admin, Role.Accountant, Role.Teacher, Role.Receptionist)
  findAll(@Request() req: any, @Query() query: GetStudentsDto) {
    return this.studentsService.findAll(query, req.user.schoolId);
  }

  @Get('export')
  @Roles(Role.Admin, Role.Accountant)
  async export(@Request() req: any, @Res() res: Response) {
    const csv = await this.studentsService.exportStudents(req.user.schoolId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="students.csv"');
    res.send(csv);
  }

  @Post('import')
  @Roles(Role.Admin)
  @UseInterceptors(FileInterceptor('file'))
  async import(@Request() req: any, @UploadedFile() file: any) {
    return this.studentsService.importStudents(file.buffer, req.user.schoolId);
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Accountant, Role.Teacher, Role.Receptionist, Role.Parent)
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.studentsService.findOne(id, req.user.schoolId);
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.Accountant)
  update(@Request() req: any, @Param('id') id: string, @Body() updateStudentDto: UpdateStudentDto) {
    return this.studentsService.update(id, updateStudentDto, req.user.schoolId);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  remove(@Request() req: any, @Param('id') id: string) {
    return this.studentsService.remove(id, req.user.schoolId);
  }
}
