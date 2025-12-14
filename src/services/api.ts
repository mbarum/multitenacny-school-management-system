
import type { 
    User, Student, Transaction, Expense, Staff, Payroll, Subject, SchoolClass, 
    ClassSubjectAssignment, TimetableEntry, Exam, Grade, AttendanceRecord, SchoolEvent, 
    SchoolInfo, GradingRule, FeeItem, CommunicationLog, Announcement, ReportShareLog, 
    PayrollItem, DarajaSettings, MpesaC2BTransaction, NewStudent, NewStaff, 
    NewTransaction, NewExpense, NewPayrollItem, NewAnnouncement, NewCommunicationLog, 
    NewUser, NewGradingRule, NewFeeItem, Book, LibraryTransaction, IssueBookData,
    School, PlatformPricing
} from '../types';
import { Role } from '../types';

const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('authToken');
    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`/api${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `API Error: ${response.status}`);
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
};

// Auth
export const login = (credentials: {email: string, password: string}): Promise<{user: User, token: string}> => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
export const registerSchool = (data: any): Promise<{user: User, token: string, school: School}> => apiFetch('/auth/register-school', { method: 'POST', body: JSON.stringify(data) });
export const getAuthenticatedUser = (): Promise<User> => apiFetch('/users/me');
export const updateUserProfile = (data: Partial<User>): Promise<User> => apiFetch('/users/profile', { method: 'PATCH', body: JSON.stringify(data) });
export const uploadUserAvatar = (formData: FormData): Promise<{ avatarUrl: string }> => {
    const token = localStorage.getItem('authToken');
    return fetch('/api/users/upload-avatar', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    }).then(res => res.json());
};
export const adminUploadUserPhoto = (formData: FormData): Promise<{ url: string }> => {
    const token = localStorage.getItem('authToken');
    return fetch('/api/users/upload-photo', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    }).then(async res => {
        if (!res.ok) throw new Error('Photo upload failed');
        return res.json();
    });
};

// Dashboard
export const getDashboardStats = (): Promise<any> => apiFetch('/dashboard/stats');

// Initial Data Load
export const fetchInitialData = async (role?: Role) => {
    // Define endpoints and restrict them by role if necessary.
    // If 'roles' is undefined, the endpoint is fetched for everyone.
    const definitions: { endpoint: string, default: any, critical?: boolean, roles?: Role[] }[] = [
        { endpoint: 'users', default: [], roles: [Role.Admin] },
        // FIX: Added pagination=false to ensure ALL students are loaded for teacher classes
        { endpoint: 'students?pagination=false', default: [], roles: [Role.Admin, Role.Accountant, Role.Teacher, Role.Receptionist] },
        { endpoint: 'transactions?pagination=false', default: [] }, // Access controlled by backend filters, safe to call
        { endpoint: 'expenses?pagination=false', default: [], roles: [Role.Admin, Role.Accountant] },
        { endpoint: 'staff', default: [], roles: [Role.Admin, Role.Accountant] },
        { endpoint: 'payroll/payroll-history', default: { data: [], total: 0 }, roles: [Role.Admin, Role.Accountant] },
        { endpoint: 'academics/subjects', default: [] },
        { endpoint: 'academics/classes', default: [] },
        { endpoint: 'academics/class-subject-assignments', default: [] },
        { endpoint: 'academics/timetable-entries', default: [] },
        { endpoint: 'academics/exams', default: [] },
        { endpoint: 'academics/grades', default: [] },
        { endpoint: 'academics/attendance-records?pagination=false', default: [] },
        { endpoint: 'academics/events', default: [] },
        { endpoint: 'academics/grading-scale', default: [] },
        { endpoint: 'academics/fee-structure', default: [], roles: [Role.Admin, Role.Accountant] },
        { endpoint: 'payroll/payroll-items', default: [], roles: [Role.Admin, Role.Accountant] },
        { endpoint: 'communications/communication-logs', default: { data: [], total: 0 } },
        { endpoint: 'communications/announcements', default: [] },
        { endpoint: 'settings/school-info', default: null, critical: true },
        { endpoint: 'settings/daraja', default: null, roles: [Role.Admin] }
    ];

    const results = await Promise.allSettled(definitions.map(def => {
        // If a role is provided and the definition has restricted roles, check access
        if (role && def.roles && !def.roles.includes(role)) {
            // Skip fetching and return default immediately
            return Promise.resolve(def.default);
        }
        return apiFetch(`/${def.endpoint}`);
    }));
    
    return results.map((result, index) => {
        const def = definitions[index];
        if (result.status === 'fulfilled') {
            return result.value;
        } else {
            console.warn(`Failed to fetch ${def.endpoint}:`, result.reason);
            if (def.critical) {
                throw result.reason; 
            }
            return def.default;
        }
    });
};

// Generic Helpers
const create = <T>(resource: string) => (data: any): Promise<T> => apiFetch(`/${resource}`, { method: 'POST', body: JSON.stringify(data) });
const update = <T>(resource: string) => (id: string, data: any): Promise<T> => apiFetch(`/${resource}/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
const remove = (resource: string) => (id: string): Promise<void> => apiFetch(`/${resource}/${id}`, { method: 'DELETE' });

