import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Student, StudentStatus } from '../entities/student.entity';
import { SchoolClass } from '../entities/school-class.entity';
import { Transaction, TransactionType } from '../entities/transaction.entity';
import { FeeItem } from '../entities/fee-item.entity';
import { CreateStudentDto } from './dto/create-student.dto';
// Added CsvUtil import for export/import functionality
import { CsvUtil } from '../utils/csv.util';
// Added Buffer import for handling file uploads
import { Buffer } from 'buffer';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student) private studentsRepo: Repository<Student>,
    @InjectRepository(Transaction) private transRepo: Repository<Transaction>,
    private readonly entityManager: EntityManager,
  ) {}

  async create(dto: CreateStudentDto, schoolId: string): Promise<any> {
    return this.entityManager.transaction(async manager => {
        const schoolClass = await manager.findOne(SchoolClass, { 
            where: { id: dto.classId, schoolId: schoolId as any } 
        });
        
        if (!schoolClass) throw new NotFoundException(`Selected grade not found.`);

        // 1. Generate unique admission number
        const year = new Date().getFullYear();
        const count = await manager.count(Student, { where: { schoolId: schoolId as any } });
        const admissionNumber = `ADM-${year}-${String(count + 1).padStart(4, '0')}`;

        // 2. Persist Student Profile
        const student = manager.create(Student, {
            ...dto,
            admissionNumber,
            status: StudentStatus.Active,
            schoolClass,
            schoolId
        });
        const savedStudent = await manager.save(student);

        // 3. INTERCONNECTION: Automated Initial Billing
        // Scans the FeeStructure for mandatory items for this class
        const mandatoryFees = await manager.find(FeeItem, { 
            where: { schoolId: schoolId as any, isOptional: false },
            relations: ['classSpecificFees']
        });

        const initialInvoices = mandatoryFees
            .map(item => {
                const classFee = item.classSpecificFees.find(f => f.classId === dto.classId);
                if (!classFee || classFee.amount <= 0) return null;
                
                return manager.create(Transaction, {
                    student: savedStudent,
                    schoolId,
                    type: TransactionType.Invoice,
                    date: new Date().toISOString().split('T')[0],
                    description: `Automated Enrollment Billing: ${item.name}`,
                    amount: classFee.amount,
                });
            })
            .filter((inv): inv is Transaction => inv !== null);

        if (initialInvoices.length > 0) {
            await manager.save(Transaction, initialInvoices);
        }

        return { ...savedStudent, class: schoolClass.name };
    });
  }

  // Added findOne for individual student lookup with balance enrichment
  async findOne(id: string, schoolId: string): Promise<any> {
    const student = await this.studentsRepo.findOne({ 
        where: { id, schoolId: schoolId as any },
        relations: ['schoolClass']
    });
    if (!student) throw new NotFoundException('Student not found');
    
    const enriched = await this.enrichBalances([student], schoolId);
    return enriched[0];
  }

  async findAll(query: any, schoolId: string): Promise<any> {
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
    
    qb.orderBy('student.name', 'ASC');
    
    if (pagination === 'false') {
        const data = await qb.getMany();
        const enriched = await this.enrichBalances(data, schoolId);
        return { data: enriched, total: data.length };
    }

    qb.skip((page - 1) * limit).take(limit);
    const [data, total] = await qb.getManyAndCount();
    
    // Aggregated balance retrieval
    const enriched = await this.enrichBalances(data, schoolId);

    return { data: enriched, total, page, limit, last_page: Math.ceil(total / limit) };
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
              ...s,
              class: s.schoolClass?.name,
              balance: b ? parseFloat(b.balance) : 0
          };
      });
  }

  async update(id: string, dto: any, schoolId: string) {
      const student = await this.studentsRepo.findOne({ where: { id, schoolId: schoolId as any } });
      if (!student) throw new NotFoundException();
      Object.assign(student, dto);
      return this.studentsRepo.save(student);
  }

  // Added batchUpdate for bulk student status/class modifications
  async batchUpdate(updates: any[], schoolId: string): Promise<Student[]> {
    return this.entityManager.transaction(async manager => {
        const results: Student[] = [];
        for (const update of updates) {
            const { id, ...data } = update;
            const student = await manager.findOne(Student, { where: { id, schoolId: schoolId as any } });
            if (student) {
                Object.assign(student, data);
                results.push(await manager.save(student));
            }
        }
        return results;
    });
  }

  async remove(id: string, schoolId: string) {
      const result = await this.studentsRepo.delete({ id, schoolId: schoolId as any });
      if (result.affected === 0) throw new NotFoundException();
  }

  // Added exportStudents for CSV generation of student registry
  async exportStudents(schoolId: string): Promise<string> {
    const students = await this.studentsRepo.find({ 
        where: { schoolId: schoolId as any },
        relations: ['schoolClass']
    });
    
    const data = students.map(s => ({
      AdmissionNumber: s.admissionNumber,
      Name: s.name,
      Class: s.schoolClass?.name || 'N/A',
      Status: s.status,
      GuardianName: s.guardianName,
      GuardianContact: s.guardianContact,
      GuardianEmail: s.guardianEmail || '',
      DateOfBirth: s.dateOfBirth
    }));

    return CsvUtil.generate(data, ['AdmissionNumber', 'Name', 'Class', 'Status', 'GuardianName', 'GuardianContact', 'GuardianEmail', 'DateOfBirth']);
  }

  // Added importStudents for bulk enrollment via CSV
  async importStudents(buffer: Buffer, schoolId: string): Promise<any> {
    const records = await CsvUtil.parse(buffer);
    let imported = 0;
    let failed = 0;
    const errors: any[] = [];

    for (const [index, record] of records.entries()) {
      try {
        const schoolClass = await this.entityManager.getRepository(SchoolClass).findOne({ 
            where: { name: record.Class, schoolId: schoolId as any } 
        });
        
        if (!schoolClass) throw new Error(`Class "${record.Class}" not found`);

        const dto: CreateStudentDto = {
          name: record.Name,
          classId: schoolClass.id,
          guardianName: record.GuardianName,
          guardianContact: String(record.GuardianContact),
          guardianAddress: record.GuardianAddress || 'N/A',
          guardianEmail: record.GuardianEmail,
          emergencyContact: String(record.EmergencyContact || record.GuardianContact),
          dateOfBirth: record.DateOfBirth,
        };

        await this.create(dto, schoolId);
        imported++;
      } catch (err) {
        failed++;
        errors.push({ row: index + 2, name: record.Name || 'Unknown', error: err instanceof Error ? err.message : 'Unknown error' });
      }
    }

    return { imported, failed, errors };
  }
}
