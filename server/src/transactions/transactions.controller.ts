
import { Controller, Get, Post, Body, UseGuards, Query, Request } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Transaction } from '../entities/transaction.entity';
import { GetTransactionsDto } from './dto/get-transactions.dto';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../entities/user.entity';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @UseGuards(JwtAuthGuard)
  @Roles(Role.Admin, Role.Accountant)
  @Post()
  create(@Request() req: any, @Body() createTransactionDto: Omit<Transaction, 'id'>) {
    return this.transactionsService.create(createTransactionDto, req.user.schoolId);
  }
  
  @UseGuards(JwtAuthGuard)
  @Roles(Role.Admin, Role.Accountant)
  @Post('batch')
  createBatch(@Request() req: any, @Body() createTransactionDtos: Omit<Transaction, 'id'>[]) {
    return this.transactionsService.createBatch(createTransactionDtos, req.user.schoolId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Request() req: any, @Query() query: GetTransactionsDto) {
    return this.transactionsService.findAll(query, req.user.schoolId);
  }

  // Public endpoint for Safaricom - No Guards (Security handled by IP Whitelist/Signature validation in production)
  // M-Pesa callbacks don't carry schoolId directly, but the reference (AccountReference) links to a Student who has a schoolId.
  @Post('mpesa/callback')
  async handleMpesaCallback(@Body() payload: any) {
      return this.transactionsService.handleMpesaCallback(payload);
  }
}
