import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from 'src/common/user-role.enum';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReportCardsService } from './report-cards.service';
import { CreateReportCardDto } from './dto/create-report-card.dto';
import { UpdateReportCardDto } from './dto/update-report-card.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('report-cards')
export class ReportCardsController {
  constructor(private readonly reportCardsService: ReportCardsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() createReportCardDto: CreateReportCardDto) {
    return this.reportCardsService.create(createReportCardDto);
  }

  @Get()
  findAll() {
    return this.reportCardsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reportCardsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateReportCardDto: UpdateReportCardDto) {
    return this.reportCardsService.update(id, updateReportCardDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.reportCardsService.remove(id);
  }
}
