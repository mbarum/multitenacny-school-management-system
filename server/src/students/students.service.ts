
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { GetStudentsDto } from './dto/get-students.dto';
import { Student, StudentStatus } from '../entities/student.entity';
import { SchoolClass } from '../entities/school-class.entity';
import { SchoolSetting, GradingSystem } from '../entities/school-setting.entity';
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
    @InjectRepository(SchoolSetting)
    private schoolSettingRepository: Repository<SchoolSetting>,
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

  async create(createStudentDto: CreateStudentDto): Promise<any> {
    const { classId, ...studentData } = createStudentDto;

    const schoolClass = await this.classesRepository.findOne({ where: { id: classId } });
    if (!schoolClass) {
        throw new NotFoundException(`Class with ID ${classId} not found.`);
    }
    const classCode = schoolClass.classCode || '000';

    let schoolSetting: SchoolSetting | null = null;
    try {
      schoolSetting = await this.schoolSettingRepository.findOne({ where: {} });
    } catch (error) {
       this.logger.warn('Failed to fetch settings during student creation', error);
    }
    
    if (!schoolSetting) {
        try {
            const newSetting = this.schoolSettingRepository.create({
                name: 'Default School',
                address: 'Address',
                phone: '0000000000',
                email: 'admin@school.com',
                schoolCode: 'SCH',
                gradingSystem: GradingSystem.Traditional
            });
            schoolSetting = await this.schoolSettingRepository.save(newSetting);
        } catch (error) {
             schoolSetting = { schoolCode: 'SCH' } as SchoolSetting;
        }
    }

    const schoolCode = schoolSetting?.schoolCode || 'SCH';
    const year = new Date().getFullYear();
    
    let serial = 1;
    try {
      const startOfYear = new Date(year, 0, 1);
      const countThisYear = await this.studentsRepository.count({
          where: {
              createdAt: MoreThanOrEqual(startOfYear)
          }
      });
      serial = countThisYear + 1;
    } catch (e) {
      this.logger.error('Failed to count students', e);
    }

    let admissionNumber = `${schoolCode}${classCode}${year}${String(serial).padStart(3, '0')}`;
    let retries = 0;

    // Robust check for admission number uniqueness
    while (await this.studentsRepository.findOne({ where: { admissionNumber } })) {
        serial++;
        admissionNumber = `${schoolCode}${classCode}${year}${String(serial).padStart(3, '0')}`;
        retries++;
        if (retries > 50) {
             // Fallback to prevent infinite loop in edge cases
             admissionNumber = `${schoolCode}${classCode}${year}R${Math.floor(Math.random() * 10000)}`;
             break;
        }
    }

    const student = this.studentsRepository.create({
        ...studentData,
        admissionNumber,
        status: StudentStatus.Active,
        schoolClass: schoolClass,
        profileImage: studentData.profileImage || 'https://i.imgur.com/S5o7W44.png',
    });

    const savedStudent = await this.studentsRepository.save(student);
    
    // Reload to ensure we return a fully mapped object including class details
    const reloadedStudent = await this.studentsRepository.findOne({ 
        where: { id: savedStudent.id }, 
        relations: ['schoolClass'] 
    });
    
    if (reloadedStudent) reloadedStudent.balance = 0;
    return this.mapStudentToDto(reloadedStudent!);
  }

  async findAll(query: GetStudentsDto): Promise<any> {
    // Removed try/catch to ensure real errors bubble up
    const { page = 1, limit = 10, search, classId, status, pagination, mode } = query;
    
    const qb = this.studentsRepository.createQueryBuilder('student');
    qb.leftJoinAndSelect('student.schoolClass', 'schoolClass');

    if (search) {
      qb.andWhere('(student.name LIKE :search OR student.admissionNumber LIKE :search OR student.guardianName LIKE :search)', { search: `%${search}%` });
    }

    if (classId && classId !== 'all') {
      // Use relation alias for filtering
      qb.andWhere('schoolClass.id = :classId', { classId });
    }

    if (status && status !== 'all') {
        qb.andWhere('student.status = :status', { status });
    }

    qb.orderBy('student.name', 'ASC');

    if (mode === 'minimal') {
        qb.select([
            'student.id', 
            'student.name', 
            'student.admissionNumber', 
            'student.guardianEmail',
            'student.status',
        ]);
        qb.addSelect(['schoolClass.name', 'schoolClass.id']);
        
        const students = await qb.getMany();
        return students.map(s => ({
            id: s.id,
            name: s.name,
            admissionNumber: s.admissionNumber,
            classId: s.schoolClass?.id,
            class: s.schoolClass?.name,
            guardianEmail: s.guardianEmail,
            status: s.status
        }));
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
      
      try {
          const ids = students.map(s => s.id);
          
          // Join student to filter by ID properly without 'studentId' column
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
          balances.forEach(b => {
              balanceMap.set(b.studentId, parseFloat(b.balance) || 0);
          });

          return students.map(student => {
              student.balance = balanceMap.get(student.id) || 0;
              return this.mapStudentToDto(student);
          });
      } catch (error) {
          this.logger.error('Failed to calculate balances.', error);
          return students.map(student => {
              student.balance = 0;
              return this.mapStudentToDto(student);
          });
      }
  }

  async findOne(id: string): Promise<any> {
    const student = await this.studentsRepository.findOne({ 
      where: { id },
      relations: ['schoolClass'] 
    });
    if (!student) {
      throw new NotFoundException(`Student with ID "${id}" not found`);
    }
    
    try {
        const result = await this.transactionsRepository
            .createQueryBuilder('t')
            .leftJoin('t.student', 's')
            .select('SUM(CASE WHEN t.type IN (:...debits) THEN t.amount ELSE -t.amount END)', 'balance')
            .where('s.id = :id', { id })
            .setParameters({ debits: [TransactionType.Invoice, TransactionType.ManualDebit] })
            .getRawOne();
        
        student.balance = parseFloat(result.balance) || 0;
    } catch (e) {
        this.logger.error(`Failed to fetch balance for student ${id}`, e);
        student.balance = 0;
    }

    return this.mapStudentToDto(student);
  }

  async update(id: string, updateStudentDto: UpdateStudentDto): Promise<any> {
    const student = await this.studentsRepository.preload({
      id,
      ...updateStudentDto,
    });
    if (!student) {
      throw new NotFoundException(`Student with ID "${id}" not found`);
    }
    if (updateStudentDto.classId) {
        const schoolClass = await this.classesRepository.findOne({ where: { id: updateStudentDto.classId } });
        if (!schoolClass) throw new NotFoundException(`Class with ID ${updateStudentDto.classId} not found.`);
        student.schoolClass = schoolClass;
    }
    const savedStudent = await this.studentsRepository.save(student);
    return this.findOne(savedStudent.id);
  }
  
  async batchUpdate(updates: UpdateStudentDto[]): Promise<any[]> {
    const updatedStudents: any[] = [];
    for (const updateDto of updates) {
      const { id, ...dto } = updateDto;
      if (!id) continue;
      try {
          const student = await this.update(id, dto);
          updatedStudents.push(student);
      } catch (error) {
          this.logger.error(`Failed to batch update student ${id}`, error);
      }
    }
    return updatedStudents;
  }

  async remove(id: string): Promise<void> {
    const result = await this.studentsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Student with ID "${id}" not found`);
    }
  }

  async exportStudents(): Promise<string> {
    const students = await this.studentsRepository.find({ relations: ['schoolClass'] });
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

  async importStudents(buffer: Buffer): Promise<{ imported: number; failed: number; errors: any[] }> {
    const records = await CsvUtil.parse(buffer);
    let imported = 0;
    let failed = 0;
    const errors: any[] = [];

    for (const record of records) {
      try {
        if (!record.name || !record.classId) {
            throw new Error('Missing required fields (name, classId)');
        }
        
        const dto: CreateStudentDto = {
            name: record.name,
            classId: record.classId,
            guardianName: record.guardianName || 'Unknown',
            guardianContact: record.guardianContact || 'Unknown',
            guardianAddress: record.guardianAddress || 'Unknown',
            guardianEmail: record.guardianEmail || '',
            emergencyContact: record.emergencyContact || record.guardianContact || 'Unknown',
            dateOfBirth: record.dateOfBirth || '2015-01-01',
            profileImage: 'https://i.imgur.com/S5o7W44.png'
        };
        
        await this.create(dto);
        imported++;
      } catch (err) {
        failed++;
        errors.push({ record, error: err instanceof Error ? err.message : 'Unknown error' });
      }
    }

    return { imported, failed, errors };
  }
}
