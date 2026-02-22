import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LedgerService } from './ledger.service';
import { CreateJournalDto } from './dto/create-journal.dto';
import { SchoolId } from '../common/decorators/school-id.decorator';

@Controller('ledger')
@UseGuards(JwtAuthGuard)
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Post('journal')
  createJournal(@Body() dto: CreateJournalDto, @SchoolId() schoolId: string) {
    return this.ledgerService.post(dto, schoolId);
  }

  @Get('account/:id/balance')
  getAccountBalance(@Param('id') id: string, @SchoolId() schoolId: string) {
    return this.ledgerService.getAccountBalance(id, schoolId);
  }
}
