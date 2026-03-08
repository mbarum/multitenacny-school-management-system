import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MpesaService } from './mpesa.service';
import { StkPushDto } from './dto/stk-push.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('mpesa')
export class MpesaController {
  constructor(private readonly mpesaService: MpesaService) {}

  @Post('stk-push')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  stkPush(@Body() stkPushDto: StkPushDto) {
    return this.mpesaService.stkPush(
      stkPushDto.phone,
      stkPushDto.amount,
      stkPushDto.plan,
    );
  }

  @Post('callback')
  @HttpCode(HttpStatus.OK)
  handleCallback(@Body() body: Record<string, any>) {
    return this.mpesaService.handleCallback(body);
  }
}
