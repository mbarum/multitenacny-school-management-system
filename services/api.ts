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
export const logout = (): Promise<void> => apiFetch('/auth/logout', { method: 'POST' });
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
const update = <T>(resource: string) => (id: string, data: any): Promise<T> => apiFetch(`/${resource}/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
const remove = (resource: string) => (id: string): Promise<void> => apiFetch(`/${resource}/${id}`, { method: 'DELETE' });
const list = <T>(resource: string) => (): Promise<T[]> => apiFetch(`/${resource}`);
const batchUpdate = <T extends {id?: string}>(resource: string) => (items: T[]): Promise<T[]> => apiFetch(`/${resource}/batch`, { method: 'PUT', body: JSON.stringify(items) });

// Dashboard
// Added missing getDashboardStats to resolve "Property 'getDashboardStats' does not exist" error.
export const getDashboardStats = () => apiFetch('/dashboard/stats');

// Students
// Robust getStudents implementation with params.
export const getStudents = (params: { page?: number, limit?: number, search?: string, classId?: string, status?: string, pagination?: string, mode?: string } = {}): Promise<any> => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.search) query.append('search', params.search);
    if (params.classId) query.append('classId', params.classId);
    if (params.status) query.append('status', params.status);
    if (params.pagination) query.append('pagination', params.pagination);
    if (params.mode) query.append('mode', params.mode);
    return apiFetch(`/students?${query.toString()}`);
};
export const createStudent = create<Student>('students');
export const updateStudent = update<Student>('students');
// Added missing deleteStudent to resolve property access error.
export const deleteStudent = remove('students');
export const updateMultipleStudents = (updates: Array<Partial<Student> & { id: string }>): Promise<Student[]> => apiFetch('/students/batch-update', { method: 'POST', body: JSON.stringify(updates) });
// Added missing uploadStudentPhoto to resolve property access error.
export const uploadStudentPhoto = (formData: FormData): Promise<{url: string}> => apiFetch('/students/upload-photo', { method: 'POST', body: formData });
// Added missing export/import methods.
export const exportStudents = (): Promise<Blob> => apiFetch('/students/export');
export const importStudents = (formData: FormData): Promise<{imported: number, failed: number, errors: any[]}> => apiFetch('/students/import', { method: 'POST', body: formData });

// Users
export const getUsers = list<User>('users');
export const createUser = create<User>('users');
export const updateUser = update<User>('users');
export const deleteUser = remove('users');

// Transactions
export const getTransactions = (params: any = {}): Promise<any> => {
    const query = new URLSearchParams(params);
    return apiFetch(`/transactions?${query.toString()}`);
};
export const createTransaction = create<Transaction>('transactions');
export const createMultipleTransactions = (data: NewTransaction[]): Promise<Transaction[]> => apiFetch('/transactions/batch', { method: 'POST', body: JSON.stringify(data) });

// Expenses
export const getExpenses = (params: any = {}): Promise<any> => {
    const query = new URLSearchParams(params);
    return apiFetch(`/expenses?${query.toString()}`);
};
export const createExpense = create<Expense>('expenses');

// Staff
export const createStaff = create<Staff>('staff');
export const updateStaff = update<Staff>('staff');
export const getStaff = list<Staff>('staff');

// Payroll
export const savePayrollRun = (data: Payroll[]): Promise<Payroll[]> => apiFetch('/payroll/generate', { method: 'POST', body: JSON.stringify(data) });
export const createPayrollItem = create<PayrollItem>('payroll/payroll-items');
export const updatePayrollItem = update<PayrollItem>('payroll/payroll-items');
export const deletePayrollItem = remove('payroll/payroll-items');
export const getPayrollHistory = (params: any = {}): Promise<any> => {
    const query = new URLSearchParams(params);
    return apiFetch(`/payroll/payroll-history?${query.toString()}`);
};

// Settings
export const getSchoolInfo = (): Promise<SchoolInfo> => apiFetch('/settings/school-info');
export const updateSchoolInfo = (data: SchoolInfo): Promise<SchoolInfo> => apiFetch('/settings/school-info', { method: 'PUT', body: JSON.stringify(data) });
export const getDarajaSettings = (): Promise<DarajaSettings> => apiFetch('/settings/daraja');
// Fix: corrected typo 'baseBody' to 'body' in updateDarajaSettings request options.
export const updateDarajaSettings = (data: DarajaSettings): Promise<DarajaSettings> => apiFetch('/settings/daraja', { method: 'PUT', body: JSON.stringify(data) });

// Grading
export const getGradingScale = list<GradingRule>('academics/grading-scale');
export const createGradingRule = create<GradingRule>('academics/grading-scale');
export const updateGradingRule = update<GradingRule>('academics/grading-scale');
export const deleteGradingRule = remove('academics/grading-scale');

// Fees
// Added missing getFeeStructure and findAllFeeItems.
export const getFeeStructure = () => apiFetch('/academics/fee-structure');
export const findAllFeeItems = () => apiFetch('/academics/fee-structure');
export const createFeeItem = create<FeeItem>('academics/fee-structure');
export const updateFeeItem = update<FeeItem>('academics/fee-structure');
export const deleteFeeItem = remove('academics/fee-structure');

// Communications
// Added missing findAllAnnouncements and getCommunicationLogs.
export const findAllAnnouncements = (): Promise<Announcement[]> => apiFetch('/communications/announcements');
export const createAnnouncement = create<Announcement>('communications/announcements');
export const getCommunicationLogs = (params: any = {}): Promise<any> => {
    const query = new URLSearchParams(params);
    return apiFetch(`/communications/communication-logs?${query.toString()}`);
};
export const createCommunicationLog = create<CommunicationLog>('communications/communication-logs');
export const createBulkCommunicationLogs = (data: NewCommunicationLog[]): Promise<CommunicationLog[]> => apiFetch('/communications/communication-logs/batch', { method: 'POST', body: JSON.stringify(data) });

// Academics (Batch updates)
// Added missing getClasses and getSubjects.
export const getClasses = list<SchoolClass>('academics/classes');
export const getSubjects = list<Subject>('academics/subjects');
export const batchUpdateClasses = batchUpdate<SchoolClass>('academics/classes');
export const batchUpdateSubjects = batchUpdate<Subject>('academics/subjects');
export const batchUpdateAssignments = batchUpdate<ClassSubjectAssignment>('academics/class-subject-assignments');
export const batchUpdateTimetable = batchUpdate<TimetableEntry>('academics/timetable-entries');
export const batchUpdateExams = batchUpdate<Exam>('academics/exams');
export const batchUpdateGrades = batchUpdate<Grade>('academics/grades');
export const batchUpdateAttendance = batchUpdate<AttendanceRecord>('academics/attendance-records');
export const batchUpdateEvents = batchUpdate<SchoolEvent>('academics/events');

// Individual Academics GET
export const findAllExams = (): Promise<Exam[]> => apiFetch('/academics/exams');
export const findAllAssignments = () => apiFetch('/academics/class-subject-assignments');
export const findAllTimetableEntries = () => apiFetch('/academics/timetable-entries');
export const getGrades = (params: any = {}): Promise<Grade[]> => {
    const query = new URLSearchParams(params);
    return apiFetch(`/academics/grades?${query.toString()}`);
};
export const getAttendance = (params: any = {}): Promise<any> => {
    const query = new URLSearchParams(params);
    return apiFetch(`/academics/attendance-records?${query.toString()}`);
};
