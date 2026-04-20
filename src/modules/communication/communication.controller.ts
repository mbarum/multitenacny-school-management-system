import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from 'src/common/user-role.enum';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CommunicationService } from './communication.service';
import { CreateMessageDto } from './dto/create-message.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('communication')
export class CommunicationController {
  constructor(private readonly communicationService: CommunicationService) {}

  @Post('messages')
  @Roles(UserRole.ADMIN)
  create(@Body() createMessageDto: CreateMessageDto) {
    return this.communicationService.create(createMessageDto);
  }

  @Get('messages')
  findAll() {
    return this.communicationService.findAll();
  }

  @Get('messages/:id')
  findOne(@Param('id') id: string) {
    return this.communicationService.findOne(id);
  }
}
