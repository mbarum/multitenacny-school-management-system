export interface LmsStudent {
  id: string;
  name: string;
  email: string;
}

export interface LmsCourse {
  id: string;
  name: string;
}

export interface LmsGrade {
  courseId: string;
  studentId: string;
  grade: number | string;
  remarks?: string;
}

/**
 * @description Defines the contract for all LMS provider strategies.
 * Each method represents a core capability that an LMS integration must provide.
 * This ensures consistency and allows the LmsService to use any provider interchangeably.
 */
export interface LmsProvider {
  /**
   * @description Authenticates with the LMS API.
   */
  authenticate(): Promise<void>;

  /**
   * @description Fetches a list of all students from the LMS.
   * @returns A promise that resolves to an array of LmsStudent objects.
   */
  syncStudents(): Promise<LmsStudent[]>;

  /**
   * @description Fetches a list of all courses from the LMS.
   * @returns A promise that resolves to an array of LmsCourse objects.
   */
  syncCourses(): Promise<LmsCourse[]>;

  /**
   * @description Fetches the grades for a specific student from the LMS.
   * @param studentId The unique identifier for the student in the LMS.
   * @returns A promise that resolves to an array of LmsGrade objects.
   */
  getGrades(studentId: string): Promise<LmsGrade[]>;
}
