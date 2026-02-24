import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExaminationsService } from './examinations.service';
import { CreateExaminationDto } from './dto/create-examination.dto';
import { UpdateExaminationDto } from './dto/update-examination.dto';

@UseGuards(JwtAuthGuard)
@Controller('examinations')
export class ExaminationsController {
  constructor(private readonly examinationsService: ExaminationsService) {}

  @Post()
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
  update(@Param('id') id: string, @Body() updateExaminationDto: UpdateExaminationDto) {
    return this.examinationsService.update(id, updateExaminationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.examinationsService.remove(id);
  }
}
