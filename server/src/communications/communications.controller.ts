
import { Controller, Get, Post, Body, UseGuards, Request, Query } from '@nestjs/common';
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
    return this.communicationsService.createAnnouncement({ ...data, sentById: userId });
  }

  @Get('announcements')
  // All authenticated users can view announcements, but frontend filters audience
  findAllAnnouncements() {
    return this.communicationsService.findAllAnnouncements();
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
  findAllLogs(@Query() query: GetCommunicationLogsDto) {
    return this.communicationsService.findAllLogs(query);
  }
}
