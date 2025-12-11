
import { Controller, Get, Post, Body, Query, Request, Patch, Param, Delete, Res } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { Transaction } from '../entities/transaction.entity';
import { GetTransactionsDto } from './dto/get-transactions.dto';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../entities/user.entity';
import { Public } from '../auth/public.decorator';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Roles(Role.Admin, Role.Accountant)
  @Post()
  create(@Request() req: any, @Body() createTransactionDto: Omit<Transaction, 'id'>) {
    return this.transactionsService.create(createTransactionDto, req.user.schoolId);
  }
  
  @Roles(Role.Admin, Role.Accountant)
  @Post('batch')
  createBatch(@Request() req: any, @Body() createTransactionDtos: Omit<Transaction, 'id'>[]) {
    return this.transactionsService.createBatch(createTransactionDtos, req.user.schoolId);
  }

  @Get()
  findAll(@Request() req: any, @Query() query: GetTransactionsDto) {
    return this.transactionsService.findAll(query, req.user.schoolId);
  }

  @Get('export')
  @Roles(Role.Admin, Role.Accountant)
  async export(@Request() req: any, @Res() res: any) {
    const csv = await this.transactionsService.exportTransactions(req.user.schoolId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
    res.send(csv);
  }

  @Roles(Role.Admin, Role.Accountant)
  @Patch(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() updateTransactionDto: Partial<Transaction>) {
    return this.transactionsService.update(id, updateTransactionDto, req.user.schoolId);
  }

  @Roles(Role.Admin)
  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.transactionsService.remove(id, req.user.schoolId);
  }

  // Public endpoint for Safaricom
  @Public()
  @Post('mpesa/callback')
  async handleMpesaCallback(@Body() payload: any) {
      return this.transactionsService.handleMpesaCallback(payload);
  }
}
