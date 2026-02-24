import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CommunicationService } from './communication.service';
import { CreateMessageDto } from './dto/create-message.dto';

@UseGuards(JwtAuthGuard)
@Controller('communication')
export class CommunicationController {
  constructor(private readonly communicationService: CommunicationService) {}

  @Post('messages')
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
