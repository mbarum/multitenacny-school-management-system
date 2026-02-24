import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Fee } from './entities/fee.entity';
import { TenancyService } from 'src/core/tenancy/tenancy.service';
import { TenantAwareCrudService } from 'src/core/common/tenant-aware-crud.service';

@Injectable()
export class FeesService extends TenantAwareCrudService<Fee> {
  constructor(
    @InjectRepository(Fee)
    private readonly feeRepository: Repository<Fee>,
    tenancyService: TenancyService,
  ) {
    super(feeRepository, tenancyService);
  }
}
