
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, UploadedFile, Res, Request, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { GetStudentsDto } from './dto/get-students.dto';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../entities/user.entity';
import { diskStorage } from 'multer';
import { extname, join, resolve } from 'path';
import * as fs from 'fs';

@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @Roles(Role.Admin, Role.Accountant)
  create(@Request() req: any, @Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(createStudentDto, req.user.schoolId);
  }

  @Post('upload-photo')
  @Roles(Role.Admin, Role.Accountant)
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const path = join(resolve('.'), 'public', 'uploads', 'students');
        if (!fs.existsSync(path)) {
          fs.mkdirSync(path, { recursive: true });
        }
        cb(null, path);
      },
      filename: (req: any, file: any, cb: (error: Error | null, filename: string) => void) => {
        const randomName = Array(16).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        return cb(null, `${randomName}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (req: any, file: any, cb: (error: Error | null, acceptFile: boolean) => void) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
            return cb(new BadRequestException('Only image files are allowed!'), false);
        }
        cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
  }))
  async uploadPhoto(@UploadedFile() file: any) {
    if (!file) throw new BadRequestException('File upload failed.');
    return { url: `/public/uploads/students/${file.filename}` };
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
  async export(@Request() req: any, @Res() res: any) {
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
