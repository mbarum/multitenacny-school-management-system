import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AcademicYear } from './entities/academic-year.entity';
import { TenancyService } from 'src/core/tenancy/tenancy.service';
import { TenantAwareCrudService } from 'src/core/common/tenant-aware-crud.service';

@Injectable()
export class AcademicYearsService extends TenantAwareCrudService<AcademicYear> {
  constructor(
    @InjectRepository(AcademicYear)
    private readonly academicYearRepository: Repository<AcademicYear>,
    tenancyService: TenancyService,
  ) {
    super(academicYearRepository, tenancyService);
  }

  async setCurrent(id: string): Promise<void> {
    const tenantId = this.tenancyService.getTenantId();
    // Unset current for all
    await this.academicYearRepository.update({ tenantId }, { isCurrent: false });
    // Set current for this one
    await this.academicYearRepository.update({ id, tenantId }, { isCurrent: true });
  }
}
