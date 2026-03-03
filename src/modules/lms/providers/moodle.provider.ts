import { Injectable } from '@nestjs/common';
import {
  LmsProvider,
  LmsStudent,
  LmsCourse,
  LmsGrade,
} from './lms-provider.interface';
import { LmsConnection } from '../entities/lms-connection.entity';
import { CryptoService } from 'src/shared/crypto.service';
import axios from 'axios';

/**
 * @description A concrete implementation of the LmsProvider strategy for Moodle.
 * It handles authentication and data fetching specifically for the Moodle REST API.
 */
@Injectable()
export class MoodleProvider implements LmsProvider {
  private token: string;
  private apiUrl: string;

  constructor(
    private readonly connection: LmsConnection,
    private readonly cryptoService: CryptoService,
  ) {
    this.apiUrl = this.connection.apiUrl;
    // Decrypt the token immediately upon instantiation
    this.token = this.cryptoService.decrypt(
      this.connection.encryptedCredential1,
    );
  }

  async authenticate(): Promise<void> {
    // Moodle's token is long-lived and provided directly.
    // We can test the connection by making a simple API call.
    try {
      const response = await this.makeRequest('core_webservice_get_site_info');
      if (!response.sitename) {
        throw new Error('Invalid Moodle token or API URL.');
      }
      console.log(
        `Successfully connected to Moodle site: ${response.sitename}`,
      );
    } catch (error) {
      console.error('Moodle authentication failed:', error.message);
      throw new Error('Moodle authentication failed.');
    }
  }

  async syncStudents(): Promise<LmsStudent[]> {
    const users = await this.makeRequest('core_user_get_users', {
      criteria: [{ key: 'email', value: '%' }],
    });
    return users.users.map((user) => ({
      id: user.id.toString(),
      name: user.fullname,
      email: user.email,
    }));
  }

  async syncCourses(): Promise<LmsCourse[]> {
    const courses = await this.makeRequest('core_course_get_courses');
    return courses.map((course) => ({
      id: course.id.toString(),
      name: course.fullname,
    }));
  }

  async getGrades(_studentId: string): Promise<LmsGrade[]> {
    // This is a simplified example. A real implementation would be more complex.
    console.warn(
      'getGrades for Moodle is a complex operation and this is a placeholder.',
    );
    return [];
  }

  /**
   * @description A helper method to make requests to the Moodle REST API.
   * It automatically includes the required token and function name.
   */
  private async makeRequest(
    wsfunction: string,
    args: Record<string, any> = {},
  ): Promise<any> {
    const response = await axios.post(
      this.apiUrl,
      null, // Moodle uses query params for POST requests
      {
        params: {
          wstoken: this.token,
          wsfunction,
          moodlewsrestformat: 'json',
          ...args,
        },
      },
    );

    if (response.data.exception) {
      throw new Error(`Moodle API Error: ${response.data.message}`);
    }

    return response.data;
  }
}
