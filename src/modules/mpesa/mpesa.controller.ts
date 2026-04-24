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
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/user-role.enum';
import { SkipSubscriptionCheck } from '../auth/decorators/skip-subscription-check.decorator';

@Controller('mpesa')
@SkipSubscriptionCheck()
export class MpesaController {
  constructor(private readonly mpesaService: MpesaService) {}

  @Post('stk-push')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  stkPush(@Body() stkPushDto: StkPushDto) {
    return this.mpesaService.stkPush(
      stkPushDto.phone,
      stkPushDto.amount,
      stkPushDto.plan,
      stkPushDto.billingCycle || 'monthly',
    );
  }

  @Post('callback')
  @HttpCode(HttpStatus.OK)
  handleCallback(@Body() body: Record<string, any>) {
    return this.mpesaService.handleCallback(body);
  }

  @Post('validation')
  @HttpCode(HttpStatus.OK)
  handleValidation(@Body() body: Record<string, any>) {
    return this.mpesaService.handleC2BValidation(body);
  }

  @Post('confirmation')
  @HttpCode(HttpStatus.OK)
  handleConfirmation(@Body() body: Record<string, any>) {
    return this.mpesaService.handleC2BConfirmation(body);
  }
}
