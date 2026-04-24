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

  async create(createDto: any): Promise<AcademicYear> {
    if (createDto.startDate) {
      createDto.startDate = this.formatDate(createDto.startDate);
    }
    if (createDto.endDate) {
      createDto.endDate = this.formatDate(createDto.endDate);
    }
    return super.create(createDto);
  }

  async update(id: string, updateDto: any): Promise<AcademicYear> {
    if (updateDto.startDate) {
      updateDto.startDate = this.formatDate(updateDto.startDate);
    }
    if (updateDto.endDate) {
      updateDto.endDate = this.formatDate(updateDto.endDate);
    }
    return super.update(id, updateDto);
  }

  private formatDate(date: any): string {
    if (typeof date === 'string') {
      return date.split('T')[0];
    }
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    return date;
  }

  async setCurrent(id: string): Promise<void> {
    const tenantId = this.tenancyService.getTenantId();
    // Unset current for all
    await this.academicYearRepository.update({ tenantId }, { isCurrent: false });
    // Set current for this one
    await this.academicYearRepository.update({ id, tenantId }, { isCurrent: true });
  }
}
