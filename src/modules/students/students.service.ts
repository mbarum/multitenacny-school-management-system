import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Student } from './entities/student.entity';
import { TenancyService } from 'src/core/tenancy/tenancy.service';
import { TenantAwareCrudService } from 'src/core/common/tenant-aware-crud.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { BulkUpdateStudentDto } from './dto/bulk-update-student.dto';

@Injectable()
export class StudentsService extends TenantAwareCrudService<Student> {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    tenancyService: TenancyService,
  ) {
    super(studentRepository, tenancyService);
  }

  findAll(): Promise<Student[]> {
    return this.studentRepository.find({
      where: { tenantId: this.tenancyService.getTenantId() },
      relations: ['classLevel', 'section', 'academicYear'],
    });
  }

  async findOne(id: string): Promise<Student> {
    const entity = await this.studentRepository.findOne({
      where: { id, tenantId: this.tenancyService.getTenantId() },
      relations: ['classLevel', 'section', 'academicYear'],
    });
    if (!entity) {
      throw new NotFoundException(`Student with id ${id} not found`);
    }
    return entity;
  }

  async bulkUpdate(bulkUpdateDto: BulkUpdateStudentDto): Promise<void> {
    const { studentIds, ...updateData } = bulkUpdateDto;
    if (!studentIds || studentIds.length === 0) return;
    
    await this.studentRepository.update(
      { 
        id: In(studentIds), 
        tenantId: this.tenancyService.getTenantId() 
      },
      updateData
    );
  }

  override async create(createDto: CreateStudentDto): Promise<Student> {
    if (createDto.registrationNumber) {
      const existing = await this.studentRepository.findOne({
        where: {
          tenantId: this.tenancyService.getTenantId(),
          registrationNumber: createDto.registrationNumber,
        },
      });
      if (existing) {
        throw new BadRequestException('A student with this registration number already exists.');
      }
    }
    return super.create(createDto);
  }

  override async update(id: string, updateDto: UpdateStudentDto): Promise<Student> {
    if (updateDto.registrationNumber) {
      const existing = await this.studentRepository.findOne({
        where: {
          tenantId: this.tenancyService.getTenantId(),
          registrationNumber: updateDto.registrationNumber,
        },
      });
      if (existing && existing.id !== id) {
        throw new BadRequestException('A student with this registration number already exists.');
      }
    }
    return super.update(id, updateDto);
  }
}
