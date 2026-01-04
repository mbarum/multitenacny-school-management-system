import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { GetStudentsDto } from './dto/get-students.dto';
import { Student, StudentStatus } from '../entities/student.entity';
import { SchoolClass } from '../entities/school-class.entity';
import { Transaction, TransactionType } from '../entities/transaction.entity';
import { FeeItem } from '../entities/fee-item.entity';
import { CsvUtil } from '../utils/csv.util';
// Fix: Imported Buffer from 'buffer' to resolve 'Cannot find name Buffer'
import { Buffer } from 'buffer';

@Injectable()
export class StudentsService {
  private readonly logger = new Logger(StudentsService.name);

  constructor(
    @InjectRepository(Student) private studentsRepo: Repository<Student>,
    @InjectRepository(SchoolClass) private classesRepo: Repository<SchoolClass>,
    @InjectRepository(Transaction) private transRepo: Repository<Transaction>,
    private readonly entityManager: EntityManager,
  ) {}

  async create(dto: CreateStudentDto, schoolId: string): Promise<any> {
    return this.entityManager.transaction(async manager => {
        const schoolClass = await manager.findOne(SchoolClass, { 
            where: { id: dto.classId, schoolId: schoolId as any } 
        });
        
        if (!schoolClass) throw new NotFoundException(`Class not found`);

        // 1. Generate unique admission number
        const year = new Date().getFullYear();
        const count = await manager.count(Student, { where: { schoolId: schoolId as any } });
        const admissionNumber = `ADM-${year}-${String(count + 1).padStart(4, '0')}`;

        // 2. Persist Student
        const student = manager.create(Student, {
            ...dto,
            admissionNumber,
            status: StudentStatus.Active,
            schoolClass,
            schoolId
        });
        const savedStudent = await manager.save(student);

        // 3. Automate Initial Billing (Atomic)
        const feeItems = await manager.find(FeeItem, { 
            where: { schoolId: schoolId as any, isOptional: false },
            relations: ['classSpecificFees']
        });

        const initialInvoices = feeItems
            .map(item => {
                const classFee = item.classSpecificFees.find(f => f.classId === dto.classId);
                if (!classFee || classFee.amount <= 0) return null;
                
                return manager.create(Transaction, {
                    student: savedStudent,
                    schoolId,
                    type: TransactionType.Invoice,
                    date: new Date().toISOString().split('T')[0],
                    description: `Initial Billing: ${item.name}`,
                    amount: classFee.amount,
                });
            })
            .filter((inv): inv is Transaction => inv !== null); // Fix: Type guard for Transaction array

        if (initialInvoices.length > 0) {
            await manager.save(Transaction, initialInvoices);
        }

        return this.mapToDto(savedStudent);
    });
  }

  async findAll(query: GetStudentsDto, schoolId: string): Promise<any> {
    const { page = 1, limit = 15, search, classId, status } = query;
    
    const qb = this.studentsRepo.createQueryBuilder('student')
      .leftJoinAndSelect('student.schoolClass', 'class')
      .where('student.schoolId = :schoolId', { schoolId });

    if (search) {
      qb.andWhere('(student.name LIKE :s OR student.admissionNumber LIKE :s)', { s: `%${search}%` });
    }
    if (classId && classId !== 'all') {
      qb.andWhere('class.id = :classId', { classId });
    }
    if (status && status !== 'all') {
      qb.andWhere('student.status = :status', { status });
    }

    qb.orderBy('student.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    
    // Enrich with balances efficiently using raw SQL aggregation for speed
    const enriched = await this.enrichBalances(data, schoolId);

    return {
      data: enriched,
      total,
      page,
      limit,
      last_page: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, schoolId: string): Promise<any> {
      const student = await this.studentsRepo.findOne({
          where: { id, schoolId: schoolId as any },
          relations: ['schoolClass']
      });
      if (!student) throw new NotFoundException();
      const enriched = await this.enrichBalances([student], schoolId);
      return enriched[0];
  }

  async batchUpdate(updates: UpdateStudentDto[], schoolId: string) {
      return this.entityManager.transaction(async manager => {
          const results: Student[] = []; // Fix: Explicit typing to avoid never[]
          for (const update of updates) {
              if (!update.id) continue;
              const student = await manager.findOne(Student, { where: { id: update.id, schoolId: schoolId as any } });
              if (student) {
                  Object.assign(student, update);
                  results.push(await manager.save(student));
              }
          }
          return results;
      });
  }

  async exportStudents(schoolId: string): Promise<string> {
      const students = await this.studentsRepo.find({
          where: { schoolId: schoolId as any },
          relations: ['schoolClass']
      });
      const data = students.map(s => ({
          'Admission Number': s.admissionNumber,
          'Name': s.name,
          'Class': s.schoolClass?.name || 'N/A',
          'Status': s.status,
          'Guardian Name': s.guardianName,
          'Guardian Contact': s.guardianContact,
          'Guardian Email': s.guardianEmail
      }));
      return CsvUtil.generate(data, ['Admission Number', 'Name', 'Class', 'Status', 'Guardian Name', 'Guardian Contact', 'Guardian Email']);
  }

  // Fix: Buffer type used here requires import from 'buffer'
  async importStudents(buffer: Buffer, schoolId: string) {
      const records = await CsvUtil.parse(buffer);
      let imported = 0;
      let failed = 0;
      const errors: { row: number; name: string; error: string }[] = []; // Fix: Explicit typing

      for (let i = 0; i < records.length; i++) {
          const record = records[i];
          try {
              const dto: CreateStudentDto = {
                  name: record.Name,
                  classId: record.ClassId, 
                  guardianName: record.GuardianName,
                  guardianContact: record.GuardianContact,
                  guardianAddress: record.GuardianAddress || '',
                  guardianEmail: record.GuardianEmail,
                  emergencyContact: record.EmergencyContact || record.GuardianContact,
                  dateOfBirth: record.DateOfBirth || '2000-01-01'
              };
              await this.create(dto, schoolId);
              imported++;
          } catch (err: any) {
              failed++;
              errors.push({ row: i + 2, name: record.Name, error: err.message });
          }
      }
      return { imported, failed, errors };
  }

  private async enrichBalances(students: Student[], schoolId: string) {
      if (students.length === 0) return [];
      const ids = students.map(s => s.id);
      
      const balances = await this.transRepo.createQueryBuilder('t')
          .select('t.studentId', 'id')
          .addSelect("SUM(CASE WHEN t.type IN ('Invoice', 'ManualDebit') THEN t.amount ELSE -t.amount END)", 'balance')
          .where('t.studentId IN (:...ids)', { ids })
          .groupBy('t.studentId')
          .getRawMany();

      return students.map(s => {
          const b = balances.find(row => row.id === s.id);
          return {
              ...this.mapToDto(s),
              balance: b ? parseFloat(b.balance) : 0
          };
      });
  }

  private mapToDto(s: Student) {
      return { ...s, class: s.schoolClass?.name, classId: s.schoolClass?.id };
  }

  async update(id: string, dto: UpdateStudentDto, schoolId: string) {
      const student = await this.studentsRepo.findOne({ where: { id, schoolId: schoolId as any } });
      if (!student) throw new NotFoundException();
      Object.assign(student, dto);
      return this.studentsRepo.save(student);
  }

  async remove(id: string, schoolId: string) {
      const result = await this.studentsRepo.delete({ id, schoolId: schoolId as any });
      if (result.affected === 0) throw new NotFoundException();
  }
}