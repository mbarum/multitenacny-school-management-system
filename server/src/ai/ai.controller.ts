
import { Controller, Post, UseGuards, Request } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('financial-summary')
  generateFinancialSummary(@Request() req: any) {
    return this.aiService.generateFinancialSummary(req.user.schoolId);
  }
}
