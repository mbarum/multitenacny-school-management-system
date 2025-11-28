
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { SchoolClass, Subject, ClassSubjectAssignment, TimetableEntry, Exam, Grade, AttendanceRecord, SchoolEvent, GradingRule, FeeItem, ClassFee, Student } from '../entities/all-entities';
import { CreateGradingRuleDto, UpdateGradingRuleDto } from './dto/grading-rule.dto';
import { CreateFeeItemDto, UpdateFeeItemDto } from './dto/fee-item.dto';
import { CreateClassDto, UpdateClassDto } from './dto/class.dto';
import { CreateSubjectDto, UpdateSubjectDto } from './dto/subject.dto';
import { CreateAssignmentDto, UpdateAssignmentDto } from './dto/assignment.dto';
import { CreateExamDto, UpdateExamDto } from './dto/exam.dto';
import { GetAttendanceDto } from './dto/get-attendance.dto';
import { GetGradesDto } from './dto/get-grades.dto';

@Injectable()
export class AcademicsService {
  constructor(
    @InjectRepository(SchoolClass) public readonly classRepo: Repository<SchoolClass>,
    @InjectRepository(Subject) public readonly subjectRepo: Repository<Subject>,
    @InjectRepository(ClassSubjectAssignment) public readonly assignmentRepo: Repository<ClassSubjectAssignment>,
    @InjectRepository(TimetableEntry) public readonly timetableRepo: Repository<TimetableEntry>,
    @InjectRepository(Exam) public readonly examRepo: Repository<Exam>,
    @InjectRepository(Grade) public readonly gradeRepo: Repository<Grade>,
    @InjectRepository(AttendanceRecord) public readonly attendanceRepo: Repository<AttendanceRecord>,
    @InjectRepository(SchoolEvent) public readonly eventRepo: Repository<SchoolEvent>,
    @InjectRepository(GradingRule) public readonly gradingRuleRepo: Repository<GradingRule>,
    @InjectRepository(FeeItem) public readonly feeItemRepo: Repository<FeeItem>,
    @InjectRepository(ClassFee) public readonly classFeeRepo: Repository<ClassFee>,
    private readonly entityManager: EntityManager,
  ) {}

  // FindAll methods
  async findAllClasses(): Promise<any[]> {
    const classes = await this.classRepo.find({ relations: ['formTeacher']});
    return classes.map(c => ({
      id: c.id,
      name: c.name,
      classCode: c.classCode,
      formTeacherId: c.formTeacherId,
      formTeacherName: c.formTeacher?.name || null,
    }));
  }
  
  findAllSubjects = () => this.subjectRepo.find();
  findAllAssignments = () => this.assignmentRepo.find({ relations: ['class', 'subject', 'teacher'] });
  findAllTimetableEntries = () => this.timetableRepo.find();
  findAllExams = () => this.examRepo.find({ order: { date: 'DESC' }});
  
  async findAllGrades(query?: GetGradesDto) {
      const qb = this.gradeRepo.createQueryBuilder('grade');
      
      if (query) {
          if (query.examId) qb.andWhere('grade.examId = :examId', { examId: query.examId });
          if (query.subjectId) qb.andWhere('grade.subjectId = :subjectId', { subjectId: query.subjectId });
          if (query.studentId) qb.andWhere('grade.studentId = :studentId', { studentId: query.studentId });
          // For class filtering, we need to join student
          if (query.classId) {
              qb.leftJoin('grade.student', 'student');
              qb.leftJoin('student.schoolClass', 'schoolClass');
              qb.andWhere('schoolClass.id = :classId', { classId: query.classId });
          }
      }
      
      return qb.getMany();
  }
  
  async findAllAttendance(query?: GetAttendanceDto) {
      const qb = this.attendanceRepo.createQueryBuilder('attendance');

      if (query) {
          if (query.classId) qb.andWhere('attendance.classId = :classId', { classId: query.classId });
          if (query.studentId) qb.andWhere('attendance.studentId = :studentId', { studentId: query.studentId });
          if (query.date) qb.andWhere('attendance.date = :date', { date: query.date });
          if (query.startDate) qb.andWhere('attendance.date >= :startDate', { startDate: query.startDate });
          if (query.endDate) qb.andWhere('attendance.date <= :endDate', { endDate: query.endDate });
      }

      qb.orderBy('attendance.date', 'DESC');
      return qb.getMany();
  }

  findAllEvents = () => this.eventRepo.find();
  findAllGradingRules = () => this.gradingRuleRepo.find();
  findAllFeeItems = () => this.feeItemRepo.find({ relations: ['classSpecificFees'] });

  // Generic batch update for entities that don't have dedicated CRUD yet
  async batchUpdate<T extends { id?: string }>(repo: Repository<T>, items: T[]): Promise<T[]> {
    return this.entityManager.transaction(async transactionalEntityManager => {
        const savedItems: T[] = [];
        const transactionalRepo = transactionalEntityManager.getRepository(repo.target);
        for (const item of items) {
            const saved = await transactionalRepo.save(item as any);
            savedItems.push(saved);
        }
        return savedItems;
    });
  }

  // --- CRUD for individual Academic Entities ---

