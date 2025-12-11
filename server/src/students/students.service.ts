
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { GetStudentsDto } from './dto/get-students.dto';
import { Student, StudentStatus } from '../entities/student.entity';
import { SchoolClass } from '../entities/school-class.entity';
import { Transaction, TransactionType } from '../entities/transaction.entity';
import { CsvUtil } from '../utils/csv.util';
import { Buffer } from 'buffer';

@Injectable()
export class StudentsService {
  private readonly logger = new Logger(StudentsService.name);

  constructor(
    @InjectRepository(Student)
    private studentsRepository: Repository<Student>,
    @InjectRepository(SchoolClass)
    private classesRepository: Repository<SchoolClass>,
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
  ) {}

  private mapStudentToDto(student: Student): any {
    if (!student) return null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { schoolClass, ...rest } = student;
    return {
      ...rest,
      class: schoolClass ? schoolClass.name : null,
      classId: schoolClass ? schoolClass.id : null,
      balance: student.balance !== undefined ? Number(student.balance) : 0,
    };
  }

  // --- Scoped Methods ---

  async create(createStudentDto: CreateStudentDto, schoolId: string): Promise<any> {
    const { classId, ...studentData } = createStudentDto;

    // Verify Class belongs to School
    const schoolClass = await this.classesRepository.findOne({ where: { id: classId, schoolId: schoolId as any } }); // Assume Class entity also has schoolId
    if (!schoolClass) {
        throw new NotFoundException(`Class not found or does not belong to this school.`);
    }

    // Robust Admission Number Generation
    const year = new Date().getFullYear();
    const lastStudent = await this.studentsRepository.findOne({
      where: { schoolId: schoolId as any },
      order: { createdAt: 'DESC' }
    });

    let nextSequence = 1;
    if (lastStudent && lastStudent.admissionNumber) {
        // Try to parse format ADM-YYYY-0001
        const parts = lastStudent.admissionNumber.split('-');
        if (parts.length >= 3) {
            const lastSeq = parseInt(parts[2]);
            if (!isNaN(lastSeq)) {
                nextSequence = lastSeq + 1;
            }
        }
    }
    const admissionNumber = `ADM-${year}-${String(nextSequence).padStart(4, '0')}`;

    const student = this.studentsRepository.create({
        ...studentData,
        admissionNumber,
        status: StudentStatus.Active,
        schoolClass: schoolClass,
        profileImage: studentData.profileImage || 'https://i.imgur.com/S5o7W44.png',
        school: { id: schoolId } as any // Link to School
    });

    const savedStudent = await this.studentsRepository.save(student);
    return this.mapStudentToDto(savedStudent);
  }

  async findAll(query: GetStudentsDto, schoolId: string): Promise<any> {
    const { page = 1, limit = 10, search, classId, status, pagination, mode } = query;
    
    const qb = this.studentsRepository.createQueryBuilder('student');
    qb.leftJoinAndSelect('student.schoolClass', 'schoolClass');
    
    // CRITICAL: Filter by School
    qb.where('student.schoolId = :schoolId', { schoolId });

    if (search) {
      qb.andWhere('(student.name LIKE :search OR student.admissionNumber LIKE :search OR student.guardianName LIKE :search)', { search: `%${search}%` });
    }

    if (classId && classId !== 'all') {
      qb.andWhere('schoolClass.id = :classId', { classId });
    }

    if (status && status !== 'all') {
        qb.andWhere('student.status = :status', { status });
    }

    qb.orderBy('student.name', 'ASC');

    if (mode === 'minimal') {
        qb.select(['student.id', 'student.name', 'student.admissionNumber', 'student.guardianEmail', 'student.status']);
        qb.addSelect(['schoolClass.name', 'schoolClass.id']);
        const students = await qb.getMany();
        return students.map(s => ({ ...s, class: s.schoolClass?.name }));
    }

    if (pagination === 'false') {
        const students = await qb.getMany();
        return this.enrichWithBalances(students);
    }

    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);

    const [students, total] = await qb.getManyAndCount();
    const enrichedData = await this.enrichWithBalances(students);

