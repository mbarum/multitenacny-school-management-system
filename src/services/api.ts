
import type { 
    User, Student, Transaction, Expense, Staff, Payroll, Subject, SchoolClass, 
    ClassSubjectAssignment, TimetableEntry, Exam, Grade, AttendanceRecord, SchoolEvent, 
    SchoolInfo, GradingRule, FeeItem, CommunicationLog, Announcement, 
    PayrollItem, DarajaSettings, NewStudent, NewStaff, 
    NewTransaction, NewExpense, NewPayrollItem, NewAnnouncement, NewCommunicationLog, 
    NewUser, NewGradingRule, NewFeeItem,
    UpdateSchoolInfoDto, PaginatedResponse, AuditLog, Book, NewBook, IssueBookData, LibraryTransaction,
    School, SubscriptionStatus, SubscriptionPlan
} from '../types';
import { Role } from '../types';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('authToken');
    const headers = new Headers(options.headers);
    if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`/api${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new ApiError(errorData.message || `API Error: ${response.status}`, response.status, errorData);
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
};

const apiFileFetch = async (endpoint: string, formData: FormData) => {
    const token = localStorage.getItem('authToken');
    const headers = new Headers();
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`/api${endpoint}`, {
        method: 'POST',
        body: formData,
        headers,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new ApiError(errorData.message || `API Error: ${response.status}`, response.status, errorData);
    }
    return response.json();
};

const apiFetchBlob = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('authToken');
    const headers = new Headers(options.headers);

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`/api${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new ApiError(errorData.message || `API Error: ${response.status}`, response.status, errorData);
    }
    
    return response.blob();
};


// Auth
export const login = (credentials: {email: string, password: string}): Promise<{user: User, token: string}> => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
export const registerSchool = (data: any): Promise<{user: User, token: string, school: any}> => apiFetch('/auth/register-school', { method: 'POST', body: JSON.stringify(data) });
export const getAuthenticatedUser = (): Promise<User> => apiFetch('/auth/me');

// Super Admin
export const getPlatformStats = (): Promise<any> => apiFetch('/super-admin/stats');
export const getAllSchools = (): Promise<School[]> => apiFetch('/super-admin/schools');
export const updateSchoolSubscription = (schoolId: string, data: { status: SubscriptionStatus; plan: SubscriptionPlan; endDate?: string }): Promise<any> => apiFetch(`/super-admin/schools/${schoolId}/subscription`, { method: 'PATCH', body: JSON.stringify(data) });

// Dashboard
export const getDashboardStats = (): Promise<any> => apiFetch('/dashboard/stats');

// Initial Data Load
export const fetchInitialData = (role?: Role) => {
    // OPTIMIZED: Only fetch lightweight configuration and reference data.
    // Heavy transaction/log data is removed and should be fetched by views on demand.
    const endpoints = [
        'users',                                    // 0: Admin
        'academics/subjects',                       // 1: Admin, Teacher
        'academics/classes',                        // 2: Admin, Teacher, Receptionist
        'academics/class-subject-assignments',      // 3: Admin, Teacher
        'academics/grading-scale',                  // 4: Admin, Teacher
        'academics/fee-structure',                  // 5: Admin, Accountant
        'payroll/payroll-items',                    // 6: Admin, Accountant
        'settings/school-info',                     // 7: All (Authenticated)
        'settings/daraja',                          // 8: Admin
        'students?pagination=false&mode=minimal',   // 9: All (Lightweight list for dropdowns)
        'staff'                                     // 10: Admin, Accountant
    ];

    const requests = endpoints.map((ep, index) => {
        if (!role) return apiFetch(`/${ep}`);
        const isAllowed = (allowedRoles: Role[]) => allowedRoles.includes(role);
        
        let shouldFetch = false;

        switch (index) {
            case 0: shouldFetch = isAllowed([Role.Admin]); break;
            case 1: shouldFetch = isAllowed([Role.Admin, Role.Teacher]); break;
            case 2: shouldFetch = isAllowed([Role.Admin, Role.Teacher, Role.Receptionist]); break;
            case 3: shouldFetch = isAllowed([Role.Admin, Role.Teacher]); break;
            case 4: shouldFetch = isAllowed([Role.Admin, Role.Teacher]); break;
            case 5: shouldFetch = isAllowed([Role.Admin, Role.Accountant]); break;
            case 6: shouldFetch = isAllowed([Role.Admin, Role.Accountant]); break;
            case 7: shouldFetch = true; break; 
            case 8: shouldFetch = isAllowed([Role.Admin]); break;
            case 9: shouldFetch = isAllowed([Role.Admin, Role.Accountant, Role.Teacher, Role.Receptionist]); break; // Students needed everywhere
            case 10: shouldFetch = isAllowed([Role.Admin, Role.Accountant]); break;
            default: shouldFetch = false;
        }

        if (shouldFetch) {
            return apiFetch(`/${ep}`);
        } else {
            // Return empty array/object for skipped endpoints to maintain index order in results
            return Promise.resolve(index === 7 || index === 8 ? null : []);
        }
    });

    return Promise.allSettled(requests);
};