  // Classes
  createClass(dto: CreateClassDto) { return this.classRepo.save(this.classRepo.create(dto)); }
  async updateClass(id: string, dto: UpdateClassDto) {
    const item = await this.classRepo.preload({ id, ...dto });
    if (!item) throw new NotFoundException(`Class with ID ${id} not found`);
    return this.classRepo.save(item);
  }
  async deleteClass(id: string) {
    // Updated to use relation query structure
    const studentCount = await this.entityManager.getRepository(Student).count({ where: { schoolClass: { id } } });
    if (studentCount > 0) throw new BadRequestException('Cannot delete class with assigned students. Please re-assign students first.');
    const result = await this.classRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException(`Class with ID ${id} not found`);
  }

  // Subjects
  createSubject(dto: CreateSubjectDto) { return this.subjectRepo.save(this.subjectRepo.create(dto)); }
  async updateSubject(id: string, dto: UpdateSubjectDto) {
    const item = await this.subjectRepo.preload({ id, ...dto });
    if (!item) throw new NotFoundException(`Subject with ID ${id} not found`);
    return this.subjectRepo.save(item);
  }
  async deleteSubject(id: string) {
    const assignmentCount = await this.assignmentRepo.count({ where: { subjectId: id } });
    if (assignmentCount > 0) throw new BadRequestException('Cannot delete subject that is assigned to a class. Please remove assignments first.');
    const result = await this.subjectRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException(`Subject with ID ${id} not found`);
  }

  // Assignments
  createAssignment(dto: CreateAssignmentDto) { return this.assignmentRepo.save(this.assignmentRepo.create(dto)); }
  async updateAssignment(id: string, dto: UpdateAssignmentDto) {
    const item = await this.assignmentRepo.preload({ id, ...dto });
    if (!item) throw new NotFoundException(`Assignment with ID ${id} not found`);
    return this.assignmentRepo.save(item);
  }
  async deleteAssignment(id: string) {
    const result = await this.assignmentRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException(`Assignment with ID ${id} not found`);
  }

  // Exams
  createExam(dto: CreateExamDto) { return this.examRepo.save(this.examRepo.create(dto)); }
  async updateExam(id: string, dto: UpdateExamDto) {
    const item = await this.examRepo.preload({ id, ...dto });
    if (!item) throw new NotFoundException(`Exam with ID ${id} not found`);
    return this.examRepo.save(item);
  }
  async deleteExam(id: string) {
    // on-delete cascade will remove grades
    const result = await this.examRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException(`Exam with ID ${id} not found`);
  }

  // Grading Rule specific methods
  createGradingRule(dto: CreateGradingRuleDto) { return this.gradingRuleRepo.save(this.gradingRuleRepo.create(dto)); }
  async updateGradingRule(id: string, dto: UpdateGradingRuleDto) {
    const rule = await this.gradingRuleRepo.preload({ id, ...dto });
    if (!rule) { throw new NotFoundException(`Grading rule with ID ${id} not found`); }
    return this.gradingRuleRepo.save(rule);
  }
  async deleteGradingRule(id: string) {
    const result = await this.gradingRuleRepo.delete(id);
    if (result.affected === 0) { throw new NotFoundException(`Grading rule with ID ${id} not found`); }
  }

  // Fee Structure specific methods
  async createFeeItem(dto: CreateFeeItemDto): Promise<FeeItem> {
    return this.entityManager.transaction(async transactionalEntityManager => {
        const { classSpecificFees, ...itemData } = dto;
        const feeItem = transactionalEntityManager.create(FeeItem, itemData);
        const savedFeeItem = await transactionalEntityManager.save(feeItem);

        if (classSpecificFees && classSpecificFees.length > 0) {
            const classFees = classSpecificFees.map(feeDto => {
                return transactionalEntityManager.create(ClassFee, { ...feeDto, feeItem: savedFeeItem });
            });
            await transactionalEntityManager.save(classFees);
        }
        return transactionalEntityManager.findOneOrFail(FeeItem, { where: { id: savedFeeItem.id }, relations: ['classSpecificFees'] });
    });
  }

  async updateFeeItem(id: string, dto: UpdateFeeItemDto): Promise<FeeItem> {
    return this.entityManager.transaction(async transactionalEntityManager => {
        const { classSpecificFees, ...itemData } = dto;
        const feeItem = await transactionalEntityManager.preload(FeeItem, { id, ...itemData });
        if (!feeItem) { throw new NotFoundException(`Fee item with ID ${id} not found`); }
        
        await transactionalEntityManager.save(feeItem); // Save main item props first
        await transactionalEntityManager.delete(ClassFee, { feeItemId: id }); // Clear existing class fees

        if (classSpecificFees && classSpecificFees.length > 0) {
            const newClassFees = classSpecificFees.map(feeDto => {
                return transactionalEntityManager.create(ClassFee, { ...feeDto, feeItem });
            });
            await transactionalEntityManager.save(newClassFees);
        }
        return transactionalEntityManager.findOneOrFail(FeeItem, { where: { id }, relations: ['classSpecificFees'] });
    });
  }

  async deleteFeeItem(id: string) {
    const result = await this.feeItemRepo.delete(id); // Cascade delete will handle ClassFee entries
    if (result.affected === 0) { throw new NotFoundException(`Fee item with ID ${id} not found`); }
  }
}
