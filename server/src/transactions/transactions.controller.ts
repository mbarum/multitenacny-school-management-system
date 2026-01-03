
import { Controller, Post, Body, Request, Ip, ForbiddenException, Logger, Get, Query, Patch, Param, Delete, Res } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { Transaction } from '../entities/transaction.entity';
import { GetTransactionsDto } from './dto/get-transactions.dto';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../entities/user.entity';
import { Public } from '../auth/public.decorator';
import { ConfigService } from '@nestjs/config';

@Controller()
export class TransactionsController {
  private readonly logger = new Logger(TransactionsController.name);
  
  constructor(
      private readonly transactionsService: TransactionsService,
      private readonly configService: ConfigService
  ) {}

  @Roles(Role.Admin, Role.Accountant, Role.Parent)
  @Post('mpesa/stk-push')
  async initiateStk(@Request() req: any, @Body() body: { amount: number, phone: string, accountReference: string }) {
      // Use schoolId from user if present, otherwise handle based on reference
      const schoolId = req.user.schoolId;
      return this.transactionsService.initiateStkPush(body.amount, body.phone, body.accountReference, schoolId);
  }

  @Public()
  @Post('mpesa/callback')
  async handleMpesaCallback(@Body() payload: any, @Ip() ip: string) {
      this.logger.log(`M-Pesa Callback from IP: ${ip}`);
      return this.transactionsService.handleMpesaCallback(payload);
  }

  @Public()
  @Post('stripe/webhook')
  async handleStripeWebhook(@Request() req: any, @Res() res: any) {
      const sig = req.headers['stripe-signature'];
      try {
          await this.transactionsService.handleStripeWebhook(req.body, sig);
          return res.status(200).send({ received: true });
      } catch (err: any) {
          this.logger.error(`Stripe Webhook Error: ${err.message}`);
          return res.status(400).send(`Webhook Error: ${err.message}`);
      }
  }

  // --- Standard CRUD ---
  @Get('transactions')
  findAll(@Request() req: any, @Query() query: GetTransactionsDto) {
    return this.transactionsService.findAll(query, req.user.schoolId);
  }

  @Roles(Role.Admin, Role.Accountant)
  @Post('transactions')
  create(@Request() req: any, @Body() dto: any) {
    return this.transactionsService.create(dto, req.user.schoolId);
  }

  @Roles(Role.Admin, Role.Accountant)
  @Post('transactions/batch')
  createBatch(@Request() req: any, @Body() dtos: any[]) {
    return this.transactionsService.createBatch(dtos, req.user.schoolId);
  }
}
