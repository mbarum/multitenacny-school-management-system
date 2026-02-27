import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { MpesaService } from './mpesa.service';
import { StkPushDto } from './dto/stk-push.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('mpesa')
@UseGuards(JwtAuthGuard)
export class MpesaController {
  constructor(private readonly mpesaService: MpesaService) {}

  @Post('stk-push')
  @HttpCode(HttpStatus.OK)
  stkPush(@Body() stkPushDto: StkPushDto) {
    return this.mpesaService.stkPush(stkPushDto.phone, stkPushDto.amount);
  }
}
