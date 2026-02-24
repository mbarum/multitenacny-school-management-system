import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TimetableService } from './timetable.service';
import { CreateTimetableEntryDto } from './dto/create-timetable-entry.dto';
import { UpdateTimetableEntryDto } from './dto/update-timetable-entry.dto';

@UseGuards(JwtAuthGuard)
@Controller('timetable')
export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  @Post()
  create(@Body() createTimetableEntryDto: CreateTimetableEntryDto) {
    return this.timetableService.create(createTimetableEntryDto);
  }

  @Get()
  findAll() {
    return this.timetableService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.timetableService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTimetableEntryDto: UpdateTimetableEntryDto) {
    return this.timetableService.update(id, updateTimetableEntryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.timetableService.remove(id);
  }
}
