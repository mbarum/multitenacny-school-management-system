import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClassLevel } from './entities/class-level.entity';
import { TenancyService } from 'src/core/tenancy/tenancy.service';
import { TenantAwareCrudService } from 'src/core/common/tenant-aware-crud.service';

@Injectable()
export class ClassLevelsService extends TenantAwareCrudService<ClassLevel> {
  constructor(
    @InjectRepository(ClassLevel)
    private readonly classLevelRepository: Repository<ClassLevel>,
    tenancyService: TenancyService,
  ) {
    super(classLevelRepository, tenancyService);
  }

  async findAllWithSections(): Promise<ClassLevel[]> {
    return this.classLevelRepository.find({
      where: { tenantId: this.tenancyService.getTenantId() },
      relations: [
        'sections',
        'headTeacher',
        'academicYear',
        'sections.classTeacher',
        'sections.academicYear',
      ],
    });
  }
}
