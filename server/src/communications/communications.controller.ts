
import { Controller, Get, Post, Body, UseGuards, Request, Query, Patch, Param, Delete } from '@nestjs/common';
import { CommunicationsService } from './communications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Announcement, CommunicationLog } from '../entities/all-entities';
import { GetCommunicationLogsDto } from './dto/get-logs.dto';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../entities/user.entity';

@UseGuards(JwtAuthGuard)
@Controller('communications')
export class CommunicationsController {
  constructor(private readonly communicationsService: CommunicationsService) {}

  @Post('announcements')
  @Roles(Role.Admin, Role.Teacher)
  createAnnouncement(@Request() req: any, @Body() data: Omit<Announcement, 'id' | 'sentBy' | 'sentById'>) {
    const userId = req.user.userId;
    return this.communicationsService.createAnnouncement({ ...data, sentById: userId }, req.user.schoolId);
  }

  @Get('announcements')
  findAllAnnouncements(@Request() req: any) {
    return this.communicationsService.findAllAnnouncements(req.user.schoolId);
  }

  @Patch('announcements/:id')
  @Roles(Role.Admin)
  updateAnnouncement(@Request() req: any, @Param('id') id: string, @Body() data: Partial<Announcement>) {
    return this.communicationsService.updateAnnouncement(id, data, req.user.schoolId);
  }

  @Delete('announcements/:id')
  @Roles(Role.Admin)
  deleteAnnouncement(@Request() req: any, @Param('id') id: string) {
    return this.communicationsService.deleteAnnouncement(id, req.user.schoolId);
  }

  @Post('communication-logs')
  @Roles(Role.Admin, Role.Teacher)
  createLog(@Request() req: any, @Body() data: Omit<CommunicationLog, 'id' | 'sentBy' | 'sentById'>) {
    const userId = req.user.userId;
    return this.communicationsService.createLog({ ...data, sentById: userId });
  }
  
  @Post('communication-logs/batch')
  @Roles(Role.Admin, Role.Teacher)
  createLogs(@Request() req: any, @Body() data: Omit<CommunicationLog, 'id' | 'sentBy' | 'sentById'>[]) {
    const userId = req.user.userId;
    const dataWithSender = data.map(log => ({ ...log, sentById: userId }));
    return this.communicationsService.createLogs(dataWithSender);
  }

  @Get('communication-logs')
  @Roles(Role.Admin, Role.Teacher, Role.Parent)
  findAllLogs(@Request() req: any, @Query() query: GetCommunicationLogsDto) {
    return this.communicationsService.findAllLogs(query, req.user.schoolId);
  }
}
