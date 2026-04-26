import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payroll } from './entities/payroll.entity';
import { PayrollItemDefinition } from './entities/payroll-item-definition.entity';
import { StaffPayrollItem } from './entities/staff-payroll-item.entity';
import { TenancyService } from 'src/core/tenancy/tenancy.service';
import { TenantAwareCrudService } from 'src/core/common/tenant-aware-crud.service';
import { Staff } from '../staff/entities/staff.entity';

@Injectable()
export class PayrollService extends TenantAwareCrudService<Payroll> {
  constructor(
    @InjectRepository(Payroll)
    private readonly payrollRepository: Repository<Payroll>,
    @InjectRepository(PayrollItemDefinition)
    private readonly itemDefRepository: Repository<PayrollItemDefinition>,
    @InjectRepository(StaffPayrollItem)
    private readonly staffItemRepository: Repository<StaffPayrollItem>,
    @InjectRepository(Staff)
    private readonly staffRepository: Repository<Staff>,
    tenancyService: TenancyService,
  ) {
    super(payrollRepository, tenancyService);
  }

  async findAll(): Promise<Payroll[]> {
    return this.payrollRepository.find({
      where: { tenantId: this.tenancyService.getTenantId() },
      relations: ['staff'],
      order: { payDate: 'DESC' },
    });
  }

  // Item Definition Management
  async createItemDef(data: Partial<PayrollItemDefinition>) {
    const def = this.itemDefRepository.create({
      ...data,
      tenantId: this.tenancyService.getTenantId(),
    });
    return this.itemDefRepository.save(def);
  }

  async findAllItemDefs() {
    return this.itemDefRepository.find({
      where: { tenantId: this.tenancyService.getTenantId() },
    });
  }

  async deleteItemDef(id: string) {
    return this.itemDefRepository.delete({
      id,
      tenantId: this.tenancyService.getTenantId(),
    });
  }

  // Staff Payroll Config
  async assignItemToStaff(staffId: string, itemDefId: string, customValue?: number) {
    const existing = await this.staffItemRepository.findOne({
      where: { staffId, itemDefinitionId: itemDefId, tenantId: this.tenancyService.getTenantId() },
    });

    if (existing) {
      existing.customValue = customValue;
      return this.staffItemRepository.save(existing);
    }

    const newItem = this.staffItemRepository.create({
      staffId,
      itemDefinitionId: itemDefId,
      customValue,
      tenantId: this.tenancyService.getTenantId(),
    });
    return this.staffItemRepository.save(newItem);
  }

  async removeItemFromStaff(staffId: string, itemDefId: string) {
    return this.staffItemRepository.delete({
      staffId,
      itemDefinitionId: itemDefId,
      tenantId: this.tenancyService.getTenantId(),
    });
  }

  async getStaffPayrollConfig(staffId: string) {
    return this.staffItemRepository.find({
      where: { staffId, tenantId: this.tenancyService.getTenantId() },
      relations: ['itemDefinition'],
    });
  }

  // Payroll Generation
  async generatePayrollForStaff(staffId: string, payDate: Date) {
    const staff = await this.staffRepository.findOne({ where: { id: staffId } });
    if (!staff) throw new Error('Staff not found');

    const config = await this.getStaffPayrollConfig(staffId);
    const basicSalary = Number(staff.basicSalary || 0);

    let grossSalary = basicSalary;
    let netSalary = basicSalary;
    const details = {
      basicSalary,
      allowances: [],
      deductions: [],
    };

    for (const configItem of config) {
      const def = configItem.itemDefinition;
      const valueToUse = Number(configItem.customValue || def.value);
      let calculatedAmount = 0;

      if (def.computationType === 'PERCENTAGE') {
        calculatedAmount = (valueToUse / 100) * basicSalary;
      } else {
        calculatedAmount = valueToUse;
      }

      const itemDetail = {
        name: def.name,
        amount: calculatedAmount,
        type: def.type,
      };

      if (def.type === 'ALLOWANCE') {
        grossSalary += calculatedAmount;
        netSalary += calculatedAmount;
        details.allowances.push(itemDetail);
      } else {
        netSalary -= calculatedAmount;
        details.deductions.push(itemDetail);
      }
    }

    const payroll = this.payrollRepository.create({
      staffId,
      basicSalary,
      grossSalary,
      netSalary,
      details,
      payDate,
      status: 'unpaid',
      tenantId: this.tenancyService.getTenantId(),
    });

    return this.payrollRepository.save(payroll);
  }
}
