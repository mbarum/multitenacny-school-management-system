
import { Controller, Get, Post, Body, Patch, Param, UseGuards, Delete, UploadedFile, UseInterceptors, Res } from '@nestjs/common';
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
  create(@Body() createStaffDto: CreateStaffDto) {
    return this.staffService.create(createStaffDto);
  }

  @Get()
  @Roles(Role.Admin, Role.Accountant)
  findAll() {
    return this.staffService.findAll();
  }
  
  @Get('export')
  @Roles(Role.Admin, Role.Accountant)
  async export(@Res() res: Response) {
    const csv = await this.staffService.exportStaff();
    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename="staff.csv"');
    res.send(csv);
  }

  @Post('import')
  @Roles(Role.Admin)
  @UseInterceptors(FileInterceptor('file'))
  async import(@UploadedFile() file: any) {
    return this.staffService.importStaff(file.buffer);
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Accountant)
  findOne(@Param('id') id: string) {
    return this.staffService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.Accountant)
  update(@Param('id') id: string, @Body() updateStaffDto: UpdateStaffDto) {
    return this.staffService.update(id, updateStaffDto);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  remove(@Param('id') id: string) {
    return this.staffService.remove(id);
  }
}