
import { Controller, Get, Post, Body, Patch, Param, Delete, UploadedFile, UseInterceptors, Res, Request, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../entities/user.entity';
import { diskStorage } from 'multer';
import { extname, join, resolve } from 'path';
import * as fs from 'fs';

@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  @Roles(Role.Admin, Role.Accountant)
  create(@Request() req: any, @Body() createStaffDto: CreateStaffDto) {
    return this.staffService.create(createStaffDto, req.user.schoolId);
  }

  @Post('upload-photo')
  @Roles(Role.Admin, Role.Accountant)
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const path = join(resolve('.'), 'public', 'uploads', 'staff');
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
    limits: { fileSize: 5 * 1024 * 1024 } 
  }))
  async uploadPhoto(@UploadedFile() file: any) {
    if (!file) throw new BadRequestException('File upload failed.');
    return { url: `/public/uploads/staff/${file.filename}` };
  }

  @Get()
  @Roles(Role.Admin, Role.Accountant)
  findAll(@Request() req: any) {
    return this.staffService.findAll(req.user.schoolId);
  }
  
  @Get('export')
  @Roles(Role.Admin, Role.Accountant)
  async export(@Request() req: any, @Res() res: any) {
    const csv = await this.staffService.exportStaff(req.user.schoolId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="staff.csv"');
    res.send(csv);
  }

  @Post('import')
  @Roles(Role.Admin)
  @UseInterceptors(FileInterceptor('file'))
  async import(@Request() req: any, @UploadedFile() file: any) {
    return this.staffService.importStaff(file.buffer, req.user.schoolId);
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Accountant)
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.staffService.findOne(id, req.user.schoolId);
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.Accountant)
  update(@Request() req: any, @Param('id') id: string, @Body() updateStaffDto: UpdateStaffDto) {
    return this.staffService.update(id, updateStaffDto, req.user.schoolId);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  remove(@Request() req: any, @Param('id') id: string) {
    return this.staffService.remove(id, req.user.schoolId);
  }
}
