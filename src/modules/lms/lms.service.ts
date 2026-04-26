import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  LmsConnection,
  LmsProviderType,
} from './entities/lms-connection.entity';
import { Course } from './entities/course.entity';
import { Lesson } from './entities/lesson.entity';
import { Assignment } from './entities/assignment.entity';
import { Submission } from './entities/submission.entity';
import { TenancyService } from 'src/core/tenancy/tenancy.service';
import { CryptoService } from 'src/shared/crypto.service';
import { ConnectLmsDto } from './dto/connect-lms.dto';
import { LmsProvider } from './providers/lms-provider.interface';
import { MoodleProvider } from './providers/moodle.provider';
import { GoogleClassroomProvider } from './providers/google-classroom.provider';
import { CanvasProvider } from './providers/canvas.provider';
import { ConfigService } from '@nestjs/config';

/**
 * @description The main service for the LmsModule. It acts as the 'Context' in the Strategy Pattern.
 * It is responsible for managing LMS connections and delegating tasks to the appropriate provider strategy.
 */
@Injectable()
export class LmsService {
  constructor(
    @InjectRepository(LmsConnection)
    private readonly lmsConnectionRepository: Repository<LmsConnection>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,
    @InjectRepository(Assignment)
    private readonly assignmentRepository: Repository<Assignment>,
    @InjectRepository(Submission)
    private readonly submissionRepository: Repository<Submission>,
    private readonly tenancyService: TenancyService,
    private readonly cryptoService: CryptoService,
    private readonly configService: ConfigService,
  ) {}

  // --- Internal LMS Management ---
  async findAllCourses(): Promise<Course[]> {
    return this.courseRepository.find({
      where: { tenantId: this.tenancyService.getTenantId() },
      relations: ['classLevel', 'teacher'],
    });
  }

  async createCourse(data: Partial<Course>): Promise<Course> {
    const course = this.courseRepository.create({
      ...data,
      tenantId: this.tenancyService.getTenantId(),
    });
    return this.courseRepository.save(course);
  }

  async findCourseDetails(id: string) {
    const tenantId = this.tenancyService.getTenantId();
    const course = await this.courseRepository.findOne({
      where: { id, tenantId },
      relations: ['classLevel', 'teacher'],
    });
    if (!course) throw new NotFoundException('Course not found');

    const lessons = await this.lessonRepository.find({
      where: { courseId: id, tenantId },
      order: { order: 'ASC' },
    });

    const assignments = await this.assignmentRepository.find({
      where: { courseId: id, tenantId },
      order: { dueDate: 'ASC' },
    });

    return { ...course, lessons, assignments };
  }

  async createLesson(data: Partial<Lesson>): Promise<Lesson> {
    const lesson = this.lessonRepository.create({
      ...data,
      tenantId: this.tenancyService.getTenantId(),
    });
    return this.lessonRepository.save(lesson);
  }

  async createAssignment(data: Partial<Assignment>): Promise<Assignment> {
    const assignment = this.assignmentRepository.create({
      ...data,
      tenantId: this.tenancyService.getTenantId(),
    });
    return this.assignmentRepository.save(assignment);
  }

  async submitAssignment(data: Partial<Submission>): Promise<Submission> {
    const submission = this.submissionRepository.create({
      ...data,
      tenantId: this.tenancyService.getTenantId(),
      status: 'submitted',
    });
    return this.submissionRepository.save(submission);
  }

  async findSubmissions(assignmentId: string): Promise<Submission[]> {
    return this.submissionRepository.find({
      where: { assignmentId, tenantId: this.tenancyService.getTenantId() },
      relations: ['student'],
    });
  }

  async connect(connectLmsDto: ConnectLmsDto): Promise<LmsConnection> {
    const tenantId = this.tenancyService.getTenantId();

    const newConnection = this.lmsConnectionRepository.create({
      tenantId: tenantId,
      provider: connectLmsDto.provider,
      apiUrl: connectLmsDto.apiUrl,
      encryptedCredential1: this.cryptoService.encrypt(
        connectLmsDto.credential1,
      ),
      encryptedCredential2: connectLmsDto.credential2
        ? this.cryptoService.encrypt(connectLmsDto.credential2)
        : undefined,
      isConnected: false, // Will be set to true after successful authentication
    });

    const savedConnection =
      await this.lmsConnectionRepository.save(newConnection);

    // Eagerly test the connection
    const provider = this.getProvider(savedConnection);
    await provider.authenticate();

    // Mark as connected and save again
    savedConnection.isConnected = true;
    return this.lmsConnectionRepository.save(savedConnection);
  }

  async getConnections(): Promise<LmsConnection[]> {
    const tenantId = this.tenancyService.getTenantId();
    return this.lmsConnectionRepository.find({
      where: { tenantId },
    });
  }

  async syncStudents() {
    const provider = await this.getCurrentProvider();
    // In a real app, this would be offloaded to a background job queue (e.g., Bull)
    return provider.syncStudents();
  }

  async syncCourses() {
    const provider = await this.getCurrentProvider();
    return provider.syncCourses();
  }

  async getGrades(studentId: string) {
    const provider = await this.getCurrentProvider();
    return provider.getGrades(studentId);
  }

  /**
   * @description A factory method to get the current tenant's active LMS provider.
   */
  private async getCurrentProvider(): Promise<LmsProvider> {
    const tenantId = this.tenancyService.getTenantId();
    const connection = await this.lmsConnectionRepository.findOne({
      where: { tenantId },
    });

    if (!connection) {
      throw new NotFoundException('No LMS connection found for this tenant.');
    }

    return this.getProvider(connection);
  }

  /**
   * @description Instantiates and returns the correct provider strategy based on the connection details.
   */
  private getProvider(connection: LmsConnection): LmsProvider {
    switch (connection.provider) {
      case LmsProviderType.MOODLE:
        return new MoodleProvider(connection, this.cryptoService);
      case LmsProviderType.GOOGLE_CLASSROOM:
        return new GoogleClassroomProvider(
          connection,
          this.cryptoService,
          this.configService,
        );
      case LmsProviderType.CANVAS:
        return new CanvasProvider();
      default:
        throw new Error('Unsupported LMS provider.');
    }
  }
}