// Generic CRUD functions
const create = <T>(resource: string) => (data: any): Promise<T> => apiFetch(`/${resource}`, { method: 'POST', body: JSON.stringify(data) });
const get = <T>(resource: string) => (id: string): Promise<T> => apiFetch(`/${resource}/${id}`);
const update = <T>(resource: string) => (id: string, data: any): Promise<T> => apiFetch(`/${resource}/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
const remove = (resource: string) => (id: string): Promise<void> => apiFetch(`/${resource}/${id}`, { method: 'DELETE' });
const list = <T>(resource: string) => (): Promise<T[]> => apiFetch(`/${resource}`);

// Students
export const getStudents = (params?: { page?: number; limit?: number; search?: string; classId?: string; status?: string, pagination?: boolean, mode?: string }): Promise<PaginatedResponse<Student> & { data: Student[] }> => {
    const searchParams = new URLSearchParams();
    if (params) {
        if (params.page) searchParams.append('page', params.page.toString());
        if (params.limit) searchParams.append('limit', params.limit.toString());
        if (params.search) searchParams.append('search', params.search);
        if (params.classId) searchParams.append('classId', params.classId);
        if (params.status) searchParams.append('status', params.status);
        if (params.pagination !== undefined) searchParams.append('pagination', params.pagination.toString());
        if (params.mode) searchParams.append('mode', params.mode);
    }
    return apiFetch(`/students?${searchParams.toString()}`);
};
export const createStudent = create<Student>('students');
export const updateStudent = update<Student>('students');
export const deleteStudent = remove('students');
export const updateMultipleStudents = (updates: Array<Partial<Student> & { id: string }>): Promise<Student[]> => apiFetch('/students/batch-update', { method: 'POST', body: JSON.stringify(updates) });
export const exportStudents = (): Promise<Blob> => apiFetchBlob('/students/export');
export const importStudents = (formData: FormData): Promise<{ imported: number; failed: number; errors: any[] }> => apiFileFetch('/students/import', formData);


// Users
export const getUsers = list<User>('users');
export const createUser = create<User>('users');
export const updateUser = update<User>('users');
export const deleteUser = remove('users');
export const updateUserProfile = (data: Partial<User>): Promise<User> => apiFetch('/users/profile', { method: 'PATCH', body: JSON.stringify(data) });
export const uploadUserAvatar = (formData: FormData): Promise<{ avatarUrl: string }> => apiFileFetch('/users/upload-avatar', formData);

// Staff
export const getStaff = list<Staff>('staff');
export const createStaff = create<Staff>('staff');
export const updateStaff = update<Staff>('staff');
export const deleteStaff = remove('staff');
export const exportStaff = (): Promise<Blob> => apiFetchBlob('/staff/export');
export const importStaff = (formData: FormData): Promise<{ imported: number; failed: number; errors: any[] }> => apiFileFetch('/staff/import', formData);


// Transactions
export const getTransactions = (params?: { page?: number; limit?: number; search?: string; startDate?: string; endDate?: string; type?: string; studentId?: string, pagination?: boolean }): Promise<PaginatedResponse<Transaction>> => {
    const searchParams = new URLSearchParams();
    if (params) {
        if (params.page) searchParams.append('page', params.page.toString());
        if (params.limit) searchParams.append('limit', params.limit.toString());
        if (params.search) searchParams.append('search', params.search);
        if (params.startDate) searchParams.append('startDate', params.startDate);
        if (params.endDate) searchParams.append('endDate', params.endDate);
        if (params.type) searchParams.append('type', params.type);
        if (params.studentId) searchParams.append('studentId', params.studentId);
        if (params.pagination !== undefined) searchParams.append('pagination', params.pagination.toString());
    }
    return apiFetch(`/transactions?${searchParams.toString()}`);
}
export const createTransaction = create<Transaction>('transactions');
export const updateTransaction = update<Transaction>('transactions');
export const deleteTransaction = remove('transactions');
export const createMultipleTransactions = (data: NewTransaction[]): Promise<Transaction[]> => apiFetch('/transactions/batch', { method: 'POST', body: JSON.stringify(data) });

// Expenses
export const getExpenses = (): Promise<Expense[]> => apiFetch('/expenses');
export const createExpense = create<Expense>('expenses');
export const updateExpense = update<Expense>('expenses');
export const deleteExpense = remove('expenses');


// Payroll
export const savePayrollRun = (data: Payroll[]): Promise<Payroll[]> => apiFetch('/payroll/generate', { method: 'POST', body: JSON.stringify(data) });
export const getPayrollHistory = (params?: { page?: number; limit?: number; staffId?: string; month?: string }): Promise<PaginatedResponse<Payroll>> => {
    const searchParams = new URLSearchParams();
    if (params) {
        if (params.page) searchParams.append('page', params.page.toString());
        if (params.limit) searchParams.append('limit', params.limit.toString());
        if (params.staffId) searchParams.append('staffId', params.staffId);
        if (params.month) searchParams.append('month', params.month);
    }
    return apiFetch(`/payroll/payroll-history?${searchParams.toString()}`);
};
export const createPayrollItem = create<PayrollItem>('payroll/payroll-items');
export const updatePayrollItem = update<PayrollItem>('payroll/payroll-items');
export const deletePayrollItem = remove('payroll/payroll-items');

// Settings
export const getPublicSchoolInfo = (): Promise<SchoolInfo> => apiFetch('/settings/public/school-info');
export const getSchoolInfo = (): Promise<SchoolInfo> => apiFetch('/settings/school-info');
export const updateSchoolInfo = (data: UpdateSchoolInfoDto): Promise<SchoolInfo> => apiFetch('/settings/school-info', { method: 'PUT', body: JSON.stringify(data) });
export const updateDarajaSettings = (data: DarajaSettings): Promise<DarajaSettings> => apiFetch('/settings/daraja', { method: 'PUT', body: JSON.stringify(data) });
export const uploadLogo = (formData: FormData): Promise<{ logoUrl: string }> => apiFileFetch('/settings/upload-logo', formData);


// Grading
export const createGradingRule = create<GradingRule>('academics/grading-scale');
export const updateGradingRule = update<GradingRule>('academics/grading-scale');
export const deleteGradingRule = remove('academics/grading-scale');

// Fees
export const createFeeItem = create<FeeItem>('academics/fee-structure');
export const updateFeeItem = update<FeeItem>('academics/fee-structure');
export const deleteFeeItem = remove('academics/fee-structure');

// Communications
export const getCommunicationLogs = (params?: { page?: number; limit?: number; studentId?: string; type?: string }): Promise<PaginatedResponse<CommunicationLog>> => {
    const searchParams = new URLSearchParams();
    if (params) {
        if (params.page) searchParams.append('page', params.page.toString());
        if (params.limit) searchParams.append('limit', params.limit.toString());
        if (params.studentId) searchParams.append('studentId', params.studentId);
        if (params.type) searchParams.append('type', params.type);
    }
    return apiFetch(`/communications/communication-logs?${searchParams.toString()}`);
};
export const createAnnouncement = create<Announcement>('communications/announcements');
export const updateAnnouncement = update<Announcement>('communications/announcements');
export const deleteAnnouncement = remove('communications/announcements');
export const getAnnouncements = (params?: { audience?: string }): Promise<Announcement[]> => apiFetch('/communications/announcements');
export const createCommunicationLog = create<CommunicationLog>('communications/communication-logs');
export const createBulkCommunicationLogs = (data: NewCommunicationLog[]): Promise<CommunicationLog[]> => apiFetch('/communications/communication-logs/batch', { method: 'POST', body: JSON.stringify(data) });

// Academics (Batch updates)
export const batchUpdateClasses = batchUpdate<SchoolClass>('academics/classes');
export const batchUpdateSubjects = batchUpdate<Subject>('academics/subjects');
export const batchUpdateAssignments = batchUpdate<ClassSubjectAssignment>('academics/class-subject-assignments');
export const batchUpdateTimetable = batchUpdate<TimetableEntry>('academics/timetable-entries');
export const batchUpdateExams = batchUpdate<Exam>('academics/exams');
export const batchUpdateGrades = batchUpdate<Grade>('academics/grades');
export const batchUpdateAttendance = batchUpdate<AttendanceRecord>('academics/attendance-records');
export const batchUpdateEvents = batchUpdate<SchoolEvent>('academics/events');
export const getEvents = (): Promise<SchoolEvent[]> => apiFetch('/academics/events');

export const getAttendance = (params?: { classId?: string; studentId?: string; date?: string; startDate?: string; endDate?: string }): Promise<AttendanceRecord[]> => {
    const searchParams = new URLSearchParams();
    if (params) {
        if (params.classId) searchParams.append('classId', params.classId);
        if (params.studentId) searchParams.append('studentId', params.studentId);
        if (params.date) searchParams.append('date', params.date);
        if (params.startDate) searchParams.append('startDate', params.startDate);
        if (params.endDate) searchParams.append('endDate', params.endDate);
    }
    return apiFetch(`/academics/attendance-records?${searchParams.toString()}`);
};
export const getGrades = (params?: { examId?: string; subjectId?: string; studentId?: string; classId?: string }): Promise<Grade[]> => {
    const searchParams = new URLSearchParams();
    if (params) {
        if (params.examId) searchParams.append('examId', params.examId);
        if (params.subjectId) searchParams.append('subjectId', params.subjectId);
        if (params.studentId) searchParams.append('studentId', params.studentId);
        if (params.classId) searchParams.append('classId', params.classId);
    }
    return apiFetch(`/academics/grades?${searchParams.toString()}`);
}
export const updateClass = update<SchoolClass>('academics/classes');
export const deleteClass = remove('academics/classes');
export const updateSubject = update<Subject>('academics/subjects');
export const deleteSubject = remove('academics/subjects');
export const updateAssignment = update<ClassSubjectAssignment>('academics/class-subject-assignments');
export const deleteAssignment = remove('academics/class-subject-assignments');
export const updateExam = update<Exam>('academics/exams');
export const deleteExam = remove('academics/exams');

// Audit
export const getAuditLogs = (limit: number = 50): Promise<AuditLog[]> => apiFetch(`/audit-logs?limit=${limit}`);

// Library
export const getBooks = (): Promise<Book[]> => apiFetch('/library/books');
export const createBook = create<Book>('library/books');
export const updateBook = update<Book>('library/books');
export const deleteBook = remove('library/books');
export const issueBook = (data: IssueBookData): Promise<LibraryTransaction> => apiFetch('/library/issue', { method: 'POST', body: JSON.stringify(data) });
export const returnBook = (transactionId: string): Promise<LibraryTransaction> => apiFetch(`/library/return/${transactionId}`, { method: 'POST' });
export const getLibraryTransactions = (): Promise<LibraryTransaction[]> => apiFetch('/library/transactions');

// Helpers for type safety in batch update
function batchUpdate<T extends {id?: string}>(resource: string) {
    return (items: T[]): Promise<T[]> => apiFetch(`/${resource}/batch`, { method: 'PUT', body: JSON.stringify(items) });
}
