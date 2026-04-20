import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from 'src/common/user-role.enum';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExaminationsService } from './examinations.service';
import { CreateExaminationDto } from './dto/create-examination.dto';
import { UpdateExaminationDto } from './dto/update-examination.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('examinations')
export class ExaminationsController {
  constructor(private readonly examinationsService: ExaminationsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() createExaminationDto: CreateExaminationDto) {
    return this.examinationsService.create(createExaminationDto);
  }

  @Get()
  findAll() {
    return this.examinationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.examinationsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateExaminationDto: UpdateExaminationDto) {
    return this.examinationsService.update(id, updateExaminationDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.examinationsService.remove(id);
  }
}
