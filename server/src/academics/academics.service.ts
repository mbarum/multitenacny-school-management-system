
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

  // --- FindAll methods with SchoolId Filtering ---

  async findAllClasses(schoolId: string): Promise<any[]> {
    const classes = await this.classRepo.find({ where: { schoolId: schoolId as any }, relations: ['formTeacher']});
    return classes.map(c => ({
      id: c.id,
      name: c.name,
      classCode: c.classCode,
      // Robustly get the ID. If the column is null (due to TypeORM hydration behavior), get it from the relation object.
      formTeacherId: c.formTeacherId || (c.formTeacher ? c.formTeacher.id : null),
      formTeacherName: c.formTeacher?.name || null,
    }));
  }
  
  findAllSubjects = (schoolId: string) => this.subjectRepo.find({ where: { schoolId: schoolId as any } });
  
  findAllAssignments(schoolId: string) {
      return this.assignmentRepo.find({ 
          where: { class: { schoolId: schoolId as any } }, // Indirect check via Class
          relations: ['class', 'subject', 'teacher'] 
      });
  }

  findAllTimetableEntries(schoolId: string) {
      // Correctly query with the relation alias 'class' which now exists in the entity
      return this.timetableRepo.createQueryBuilder('tt')
        .leftJoinAndSelect('tt.class', 'class')
        .where('class.schoolId = :schoolId', { schoolId })
        .getMany();
  }

  findAllExams = (schoolId: string) => this.examRepo.find({ 
      where: { schoolClass: { schoolId: schoolId as any } }, 
      order: { date: 'DESC' },
      relations: ['schoolClass']
  });
  
  async findAllGrades(query: GetGradesDto | undefined, schoolId: string) {
      const qb = this.gradeRepo.createQueryBuilder('grade');
      qb.leftJoin('grade.student', 'student');
      qb.where('student.schoolId = :schoolId', { schoolId });
      
      if (query) {
          if (query.examId) qb.andWhere('grade.examId = :examId', { examId: query.examId });
          if (query.subjectId) qb.andWhere('grade.subjectId = :subjectId', { subjectId: query.subjectId });
          if (query.studentId) qb.andWhere('grade.studentId = :studentId', { studentId: query.studentId });
          if (query.classId) {
              qb.leftJoin('student.schoolClass', 'schoolClass');
              qb.andWhere('schoolClass.id = :classId', { classId: query.classId });
          }
      }
      return qb.getMany();
  }
  
  async findAllAttendance(query: GetAttendanceDto | undefined, schoolId: string) {
      const qb = this.attendanceRepo.createQueryBuilder('attendance');
      qb.leftJoin('attendance.student', 'student');
      qb.where('student.schoolId = :schoolId', { schoolId });

      const { page = 1, limit = 10, pagination } = query || {};

      if (query) {
          if (query.classId) qb.andWhere('attendance.classId = :classId', { classId: query.classId });
          if (query.studentId) qb.andWhere('attendance.studentId = :studentId', { studentId: query.studentId });
          if (query.date) qb.andWhere('attendance.date = :date', { date: query.date });
          if (query.startDate) qb.andWhere('attendance.date >= :startDate', { startDate: query.startDate });
          if (query.endDate) qb.andWhere('attendance.date <= :endDate', { endDate: query.endDate });
      }

      qb.orderBy('attendance.date', 'DESC');

      if (pagination === 'false') {
          return qb.getMany();
      }

      const skip = (page - 1) * limit;
      qb.skip(skip).take(limit);

      const [data, total] = await qb.getManyAndCount();
      return {
          data,
          total,
          page,
          limit,
          last_page: Math.ceil(total / limit)
      };
  }

  findAllEvents = (schoolId: string) => this.eventRepo.find({ where: { schoolId: schoolId as any } });
  findAllGradingRules = (schoolId: string) => this.gradingRuleRepo.find({ where: { schoolId: schoolId as any } });
  findAllFeeItems = (schoolId: string) => this.feeItemRepo.find({ where: { schoolId: schoolId as any }, relations: ['classSpecificFees'] });

  // Generic batch update modified to accept schoolId for safety (though items usually have IDs)
  async batchUpdate<T extends { id?: string }>(repo: Repository<T>, items: T[], schoolId: string): Promise<T[]> {
    return this.entityManager.transaction(async (transactionalEntityManager: EntityManager) => {
        const savedItems: T[] = [];
        const transactionalRepo = transactionalEntityManager.getRepository(repo.target);
        for (const item of items) {
            const entityData = { ...item };
            
            // Fix for temporary IDs from frontend (e.g. evt-12345, grd-12345)
            // If ID looks strictly temporary, remove it to force creation
            if (entityData.id && typeof entityData.id === 'string' && (
                entityData.id.startsWith('evt-') || 
                entityData.id.startsWith('temp-') || 
                entityData.id.startsWith('tt-') ||
                entityData.id.startsWith('grd-') ||
                entityData.id.startsWith('exam-') ||
                entityData.id.startsWith('cls-') ||
                entityData.id.startsWith('sub-') ||
                entityData.id.startsWith('csa-')
            )) {
                delete entityData.id;
            }

            if ('schoolId' in (transactionalRepo.metadata.propertiesMap as any) || transactionalRepo.metadata.columns.find(c => c.propertyName === 'schoolId')) {
                 (entityData as any).schoolId = schoolId;
            }
            
            // Upsert logic
            let entity;
            if (entityData.id) {
               // Try to find existing
               entity = await transactionalRepo.preload(entityData);
               if(!entity) entity = transactionalRepo.create(entityData);
            } else {
               entity = transactionalRepo.create(entityData); 
            }
            
            const saved = await transactionalRepo.save(entity);
            savedItems.push(saved);
        }
        return savedItems;
    });
  }

  // --- CRUD for individual Academic Entities ---

  // Classes
  createClass(dto: CreateClassDto, schoolId: string) { 
      return this.classRepo.save(this.classRepo.create({ ...dto, school: { id: schoolId } as any })); 
  }
  async updateClass(id: string, dto: UpdateClassDto, schoolId: string) {
    const item = await this.classRepo.findOne({ where: { id, schoolId: schoolId as any } });
    if (!item) throw new NotFoundException(`Class not found`);
    Object.assign(item, dto);
    return this.classRepo.save(item);
  }
  async deleteClass(id: string, schoolId: string) {
    const item = await this.classRepo.findOne({ where: { id, schoolId: schoolId as any } });
    if (!item) throw new NotFoundException(`Class not found`);
    const studentCount = await this.entityManager.getRepository(Student).count({ where: { schoolClass: { id } as any } });
    if (studentCount > 0) throw new BadRequestException('Cannot delete class with assigned students.');
    await this.classRepo.delete(id);
  }

  // Subjects
  createSubject(dto: CreateSubjectDto, schoolId: string) { 
      return this.subjectRepo.save(this.subjectRepo.create({ ...dto, school: { id: schoolId } as any })); 
  }
  async updateSubject(id: string, dto: UpdateSubjectDto, schoolId: string) {
    const item = await this.subjectRepo.findOne({ where: { id, schoolId: schoolId as any } });
    if (!item) throw new NotFoundException(`Subject not found`);
    Object.assign(item, dto);
    return this.subjectRepo.save(item);
  }
  async deleteSubject(id: string, schoolId: string) {
    const item = await this.subjectRepo.findOne({ where: { id, schoolId: schoolId as any } });
    if (!item) throw new NotFoundException(`Subject not found`);
    const assignmentCount = await this.assignmentRepo.count({ where: { subjectId: id } });
    if (assignmentCount > 0) throw new BadRequestException('Cannot delete subject assigned to class.');
    await this.subjectRepo.delete(id);
  }

  // Assignments
  createAssignment(dto: CreateAssignmentDto, schoolId: string) { 
      // Should verify Class and Subject belong to school
      return this.assignmentRepo.save(this.assignmentRepo.create(dto)); 
  }
  async updateAssignment(id: string, dto: UpdateAssignmentDto, schoolId: string) {
    const item = await this.assignmentRepo.findOne({ where: { id }, relations: ['class'] });
    if (!item || item.class.schoolId !== schoolId) throw new NotFoundException(`Assignment not found`);
    Object.assign(item, dto);
    return this.assignmentRepo.save(item);
  }
  async deleteAssignment(id: string, schoolId: string) {
    const item = await this.assignmentRepo.findOne({ where: { id }, relations: ['class'] });
    if (!item || item.class.schoolId !== schoolId) throw new NotFoundException(`Assignment not found`);
    await this.assignmentRepo.delete(id);
  }

  // Exams
  createExam(dto: CreateExamDto, schoolId: string) { 
      // Check class ownership
      return this.examRepo.save(this.examRepo.create(dto)); 
  }
  async updateExam(id: string, dto: UpdateExamDto, schoolId: string) {
    const item = await this.examRepo.findOne({ where: { id }, relations: ['schoolClass'] });
    if (!item || item.schoolClass.schoolId !== schoolId) throw new NotFoundException(`Exam not found`);
    Object.assign(item, dto);
    return this.examRepo.save(item);
  }
  async deleteExam(id: string, schoolId: string) {
    const item = await this.examRepo.findOne({ where: { id }, relations: ['schoolClass'] });
    if (!item || item.schoolClass.schoolId !== schoolId) throw new NotFoundException(`Exam not found`);
    await this.examRepo.delete(id);
  }

  // Grading Rule
  createGradingRule(dto: CreateGradingRuleDto, schoolId: string) { 
      return this.gradingRuleRepo.save(this.gradingRuleRepo.create({ ...dto, school: { id: schoolId } as any })); 
  }
  async updateGradingRule(id: string, dto: UpdateGradingRuleDto, schoolId: string) {
    const rule = await this.gradingRuleRepo.findOne({ where: { id, schoolId: schoolId as any } });
    if (!rule) throw new NotFoundException(`Grading rule not found`);
    Object.assign(rule, dto);
    return this.gradingRuleRepo.save(rule);
  }
  async deleteGradingRule(id: string, schoolId: string) {
    const result = await this.gradingRuleRepo.delete({ id, schoolId: schoolId as any });
    if (result.affected === 0) throw new NotFoundException(`Grading rule not found`);
  }

  // Fee Structure
  async createFeeItem(dto: CreateFeeItemDto, schoolId: string): Promise<FeeItem> {
    return this.entityManager.transaction(async transactionalEntityManager => {
        const { classSpecificFees, ...itemData } = dto;
        const feeItem = transactionalEntityManager.create(FeeItem, { ...itemData, school: { id: schoolId } as any });
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

  async updateFeeItem(id: string, dto: UpdateFeeItemDto, schoolId: string): Promise<FeeItem> {
    return this.entityManager.transaction(async transactionalEntityManager => {
        const { classSpecificFees, ...itemData } = dto;
        const feeItem = await transactionalEntityManager.findOne(FeeItem, { where: { id, schoolId: schoolId as any } });
        if (!feeItem) throw new NotFoundException(`Fee item not found`);
        
        Object.assign(feeItem, itemData);
        await transactionalEntityManager.save(feeItem);
        
        if (classSpecificFees) {
            await transactionalEntityManager.delete(ClassFee, { feeItemId: id });
            const newClassFees = classSpecificFees.map(feeDto => {
                return transactionalEntityManager.create(ClassFee, { ...feeDto, feeItem });
            });
            await transactionalEntityManager.save(newClassFees);
        }
        return transactionalEntityManager.findOneOrFail(FeeItem, { where: { id }, relations: ['classSpecificFees'] });
    });
  }

  async deleteFeeItem(id: string, schoolId: string) {
    const result = await this.feeItemRepo.delete({ id, schoolId: schoolId as any });
    if (result.affected === 0) throw new NotFoundException(`Fee item not found`);
  }
}