const list = <T>(resource: string) => (query?: any): Promise<any> => {
    let queryString = '';
    if (query) {
        const filteredQuery = Object.fromEntries(
            Object.entries(query).filter(([_, v]) => v !== undefined && v !== null && v !== '')
        );
        if (Object.keys(filteredQuery).length > 0) {
            queryString = '?' + new URLSearchParams(filteredQuery as any).toString();
        }
    }
    return apiFetch(`/${resource}${queryString}`);
};

const batchUpdate = <T>(resource: string) => (items: T[]): Promise<T[]> => apiFetch(`/${resource}/batch`, { method: 'PUT', body: JSON.stringify(items) });

// Students
export const getStudents = list<Student>('students');
export const createStudent = create<Student>('students');
export const updateStudent = update<Student>('students');
export const deleteStudent = remove('students');
export const updateMultipleStudents = (updates: Array<Partial<Student> & { id: string }>): Promise<Student[]> => apiFetch('/students/batch-update', { method: 'POST', body: JSON.stringify(updates) });
export const exportStudents = (): Promise<Blob> => fetch('/api/students/export', { headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } }).then(res => res.blob());
export const importStudents = (formData: FormData): Promise<{ imported: number; failed: number; errors: any[] }> => {
    const token = localStorage.getItem('authToken');
    return fetch('/api/students/import', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    }).then(res => res.json());
};
export const uploadStudentPhoto = (formData: FormData): Promise<{ url: string }> => {
    const token = localStorage.getItem('authToken');
    return fetch('/api/students/upload-photo', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    }).then(async res => {
        if (!res.ok) throw new Error('Photo upload failed');
        return res.json();
    });
};

// Users
export const getUsers = list<User>('users');
export const createUser = create<User>('users');
export const updateUser = update<User>('users');
export const deleteUser = remove('users');

// Transactions
export const getTransactions = list<Transaction>('transactions');
export const createTransaction = create<Transaction>('transactions');
export const updateTransaction = update<Transaction>('transactions');
export const deleteTransaction = remove('transactions');
export const createMultipleTransactions = (data: NewTransaction[]): Promise<Transaction[]> => apiFetch('/transactions/batch', { method: 'POST', body: JSON.stringify(data) });
export const exportTransactions = (): Promise<Blob> => fetch('/api/transactions/export', { headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } }).then(res => res.blob());

