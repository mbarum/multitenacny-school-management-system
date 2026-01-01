
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

  async create(createStudentDto: CreateStudentDto, schoolId: string): Promise<any> {
    const { classId, ...studentData } = createStudentDto;

    const schoolClass = await this.classesRepository.findOne({ where: { id: classId, schoolId: schoolId as any } });
    if (!schoolClass) {
        throw new NotFoundException(`Class not found or does not belong to this school.`);
    }

    const year = new Date().getFullYear();
    const lastStudent = await this.studentsRepository.findOne({
      where: { schoolId: schoolId as any },
      order: { createdAt: 'DESC' }
    });

    let nextSequence = 1;
    if (lastStudent && lastStudent.admissionNumber) {
        const parts = lastStudent.admissionNumber.split('-');
        if (parts.length >= 3) {
            const lastSeq = parseInt(parts[2]);
            if (!isNaN(lastSeq)) nextSequence = lastSeq + 1;
        }
    }
    const admissionNumber = `ADM-${year}-${String(nextSequence).padStart(4, '0')}`;

    const student = this.studentsRepository.create({
        ...studentData,
        admissionNumber,
        status: StudentStatus.Active,
        schoolClass: schoolClass,
        profileImage: studentData.profileImage || 'https://i.imgur.com/S5o7W44.png',
        school: { id: schoolId } as any
    });

    const savedStudent = await this.studentsRepository.save(student);
    return this.mapStudentToDto(savedStudent);
  }

  async findAll(query: GetStudentsDto, schoolId: string): Promise<any> {
    const { page = 1, limit = 10, search, classId, status, pagination, mode } = query;
    
    const qb = this.studentsRepository.createQueryBuilder('student');
    qb.leftJoinAndSelect('student.schoolClass', 'schoolClass');
    
    // CRITICAL: Scope search to school
    qb.where('student.schoolId = :schoolId', { schoolId });

    if (search && search.trim() !== '') {
      qb.andWhere('(student.name LIKE :search OR student.admissionNumber LIKE :search OR student.guardianName LIKE :search)', { search: `%${search}%` });
    }

    if (classId && classId !== 'all') {
      qb.andWhere('schoolClass.id = :classId', { classId });
    }

    // Normalization: Only filter by status if it's a known StudentStatus value
    if (status && status !== 'all' && Object.values(StudentStatus).includes(status as StudentStatus)) {
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
        return this.enrichWithBalances(students, schoolId);
    }

    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);

    const [students, total] = await qb.getManyAndCount();
    const enrichedData = await this.enrichWithBalances(students, schoolId);

    return {
      data: enrichedData,
      total,
      page,
      limit,
      last_page: Math.ceil(total / limit),
    };
  }

  private async enrichWithBalances(students: Student[], schoolId: string): Promise<any[]> {
      if (!students || students.length === 0) return [];
      
      try {
          const ids = students.map(s => s.id);
          
          // Using a precise QueryBuilder approach for cross-tenant safety in balance calculation
          const balances = await this.transactionsRepository
            .createQueryBuilder('t')
            .select('t.studentId', 'studentId')
            .addSelect('SUM(CASE WHEN t.type IN (:...debits) THEN t.amount ELSE -t.amount END)', 'balance')
            .where('t.studentId IN (:...ids)', { ids })
            .andWhere('t.schoolId = :schoolId', { schoolId })
            .setParameters({ debits: [TransactionType.Invoice, TransactionType.ManualDebit] })
            .groupBy('t.studentId')
            .getRawMany();

          const balanceMap = new Map<string, number>();
          balances.forEach(b => balanceMap.set(b.studentId, parseFloat(b.balance) || 0));

          return students.map(student => {
              student.balance = balanceMap.get(student.id) || 0;
              return this.mapStudentToDto(student);
          });
      } catch (error) {
          this.logger.error(`Balance calculation drift detected for school ${schoolId}`, error);
          return students.map(s => { s.balance = 0; return this.mapStudentToDto(s); });
      }
  }

  async findOne(id: string, schoolId: string): Promise<any> {
    const student = await this.studentsRepository.findOne({ 
      where: { id, schoolId: schoolId as any },
      relations: ['schoolClass'] 
    });
    if (!student) throw new NotFoundException(`Student record not found in your institution.`);
    return this.mapStudentToDto(student);
  }

  async update(id: string, updateStudentDto: UpdateStudentDto, schoolId: string): Promise<any> {
    const existing = await this.studentsRepository.findOne({ where: { id, schoolId: schoolId as any } });
    if (!existing) throw new NotFoundException(`Student record not found.`);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { classId, ...cleanDto } = updateStudentDto;

    const student = await this.studentsRepository.preload({
      id,
      ...cleanDto,
    });

    if (updateStudentDto.classId) {
        const schoolClass = await this.classesRepository.findOne({ where: { id: updateStudentDto.classId, schoolId: schoolId as any } });
        if (!schoolClass) throw new NotFoundException(`Class allocation target not found.`);
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
          const student = await this.update(updateDto.id, updateDto, schoolId);
          updatedStudents.push(student);
      } catch (error) {
          this.logger.error(`Registry update failed for student node ${updateDto.id}`, error);
      }
    }
    return updatedStudents;
  }

  async remove(id: string, schoolId: string): Promise<void> {
    const result = await this.studentsRepository.delete({ id, schoolId: schoolId as any });
    if (result.affected === 0) throw new NotFoundException(`Access denied or record missing.`);
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
    const classes = await this.classesRepository.find({ where: { schoolId: schoolId as any } });
    const classMap = new Map(classes.map(c => [c.name.toLowerCase(), c]));
    const count = await this.studentsRepository.count({ where: { schoolId: schoolId as any } });
    const year = new Date().getFullYear();

    for (const [index, record] of records.entries()) {
      try {
        const normalize = (obj: any) => {
            const normalized: any = {};
            Object.keys(obj).forEach(key => {
                normalized[key.toLowerCase().replace(/[\s_]+/g, '')] = obj[key];
            });
            return normalized;
        };
        const nRecord = normalize(record);
        const name = nRecord['name'] || nRecord['studentname'];
        const guardianName = nRecord['guardianname'] || nRecord['guardian'];
        const className = nRecord['class'] || nRecord['classname'] || nRecord['grade']; 
        
        if (!name || !guardianName || !className) throw new Error(`Incomplete row data.`);
        const targetClass = classMap.get(String(className).toLowerCase());
        if (!targetClass) throw new Error(`Target grade "${className}" not found in current setup.`);

        const guardianContact = nRecord['guardiancontact'] || nRecord['phone'] || '';
        const admissionNumber = `ADM-${year}-${String(count + imported + 1).padStart(4, '0')}`;

        const student = this.studentsRepository.create({
            name, guardianName, guardianContact,
            guardianAddress: nRecord['guardianaddress'] || '',
            guardianEmail: nRecord['guardianemail'] || '',
            emergencyContact: nRecord['emergencycontact'] || '',
            dateOfBirth: nRecord['dateofbirth'] || new Date().toISOString().split('T')[0],
            admissionNumber,
            status: StudentStatus.Active,
            schoolClass: targetClass,
            school: { id: schoolId } as any
        });
        await this.studentsRepository.save(student);
        imported++;
      } catch (err) {
        failed++;
        // FIX: Safely access error message for TypeScript Unknown type
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred during student import';
        errors.push({ row: index + 1, name: record.name || 'Unknown', error: errorMessage });
      }
    }
    return { imported, failed, errors };
  }
}
