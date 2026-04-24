import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Application, ApplicationStatus } from './entities/application.entity';
import { Student } from '../students/entities/student.entity';
import { FinanceService } from '../finance/finance.service';
import { TenancyService } from 'src/core/tenancy/tenancy.service';
import { TenantAwareCrudService } from 'src/core/common/tenant-aware-crud.service';

@Injectable()
export class AdmissionsService extends TenantAwareCrudService<Application> {
  constructor(
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
    private readonly dataSource: DataSource,
    private readonly financeService: FinanceService,
    tenancyService: TenancyService,
  ) {
    super(applicationRepository, tenancyService);
  }

  async submitPublicApplication(tenantId: string, data: any) {
    const application = this.applicationRepository.create({
      ...data,
      tenantId,
      status: ApplicationStatus.PENDING,
    });
    return this.applicationRepository.save(application);
  }

  async approveAndEnroll(applicationId: string, enrollmentData: { classId: string; academicYearId: string; admissionNumber: string }) {
    const tenantId = this.tenancyService.getTenantId();
    const application = await this.applicationRepository.findOne({ where: { id: applicationId, tenantId } });

    if (!application) throw new BadRequestException('Application not found');
    if (application.status === ApplicationStatus.APPROVED) throw new BadRequestException('Already enrolled');

    return await this.dataSource.transaction(async (manager) => {
      // 1. Create Student (Parent details are embedded in Student entity in this system)
      const student = manager.create(Student, {
        tenantId,
        firstName: application.firstName,
        lastName: application.lastName,
        dateOfBirth: application.dateOfBirth,
        gender: application.gender,
        registrationNumber: enrollmentData.admissionNumber,
        classLevelId: enrollmentData.classId,
        academicYearId: enrollmentData.academicYearId,
        enrollmentDate: new Date() as any, // enrollmentDate might not be in entity, checking later
        status: 'Active',
        parentFirstName: application.parentFirstName,
        parentLastName: application.parentLastName,
        parentEmail: application.parentEmail,
        parentPhone: application.parentPhone,
      });
      const savedStudent = await manager.save(student);

      // 2. Update Application Status
      application.status = ApplicationStatus.APPROVED;
      await manager.save(application);

      // 3. Trigger Finance (Billing)
      try {
        await this.financeService.createInvoice({
          studentId: savedStudent.id,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          items: [
            { description: 'Admission Fees', amount: 5000 },
            { description: 'Term 1 Tuition', amount: 25000 },
          ]
        });
      } catch (error) {
        console.error('Invoice creation failed during enrolment', error);
      }

      return { student: savedStudent };
    });
  }
}
