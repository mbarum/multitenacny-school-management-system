import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportCard } from './entities/report-card.entity';
import { TenancyService } from 'src/core/tenancy/tenancy.service';
import { TenantAwareCrudService } from 'src/core/common/tenant-aware-crud.service';

@Injectable()
export class ReportCardsService extends TenantAwareCrudService<ReportCard> {
  constructor(
    @InjectRepository(ReportCard)
    private readonly reportCardRepository: Repository<ReportCard>,
    tenancyService: TenancyService,
  ) {
    super(reportCardRepository, tenancyService);
  }
}
