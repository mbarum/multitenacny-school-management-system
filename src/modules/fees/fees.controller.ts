import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from 'src/common/user-role.enum';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FeesService } from './fees.service';
import { CreateFeeDto } from './dto/create-fee.dto';
import { UpdateFeeDto } from './dto/update-fee.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('fees')
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() createFeeDto: CreateFeeDto) {
    return this.feesService.create(createFeeDto);
  }

  @Get()
  findAll() {
    return this.feesService.findAll();
  }

  @Get('items')
  findAllItems() {
    return this.feesService.findAllFeeItems();
  }

  @Post('items')
  @Roles(UserRole.ADMIN)
  createItem(@Body() data: any) {
    return this.feesService.createFeeItem(data);
  }

  @Delete('items/:id')
  @Roles(UserRole.ADMIN)
  removeItem(@Param('id') id: string) {
    return this.feesService.removeFeeItem(id);
  }

  @Get('structures')
  findAllStructures() {
    return this.feesService.findAllFeeStructures();
  }

  @Post('structures')
  @Roles(UserRole.ADMIN)
  createStructure(@Body() data: any) {
    return this.feesService.createFeeStructure(data);
  }

  @Delete('structures/:id')
  @Roles(UserRole.ADMIN)
  removeStructure(@Param('id') id: string) {
    return this.feesService.removeFeeStructure(id);
  }

  @Get('invoices')
  findAllInvoices() {
    return this.feesService.findAllInvoices();
  }

  @Post('invoices/generate')
  @Roles(UserRole.ADMIN)
  generateInvoices(@Body() data: { classLevelId: string; term: string; dueDate: string }) {
    return this.feesService.generateInvoicesForClass(data.classLevelId, data.term, new Date(data.dueDate));
  }

  @Post('payments/manual')
  @Roles(UserRole.ADMIN)
  recordManualPayment(@Body() data: { invoiceId: string; amount: number; method: string; reference: string }) {
    return this.feesService.recordManualPayment(data.invoiceId, data.amount, data.method, data.reference);
  }

  @Get('waivers')
  findAllWaivers() {
    return this.feesService.findAllWaivers();
  }

  @Post('waivers')
  @Roles(UserRole.ADMIN)
  createWaiver(@Body() data: any) {
    return this.feesService.createWaiver(data);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.feesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateFeeDto: UpdateFeeDto) {
    return this.feesService.update(id, updateFeeDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.feesService.remove(id);
  }
}
