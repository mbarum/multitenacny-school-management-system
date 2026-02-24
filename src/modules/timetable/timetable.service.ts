import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TimetableEntry } from './entities/timetable-entry.entity';
import { TenancyService } from 'src/core/tenancy/tenancy.service';
import { TenantAwareCrudService } from 'src/core/common/tenant-aware-crud.service';

@Injectable()
export class TimetableService extends TenantAwareCrudService<TimetableEntry> {
  constructor(
    @InjectRepository(TimetableEntry)
    private readonly timetableEntryRepository: Repository<TimetableEntry>,
    tenancyService: TenancyService,
  ) {
    super(timetableEntryRepository, tenancyService);
  }
}
