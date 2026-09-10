
import { Controller, Post, Request } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('financial-summary')
  generateFinancialSummary(@Request() req: any) {
    return this.aiService.generateFinancialSummary(req.user.schoolId);
  }
}
