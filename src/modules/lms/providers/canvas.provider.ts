import { Injectable } from '@nestjs/common';
import {
  LmsProvider,
  LmsStudent,
  LmsCourse,
  LmsGrade,
} from './lms-provider.interface';

/**
 * @description A placeholder scaffold for a future Canvas LMS provider.
 * This class fulfills the LmsProvider contract but throws errors for all methods,
 * indicating that the feature is not yet implemented.
 */
@Injectable()
export class CanvasProvider implements LmsProvider {
  constructor() {}

  async authenticate(): Promise<void> {
    throw new Error('Canvas provider is not yet implemented.');
  }

  async syncStudents(): Promise<LmsStudent[]> {
    throw new Error('Canvas provider is not yet implemented.');
  }

  async syncCourses(): Promise<LmsCourse[]> {
    throw new Error('Canvas provider is not yet implemented.');
  }

  async getGrades(_studentId: string): Promise<LmsGrade[]> {
    throw new Error('Canvas provider is not yet implemented.');
  }
}
