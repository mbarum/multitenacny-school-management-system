import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AcademicsService } from './academics.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';

@UseGuards(JwtAuthGuard)
@Controller('academics')
export class AcademicsController {
  constructor(private readonly academicsService: AcademicsService) {}

  @Post('subjects')
  create(@Body() createSubjectDto: CreateSubjectDto) {
    return this.academicsService.create(createSubjectDto);
  }

  @Get('subjects')
  findAll() {
    return this.academicsService.findAll();
  }

  @Get('subjects/:id')
  findOne(@Param('id') id: string) {
    return this.academicsService.findOne(id);
  }

  @Patch('subjects/:id')
  update(@Param('id') id: string, @Body() updateSubjectDto: UpdateSubjectDto) {
    return this.academicsService.update(id, updateSubjectDto);
  }

  @Delete('subjects/:id')
  remove(@Param('id') id: string) {
    return this.academicsService.remove(id);
  }
}
