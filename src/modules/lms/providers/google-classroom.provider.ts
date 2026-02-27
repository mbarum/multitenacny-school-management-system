import { Injectable } from '@nestjs/common';
import { LmsProvider, LmsStudent, LmsCourse, LmsGrade } from './lms-provider.interface';
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
    const clientId = this.cryptoService.decrypt(this.connection.encryptedCredential1);
    const clientSecret = this.cryptoService.decrypt(this.connection.encryptedCredential2);
    const refreshToken = this.cryptoService.decrypt(this.connection.encryptedRefreshToken);

    this.oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    this.oauth2Client.setCredentials({ refresh_token: refreshToken });

    this.classroom = google.classroom({ version: 'v1', auth: this.oauth2Client });
  }

  async authenticate(): Promise<void> {
    try {
      // The googleapis library handles token refreshing automatically.
      // We can test the connection by making a simple, low-cost API call.
      await this.classroom.courses.list({ pageSize: 1 });
      console.log('Successfully authenticated with Google Classroom.');
    } catch (error) {
      console.error('Google Classroom authentication failed:', error.message);
      throw new Error('Google Classroom authentication failed. Please reconnect.');
    }
  }

  async syncStudents(): Promise<LmsStudent[]> {
    // Note: Google Classroom API doesn't have a single endpoint to get all students
    // across all courses. This would require iterating through each course.
    // This is a simplified example.
    console.warn('syncStudents for Google Classroom requires iterating all courses. This is a placeholder.');
    return [];
  }

  async syncCourses(): Promise<LmsCourse[]> {
    const response = await this.classroom.courses.list({ pageSize: 100 });
    const courses = response.data.courses || [];
    return courses.map(course => ({
      id: course.id,
      name: course.name,
    }));
  }

  async getGrades(studentId: string): Promise<LmsGrade[]> {
    console.warn('getGrades for Google Classroom is a complex operation and this is a placeholder.');
    return [];
  }
}
