
import { Controller, Get, Post, Body, Patch, Param, UseGuards, Delete, UploadedFile, UseInterceptors, Res, Request } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { StaffService } from './staff.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../entities/user.entity';

@UseGuards(JwtAuthGuard)
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  @Roles(Role.Admin, Role.Accountant)
  create(@Request() req: any, @Body() createStaffDto: CreateStaffDto) {
    return this.staffService.create(createStaffDto, req.user.schoolId);
  }

  @Get()
  @Roles(Role.Admin, Role.Accountant)
  findAll(@Request() req: any) {
    return this.staffService.findAll(req.user.schoolId);
  }
  
  @Get('export')
  @Roles(Role.Admin, Role.Accountant)
  async export(@Request() req: any, @Res() res: Response) {
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