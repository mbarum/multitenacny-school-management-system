import { Injectable } from '@nestjs/common';
import {
  LmsProvider,
  LmsStudent,
  LmsCourse,
  LmsGrade,
} from './lms-provider.interface';
import { LmsConnection } from '../entities/lms-connection.entity';
import { CryptoService } from 'src/shared/crypto.service';
import { google } from 'googleapis';
import { ConfigService } from '@nestjs/config';

/**
 * @description A concrete implementation of the LmsProvider strategy for Google Classroom.
 * It handles OAuth 2.0 authentication and data fetching for the Google Classroom API.
 */
@Injectable()
export class GoogleClassroomProvider implements LmsProvider {
  private oauth2Client;
  private classroom;

  constructor(
    private readonly connection: LmsConnection,
    private readonly cryptoService: CryptoService,
    private readonly configService: ConfigService,
  ) {
    const clientId = this.cryptoService.decrypt(
      this.connection.encryptedCredential1,
    );
    const clientSecret = this.cryptoService.decrypt(
      this.connection.encryptedCredential2,
    );
    const refreshToken = this.cryptoService.decrypt(
      this.connection.encryptedRefreshToken,
    );

    this.oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    this.oauth2Client.setCredentials({ refresh_token: refreshToken });

    this.classroom = google.classroom({
      version: 'v1',
      auth: this.oauth2Client,
    });
  }

  async authenticate(): Promise<void> {
    try {
      // The googleapis library handles token refreshing automatically.
      // We can test the connection by making a simple, low-cost API call.
      await this.classroom.courses.list({ pageSize: 1 });
      console.log('Successfully authenticated with Google Classroom.');
    } catch (error) {
      console.error('Google Classroom authentication failed:', error.message);
      throw new Error(
        'Google Classroom authentication failed. Please reconnect.',
      );
    }
  }

  async syncStudents(): Promise<LmsStudent[]> {
    const courses = await this.syncCourses();
    const allStudents: LmsStudent[] = [];

    for (const course of courses) {
      const response = await (this.classroom as any).courses.students.list({
        courseId: course.id,
      });
      const students = (response.data.students || []) as any[];
      students.forEach((s) => {
        allStudents.push({
          id: s.userId as string,
          name: s.profile.name.fullName as string,
          email: s.profile.emailAddress as string,
        });
      });
    }
    return allStudents;
  }

  async syncCourses(): Promise<LmsCourse[]> {
    const response = await (this.classroom as any).courses.list({
      pageSize: 100,
    });
    const courses = (response.data.courses || []) as any[];
    return courses.map((course) => ({
      id: course.id as string,
      name: course.name as string,
    }));
  }

  async getGrades(studentId: string): Promise<LmsGrade[]> {
    const courses = await this.syncCourses();
    const allGrades: LmsGrade[] = [];

    for (const course of courses) {
      const response =
        await (this.classroom as any).courses.courseWork.studentSubmissions.list({
          courseId: course.id,
          userId: studentId,
        });
      const submissions = (response.data.studentSubmissions || []) as any[];
      submissions.forEach((sub) => {
        if (sub.assignedGrade) {
          allGrades.push({
            courseId: course.id,
            studentId,
            grade: sub.assignedGrade.toString() as string,
            remarks: sub.draftGrade ? `Draft: ${sub.draftGrade}` : '',
          });
        }
      });
    }
    return allGrades;
  }
}
