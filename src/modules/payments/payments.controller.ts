import { Controller, Post, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from 'src/core/decorators/roles.decorator';
import { UserRole } from 'src/common/user-role.enum';

class BankTransferRequestDto {
  amount: number;
  reference: string;
}

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('bank-transfer')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  createBankTransferRequest(@Body() body: BankTransferRequestDto) {
    return this.paymentsService.createBankTransferRequest(body.amount, body.reference);
  }

  @Post(':id/approve')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  approvePayment(@Param('id') id: string) {
    return this.paymentsService.approvePayment(id);
  }
}

