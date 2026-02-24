import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './entities/student.entity';
import { TenancyService } from 'src/core/tenancy/tenancy.service';
import { TenantAwareCrudService } from 'src/core/common/tenant-aware-crud.service';

@Injectable()
export class StudentsService extends TenantAwareCrudService<Student> {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    tenancyService: TenancyService,
  ) {
    super(studentRepository, tenancyService);
  }

  // Complex, student-specific business logic would go here.
  // For example: promoteToNextClass(studentId: string) { ... }
}
