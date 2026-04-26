import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from 'src/common/user-role.enum';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PayrollService } from './payroll.service';
import { CreatePayrollDto } from './dto/create-payroll.dto';
import { UpdatePayrollDto } from './dto/update-payroll.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payrolls')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() createPayrollDto: CreatePayrollDto) {
    return this.payrollService.create(createPayrollDto);
  }

  @Get()
  findAll() {
    return this.payrollService.findAll();
  }

  // Item Definition Management
  @Get('definitions')
  findAllDefinitions() {
    return this.payrollService.findAllItemDefs();
  }

  @Post('definitions')
  @Roles(UserRole.ADMIN)
  createDefinition(@Body() data: any) {
    return this.payrollService.createItemDef(data);
  }

  @Delete('definitions/:id')
  @Roles(UserRole.ADMIN)
  removeDefinition(@Param('id') id: string) {
    return this.payrollService.deleteItemDef(id);
  }

  // Staff Payroll Config
  @Get('staff/:staffId/config')
  getStaffConfig(@Param('staffId') staffId: string) {
    return this.payrollService.getStaffPayrollConfig(staffId);
  }

  @Post('staff/:staffId/assign/:itemDefId')
  @Roles(UserRole.ADMIN)
  assignItem(@Param('staffId') staffId: string, @Param('itemDefId') itemDefId: string, @Body('customValue') customValue?: number) {
    return this.payrollService.assignItemToStaff(staffId, itemDefId, customValue);
  }

  @Delete('staff/:staffId/remove/:itemDefId')
  @Roles(UserRole.ADMIN)
  removeItem(@Param('staffId') staffId: string, @Param('itemDefId') itemDefId: string) {
    return this.payrollService.removeItemFromStaff(staffId, itemDefId);
  }

  // Payroll Generation
  @Post('generate')
  @Roles(UserRole.ADMIN)
  generate(@Body('staffId') staffId: string, @Body('payDate') payDate: string) {
    return this.payrollService.generatePayrollForStaff(staffId, new Date(payDate));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.payrollService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updatePayrollDto: UpdatePayrollDto) {
    return this.payrollService.update(id, updatePayrollDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.payrollService.remove(id);
  }
}
