import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Staff } from './entities/staff.entity';
import { TenancyService } from 'src/core/tenancy/tenancy.service';
import { TenantAwareCrudService } from 'src/core/common/tenant-aware-crud.service';

@Injectable()
export class StaffService extends TenantAwareCrudService<Staff> {
  constructor(
    @InjectRepository(Staff)
    private readonly staffRepository: Repository<Staff>,
    tenancyService: TenancyService,
  ) {
    super(staffRepository, tenancyService);
  }
}