    return {
      data: enrichedData,
      total,
      page,
      limit,
      last_page: Math.ceil(total / limit),
    };
  }

  private async enrichWithBalances(students: Student[]): Promise<any[]> {
      if (!students || students.length === 0) return [];
      // Balance calculation logic stays same, just filtering by student IDs which are already filtered by school
      try {
          const ids = students.map(s => s.id);
          const balances = await this.transactionsRepository
            .createQueryBuilder('t')
            .leftJoin('t.student', 's')
            .select('s.id', 'studentId')
            .addSelect('SUM(CASE WHEN t.type IN (:...debits) THEN t.amount ELSE -t.amount END)', 'balance')
            .where('s.id IN (:...ids)', { ids })
            .setParameters({ debits: [TransactionType.Invoice, TransactionType.ManualDebit] })
            .groupBy('s.id')
            .getRawMany();

          const balanceMap = new Map<string, number>();
          balances.forEach(b => balanceMap.set(b.studentId, parseFloat(b.balance) || 0));

          return students.map(student => {
              student.balance = balanceMap.get(student.id) || 0;
              return this.mapStudentToDto(student);
          });
      } catch (error) {
          return students.map(s => { s.balance = 0; return this.mapStudentToDto(s); });
      }
  }

  async findOne(id: string, schoolId: string): Promise<any> {
    const student = await this.studentsRepository.findOne({ 
      where: { id, schoolId: schoolId as any }, // Ensure school ownership
      relations: ['schoolClass'] 
    });
    if (!student) throw new NotFoundException(`Student not found`);
    return this.mapStudentToDto(student);
  }

  async update(id: string, updateStudentDto: UpdateStudentDto, schoolId: string): Promise<any> {
    // Check existence and ownership
    const existing = await this.studentsRepository.findOne({ where: { id, schoolId: schoolId as any } });
    if (!existing) throw new NotFoundException(`Student not found`);

    // Preload merges the new data into the existing entity
    const student = await this.studentsRepository.preload({
      id,
      ...updateStudentDto,
    });

    if (updateStudentDto.classId) {
        const schoolClass = await this.classesRepository.findOne({ where: { id: updateStudentDto.classId, schoolId: schoolId as any } });
        if (!schoolClass) throw new NotFoundException(`Class not found.`);
        student!.schoolClass = schoolClass;
    }
    
    const saved = await this.studentsRepository.save(student!);
    return this.findOne(saved.id, schoolId);
  }
  
  async batchUpdate(updates: UpdateStudentDto[], schoolId: string): Promise<any[]> {
    const updatedStudents: any[] = [];
    for (const updateDto of updates) {
      if (!updateDto.id) continue;
      try {
          // Re-use single update to ensure safety per record
          const student = await this.update(updateDto.id, updateDto, schoolId);
          updatedStudents.push(student);
      } catch (error) {
          this.logger.error(`Failed to batch update student ${updateDto.id}`, error);
      }
    }
    return updatedStudents;
  }

  async remove(id: string, schoolId: string): Promise<void> {
    const result = await this.studentsRepository.delete({ id, schoolId: schoolId as any });
    if (result.affected === 0) throw new NotFoundException(`Student not found`);
  }

  async exportStudents(schoolId: string): Promise<string> {
    const students = await this.studentsRepository.find({ 
        where: { schoolId: schoolId as any },
        relations: ['schoolClass'] 
    });
    const data = students.map(s => ({
      Name: s.name,
      AdmissionNumber: s.admissionNumber,
      Class: s.schoolClass ? s.schoolClass.name : '',
      DOB: s.dateOfBirth,
      Guardian: s.guardianName,
      GuardianContact: s.guardianContact,
      GuardianEmail: s.guardianEmail,
    }));
    return CsvUtil.generate(data, ['Name', 'AdmissionNumber', 'Class', 'DOB', 'Guardian', 'GuardianContact', 'GuardianEmail']);
  }

  async importStudents(buffer: Buffer, schoolId: string): Promise<{ imported: number; failed: number; errors: any[] }> {
    const records = await CsvUtil.parse(buffer);
    let imported = 0;
    let failed = 0;
    const errors: any[] = [];

    // Pre-fetch classes for this school to avoid N+1 queries
    const classes = await this.classesRepository.find({ where: { schoolId: schoolId as any } });
    const classMap = new Map(classes.map(c => [c.name.toLowerCase(), c]));

    for (const [index, record] of records.entries()) {
      try {
        const rowNumber = index + 1;
        
        // Basic Validation
        if (!record.name || !record.guardianName || !record.class) {
            throw new Error('Missing required fields (name, guardianName, or class)');
        }

        // Find Class
        const targetClass = classMap.get(record.class.toString().toLowerCase());
        if (!targetClass) {
            throw new Error(`Class '${record.class}' not found. Please create it first.`);
        }

        // Check for duplicates (Simple check by name + guardian contact)
        const existing = await this.studentsRepository.findOne({
            where: { 
                name: record.name, 
                guardianContact: record.guardianContact,
                schoolId: schoolId as any 
            }
        });

        if (existing) {
            throw new Error('Student already exists (Name + Guardian Contact match)');
        }

        // Generate Admission Number
        const count = await this.studentsRepository.count({ where: { schoolId: schoolId as any } });
        const year = new Date().getFullYear();
        // Add random suffix to avoid race conditions in simple imports
        const admissionNumber = `ADM-${year}-${String(count + imported + 1).padStart(4, '0')}-${Math.floor(Math.random() * 1000)}`;

        const student = this.studentsRepository.create({
            name: record.name,
            guardianName: record.guardianName,
            guardianContact: record.guardianContact || '',
            guardianAddress: record.guardianAddress || '',
            guardianEmail: record.guardianEmail || '',
            emergencyContact: record.emergencyContact || '',
            dateOfBirth: record.dateOfBirth || new Date().toISOString().split('T')[0],
            admissionNumber,
            status: StudentStatus.Active,
            schoolClass: targetClass,
            school: { id: schoolId } as any
        });
        
        await this.studentsRepository.save(student);
        imported++;
      } catch (err) {
        failed++;
        errors.push({ row: index + 1, name: record.name || 'Unknown', error: err instanceof Error ? err.message : 'Unknown error' });
      }
    }

    return { imported, failed, errors };
  }
}