// Expenses
export const getExpenses = list<Expense>('expenses');
export const createExpense = create<Expense>('expenses');
export const updateExpense = update<Expense>('expenses');
export const deleteExpense = remove('expenses');
export const exportExpenses = (query?: any): Promise<Blob> => {
    let queryString = '';
    if (query) {
         const filteredQuery = Object.fromEntries(
            Object.entries(query).filter(([_, v]) => v !== undefined && v !== null && v !== '')
        );
        if (Object.keys(filteredQuery).length > 0) {
            queryString = '?' + new URLSearchParams(filteredQuery as any).toString();
        }
    }
    return fetch(`/api/expenses/export${queryString}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } }).then(res => res.blob());
};
export const uploadExpenseReceipt = (formData: FormData): Promise<{ url: string }> => {
    const token = localStorage.getItem('authToken');
    return fetch('/api/expenses/upload-receipt', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    }).then(async res => {
        if (!res.ok) throw new Error('Upload failed');
        return res.json();
    });
};

// Staff
export const createStaff = create<Staff>('staff');
export const updateStaff = update<Staff>('staff');
export const exportStaff = (): Promise<Blob> => fetch('/api/staff/export', { headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } }).then(res => res.blob());
export const uploadStaffPhoto = (formData: FormData): Promise<{ url: string }> => {
    const token = localStorage.getItem('authToken');
    return fetch('/api/staff/upload-photo', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    }).then(async res => {
        if (!res.ok) throw new Error('Photo upload failed');
        return res.json();
    });
};

// Payroll
export const savePayrollRun = (data: Payroll[]): Promise<Payroll[]> => apiFetch('/payroll/generate', { method: 'POST', body: JSON.stringify(data) });
export const getPayrollHistory = list<Payroll>('payroll/payroll-history');
export const createPayrollItem = create<PayrollItem>('payroll/payroll-items');
export const updatePayrollItem = update<PayrollItem>('payroll/payroll-items');
export const deletePayrollItem = remove('payroll/payroll-items');

// Settings
export const getPublicSchoolInfo = (): Promise<SchoolInfo> => apiFetch('/settings/public/school-info');
export const getSchoolInfo = (): Promise<SchoolInfo> => apiFetch('/settings/school-info');
export const updateSchoolInfo = (data: any): Promise<SchoolInfo> => apiFetch('/settings/school-info', { method: 'PUT', body: JSON.stringify(data) });
export const updateDarajaSettings = (data: DarajaSettings): Promise<DarajaSettings> => apiFetch('/settings/daraja', { method: 'PUT', body: JSON.stringify(data) });
export const getPlatformPricing = (): Promise<PlatformPricing> => apiFetch('/settings/public/pricing');

// Academics
export const createGradingRule = create<GradingRule>('academics/grading-scale');
export const updateGradingRule = update<GradingRule>('academics/grading-scale');
export const deleteGradingRule = remove('academics/grading-scale');

export const createFeeItem = create<FeeItem>('academics/fee-structure');
export const updateFeeItem = update<FeeItem>('academics/fee-structure');
export const deleteFeeItem = remove('academics/fee-structure');

export const deleteClass = remove('academics/classes');
export const deleteSubject = remove('academics/subjects');
export const deleteAssignment = remove('academics/class-subject-assignments');

export const batchUpdateClasses = batchUpdate<SchoolClass>('academics/classes');
export const batchUpdateSubjects = batchUpdate<Subject>('academics/subjects');
export const batchUpdateAssignments = batchUpdate<ClassSubjectAssignment>('academics/class-subject-assignments');
export const batchUpdateTimetable = batchUpdate<TimetableEntry>('academics/timetable-entries');
export const batchUpdateExams = batchUpdate<Exam>('academics/exams');
export const batchUpdateGrades = batchUpdate<Grade>('academics/grades');
export const batchUpdateAttendance = batchUpdate<AttendanceRecord>('academics/attendance-records');
// FIX: Point to correct backend route for events
export const batchUpdateEvents = batchUpdate<SchoolEvent>('academics/events');

export const getGrades = list<Grade>('academics/grades');
export const getAttendance = list<AttendanceRecord>('academics/attendance-records');

// Communications
export const createAnnouncement = create<Announcement>('communications/announcements');
export const updateAnnouncement = update<Announcement>('communications/announcements');
export const deleteAnnouncement = remove('communications/announcements');
export const createCommunicationLog = create<CommunicationLog>('communications/communication-logs');
export const getCommunicationLogs = list<CommunicationLog>('communications/communication-logs');
export const createBulkCommunicationLogs = (data: NewCommunicationLog[]): Promise<CommunicationLog[]> => apiFetch('/communications/communication-logs/batch', { method: 'POST', body: JSON.stringify(data) });

// Library
export const getBooks = list<Book>('library/books');
export const createBook = create<Book>('library/books');
export const updateBook = update<Book>('library/books');
export const deleteBook = remove('library/books');
export const issueBook = (data: IssueBookData): Promise<LibraryTransaction> => apiFetch('/library/issue', { method: 'POST', body: JSON.stringify(data) });
export const returnBook = (transactionId: string): Promise<LibraryTransaction> => apiFetch(`/library/return/${transactionId}`, { method: 'POST' });
export const markBookLost = (transactionId: string): Promise<LibraryTransaction> => apiFetch(`/library/lost/${transactionId}`, { method: 'POST' });
export const getLibraryTransactions = list<LibraryTransaction>('library/transactions');

// Super Admin
export const getAllSchools = list<School>('super-admin/schools');
export const getPlatformStats = (): Promise<any> => apiFetch('/super-admin/stats');
export const getSystemHealth = (): Promise<any> => apiFetch('/super-admin/health');
export const updateSchoolSubscription = (schoolId: string, data: any): Promise<School> => apiFetch(`/super-admin/schools/${schoolId}/subscription`, { method: 'PATCH', body: JSON.stringify(data) });
export const updatePlatformPricing = (data: Partial<PlatformPricing>): Promise<PlatformPricing> => apiFetch('/super-admin/pricing', { method: 'PUT', body: JSON.stringify(data) });
export const getSubscriptionPayments = list<any>('super-admin/payments');
export const recordManualSubscriptionPayment = (data: any) => apiFetch('/super-admin/payments/manual', { method: 'POST', body: JSON.stringify(data) });
