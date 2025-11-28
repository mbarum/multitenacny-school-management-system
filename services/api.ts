import type { 
    User, Student, Transaction, Expense, Staff, Payroll, Subject, SchoolClass, 
    ClassSubjectAssignment, TimetableEntry, Exam, Grade, AttendanceRecord, SchoolEvent, 
    SchoolInfo, GradingRule, FeeItem, CommunicationLog, Announcement, ReportShareLog, 
    PayrollItem, DarajaSettings, MpesaC2BTransaction, NewStudent, NewStaff, 
    NewTransaction, NewExpense, NewPayrollItem, NewAnnouncement, NewCommunicationLog, 
    NewUser, NewGradingRule, NewFeeItem
} from '../types';

// This function acts as a client for our backend API.
const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('authToken');
    // Fix: Use the Headers constructor for robust header management.
    // This correctly handles various `HeadersInit` types and avoids spread-related type errors.
    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    // All requests are proxied by Vite to the backend server (e.g., http://localhost:3000)
    const response = await fetch(`/api${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `API Error: ${response.status}`);
    }

    // Handle responses with no content
    if (response.status === 204) {
        return null;
    }

    return response.json();
};


// --- API Methods ---

// Auth
export const login = (credentials: {email: string, password: string}): Promise<{user: User, token: string}> => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
export const getAuthenticatedUser = (): Promise<User> => apiFetch('/auth/me');

// Initial Data Load
export const fetchInitialData = () => {
    const endpoints = [
        'users', 'students', 'transactions', 'expenses', 'staff', 'payroll-history',
        'subjects', 'classes', 'class-subject-assignments', 'timetable-entries',
        'exams', 'grades', 'attendance-records', 'events', 'grading-scale',
        'fee-structure', 'payroll-items', 'communication-logs', 'announcements',
        'settings/school-info', 'settings/daraja'
    ];
    return Promise.all(endpoints.map(ep => apiFetch(`/${ep}`)));
};


// Generic CRUD functions
const create = <T>(resource: string) => (data: any): Promise<T> => apiFetch(`/${resource}`, { method: 'POST', body: JSON.stringify(data) });
const get = <T>(resource: string) => (id: string): Promise<T> => apiFetch(`/${resource}/${id}`);
const update = <T>(resource: string) => (id: string, data: any): Promise<T> => apiFetch(`/${resource}/${id}`, { method: 'PUT', body: JSON.stringify(data) });
const remove = (resource: string) => (id: string): Promise<void> => apiFetch(`/${resource}/${id}`, { method: 'DELETE' });
const list = <T>(resource: string) => (): Promise<T[]> => apiFetch(`/${resource}`);
const batchUpdate = <T extends {id?: string}>(resource: string) => (items: T[]): Promise<T[]> => apiFetch(`/${resource}/batch`, { method: 'PUT', body: JSON.stringify(items) });

// Students
export const getStudents = list<Student>('students');
export const createStudent = create<Student>('students');
export const updateStudent = update<Student>('students');
export const updateMultipleStudents = (updates: Array<Partial<Student> & { id: string }>): Promise<Student[]> => apiFetch('/students/batch-update', { method: 'POST', body: JSON.stringify(updates) });

// Users
export const getUsers = list<User>('users');
export const createUser = create<User>('users');
export const updateUser = update<User>('users');
export const deleteUser = remove('users');

// Transactions
export const createTransaction = create<Transaction>('transactions');
export const createMultipleTransactions = (data: NewTransaction[]): Promise<Transaction[]> => apiFetch('/transactions/batch', { method: 'POST', body: JSON.stringify(data) });

// Expenses
export const createExpense = create<Expense>('expenses');

// Staff
export const createStaff = create<Staff>('staff');
export const updateStaff = update<Staff>('staff');

// Payroll
export const savePayrollRun = (data: Payroll[]): Promise<Payroll[]> => apiFetch('/payroll', { method: 'POST', body: JSON.stringify(data) });
export const createPayrollItem = create<PayrollItem>('payroll-items');
export const updatePayrollItem = update<PayrollItem>('payroll-items');
export const deletePayrollItem = remove('payroll-items');

// Settings
export const getSchoolInfo = (): Promise<SchoolInfo> => apiFetch('/settings/school-info');
export const updateSchoolInfo = (data: SchoolInfo): Promise<SchoolInfo> => apiFetch('/settings/school-info', { method: 'PUT', body: JSON.stringify(data) });
export const updateDarajaSettings = (data: DarajaSettings): Promise<DarajaSettings> => apiFetch('/settings/daraja', { method: 'PUT', body: JSON.stringify(data) });

// Grading
export const createGradingRule = create<GradingRule>('grading-scale');
export const updateGradingRule = update<GradingRule>('grading-scale');
export const deleteGradingRule = remove('grading-scale');

// Fees
export const createFeeItem = create<FeeItem>('fee-structure');
export const updateFeeItem = update<FeeItem>('fee-structure');
export const deleteFeeItem = remove('fee-structure');

// Communications
export const createAnnouncement = create<Announcement>('announcements');
export const createCommunicationLog = create<CommunicationLog>('communication-logs');
export const createBulkCommunicationLogs = (data: NewCommunicationLog[]): Promise<CommunicationLog[]> => apiFetch('/communication-logs/batch', { method: 'POST', body: JSON.stringify(data) });

// Academics (Batch updates)
export const batchUpdateClasses = batchUpdate<SchoolClass>('classes');
export const batchUpdateSubjects = batchUpdate<Subject>('subjects');
export const batchUpdateAssignments = batchUpdate<ClassSubjectAssignment>('class-subject-assignments');
export const batchUpdateTimetable = batchUpdate<TimetableEntry>('timetable-entries');
export const batchUpdateExams = batchUpdate<Exam>('exams');
export const batchUpdateGrades = batchUpdate<Grade>('grades');
export const batchUpdateAttendance = batchUpdate<AttendanceRecord>('attendance-records');
export const batchUpdateEvents = batchUpdate<SchoolEvent>('events');