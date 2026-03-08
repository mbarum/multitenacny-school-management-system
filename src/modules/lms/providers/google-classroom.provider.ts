import { Injectable } from '@nestjs/common';
import {
  LmsProvider,
  LmsStudent,
  LmsCourse,
  LmsGrade,
} from './lms-provider.interface';
import { LmsConnection } from '../entities/lms-connection.entity';
import { CryptoService } from 'src/shared/crypto.service';
import { google, classroom_v1 } from 'googleapis';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';

/**
 * @description A concrete implementation of the LmsProvider strategy for Google Classroom.
 * It handles OAuth 2.0 authentication and data fetching for the Google Classroom API.
 */
@Injectable()
export class GoogleClassroomProvider implements LmsProvider {
  private oauth2Client: OAuth2Client;
  private classroom: classroom_v1.Classroom;

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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Google Classroom authentication failed:', message);
      throw new Error(
        'Google Classroom authentication failed. Please reconnect.',
      );
    }
  }

  async syncStudents(): Promise<LmsStudent[]> {
    const courses = await this.syncCourses();
    const allStudents: LmsStudent[] = [];

    for (const course of courses) {
      const response = await this.classroom.courses.students.list({
        courseId: course.id,
      });
      const students = response.data.students || [];
      students.forEach((s) => {
        allStudents.push({
          id: s.userId || '',
          name: s.profile?.name?.fullName || '',
          email: s.profile?.emailAddress || '',
        });
      });
    }
    return allStudents;
  }

  async syncCourses(): Promise<LmsCourse[]> {
    const response = await this.classroom.courses.list({
      pageSize: 100,
    });
    const courses = response.data.courses || [];
    return courses.map((course) => ({
      id: course.id || '',
      name: course.name || '',
    }));
  }

  async getGrades(studentId: string): Promise<LmsGrade[]> {
    const courses = await this.syncCourses();
    const allGrades: LmsGrade[] = [];

    for (const course of courses) {
      const response =
        await this.classroom.courses.courseWork.studentSubmissions.list({
          courseId: course.id,
          userId: studentId,
        });
      const submissions = response.data.studentSubmissions || [];
      submissions.forEach((sub) => {
        if (sub.assignedGrade) {
          allGrades.push({
            courseId: course.id,
            studentId,
            grade: sub.assignedGrade.toString(),
            remarks: sub.draftGrade ? `Draft: ${sub.draftGrade}` : '',
          });
        }
      });
    }
    return allGrades;
  }
}
