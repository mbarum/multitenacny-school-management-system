import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Section } from './entities/section.entity';
import { TenancyService } from 'src/core/tenancy/tenancy.service';
import { TenantAwareCrudService } from 'src/core/common/tenant-aware-crud.service';

@Injectable()
export class SectionsService extends TenantAwareCrudService<Section> {
  constructor(
    @InjectRepository(Section)
    private readonly sectionRepository: Repository<Section>,
    tenancyService: TenancyService,
  ) {
    super(sectionRepository, tenancyService);
  }
}
