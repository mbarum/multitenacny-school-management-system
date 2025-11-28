
import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
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
  create(@Body() createTransactionDto: Omit<Transaction, 'id'>) {
    return this.transactionsService.create(createTransactionDto);
  }
  
  @UseGuards(JwtAuthGuard)
  @Roles(Role.Admin, Role.Accountant)
  @Post('batch')
  createBatch(@Body() createTransactionDtos: Omit<Transaction, 'id'>[]) {
    return this.transactionsService.createBatch(createTransactionDtos);
  }

  // Allow Parents/Teachers to view basic transactions related to their scope, 
  // but fine-grained filtering is handled in service/guard logic if strictly needed.
  // For now, we allow reading for authenticated users, but writing is restricted.
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query() query: GetTransactionsDto) {
    return this.transactionsService.findAll(query);
  }

  // Public endpoint for Safaricom - No Guards
  @Post('mpesa/callback')
  async handleMpesaCallback(@Body() payload: any) {
      return this.transactionsService.handleMpesaCallback(payload);
  }
}