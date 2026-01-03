
import type { 
    User, Student, Transaction, Expense, Staff, Payroll, Subject, SchoolClass, 
    ClassSubjectAssignment, TimetableEntry, Exam, Grade, AttendanceRecord, SchoolEvent, 
    SchoolInfo, GradingRule, FeeItem, CommunicationLog, Announcement, ReportShareLog, 
    PayrollItem, DarajaSettings, MpesaC2BTransaction, NewStudent, NewStaff, 
    NewTransaction, NewExpense, NewPayrollItem, NewAnnouncement, NewCommunicationLog, 
    NewUser, NewGradingRule, NewFeeItem,
    Book, NewBook, LibraryTransaction, PlatformPricing
} from '../types';

/**
 * Safely constructs a query string from a parameters object,
 * omitting any undefined, null, or empty string values.
 */
const buildQueryString = (params: Record<string, any>): string => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            query.append(key, String(value));
        }
    });
    const queryString = query.toString();
    return queryString ? `?${queryString}` : '';
};

// This function acts as a client for our backend API.
const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('authToken');
    const headers = new Headers(options.headers);
    
    if (!(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }

    if (token && token !== 'undefined' && token !== 'null') {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`/api${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        
        // Robust extraction of error messages from NestJS
        let errorMessage = 'An unexpected server error occurred';
        if (errorData.message) {
            if (Array.isArray(errorData.message)) {
                // Join validation errors (e.g., "Email is invalid, Name too short")
                errorMessage = errorData.message.join(', ');
            } else if (typeof errorData.message === 'object') {
                errorMessage = JSON.stringify(errorData.message);
            } else {
                errorMessage = errorData.message;
            }
        }
        
        throw new Error(errorMessage);
    }

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
export const getDashboardStats = () => apiFetch('/dashboard/stats');

// Students
export const getStudents = (params: { page?: number, limit?: number, search?: string, classId?: string, status?: string, pagination?: string, mode?: string } = {}): Promise<any> => {
    return apiFetch(`/students${buildQueryString(params)}`);
};
export const createStudent = create<Student>('students');
export const updateStudent = update<Student>('students');
export const deleteStudent = remove('students');
export const updateMultipleStudents = (updates: Array<Partial<Student> & { id: string }>): Promise<Student[]> => apiFetch('/students/batch-update', { method: 'POST', body: JSON.stringify(updates) });
export const uploadStudentPhoto = (formData: FormData): Promise<{url: string}> => apiFetch('/students/upload-photo', { method: 'POST', body: formData });
export const exportStudents = (): Promise<Blob> => apiFetch('/students/export').then(res => res.blob());
export const importStudents = (formData: FormData): Promise<any> => apiFetch('/students/import', { method: 'POST', body: formData });

// Users
export const getUsers = list<User>('users');
export const createUser = create<User>('users');
export const updateUser = update<User>('users');
export const deleteUser = remove('users');
export const updateUserProfile = (data: Partial<User>): Promise<User> => apiFetch('/users/profile', { method: 'PATCH', body: JSON.stringify(data) });
export const uploadUserAvatar = (formData: FormData): Promise<{avatarUrl: string}> => apiFetch('/users/upload-avatar', { method: 'POST', body: formData });
export const adminUploadUserPhoto = (formData: FormData): Promise<{url: string}> => apiFetch('/users/upload-photo', { method: 'POST', body: formData });

// Transactions
export const getTransactions = (params: any = {}): Promise<any> => {
    return apiFetch(`/transactions${buildQueryString(params)}`);
};
export const createTransaction = create<Transaction>('transactions');
export const updateTransaction = update<Transaction>('transactions');
export const deleteTransaction = remove('transactions');
export const createMultipleTransactions = (data: NewTransaction[]): Promise<Transaction[]> => apiFetch('/transactions/batch', { method: 'POST', body: JSON.stringify(data) });

// Expenses
export const getExpenses = (params: any = {}): Promise<any> => {
    return apiFetch(`/expenses${buildQueryString(params)}`);
};
export const createExpense = create<Expense>('expenses');
export const updateExpense = (id: string, data: Partial<Expense>): Promise<Expense> => apiFetch(`/expenses/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteExpense = (id: string): Promise<void> => apiFetch(`/expenses/${id}`, { method: 'DELETE' });
export const uploadExpenseReceipt = (formData: FormData): Promise<{url: string}> => apiFetch('/expenses/upload-receipt', { method: 'POST', body: formData });
export const exportExpenses = (params: any): Promise<Blob> => {
    return apiFetch(`/expenses/export${buildQueryString(params)}`).then(res => res.blob());
};

// Staff
export const createStaff = create<Staff>('staff');
export const updateStaff = update<Staff>('staff');
export const getStaff = list<Staff>('staff');
export const uploadStaffPhoto = (formData: FormData): Promise<{url: string}> => apiFetch('/staff/upload-photo', { method: 'POST', body: formData });

// Payroll
export const savePayrollRun = (data: Payroll[]): Promise<Payroll[]> => apiFetch('/payroll/generate', { method: 'POST', body: JSON.stringify(data) });
export const getPayrollItems = () => apiFetch('/payroll/payroll-items');
export const createPayrollItem = (data: NewPayrollItem): Promise<any> => apiFetch('/payroll/payroll-items', { method: 'POST', body: JSON.stringify(data) });
export const updatePayrollItem = (id: string, data: any): Promise<any> => apiFetch(`/payroll/payroll-items/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deletePayrollItem = (id: string): Promise<void> => apiFetch(`/payroll/payroll-items/${id}`, { method: 'DELETE' });
export const getPayrollHistory = (params: any = {}): Promise<any> => {
    return apiFetch(`/payroll/payroll-history${buildQueryString(params)}`);
};

// Settings
export const getSchoolInfo = (): Promise<SchoolInfo> => apiFetch('/settings/school-info');
export const getPublicSchoolInfo = (): Promise<SchoolInfo> => apiFetch('/settings/public/school-info');
export const updateSchoolInfo = (data: SchoolInfo): Promise<SchoolInfo> => apiFetch('/settings/school-info', { method: 'PUT', body: JSON.stringify(data) });
export const getDarajaSettings = (): Promise<DarajaSettings> => apiFetch('/settings/daraja');
export const updateDarajaSettings = (data: DarajaSettings): Promise<DarajaSettings> => apiFetch('/settings/daraja', { method: 'PUT', body: JSON.stringify(data) });
export const uploadLogo = (formData: FormData): Promise<{logoUrl: string}> => apiFetch('/settings/upload-logo', { method: 'POST', body: formData });

// Grading
export const getGradingScale = list<GradingRule>('academics/grading-scale');
export const createGradingRule = create<GradingRule>('academics/grading-scale');
export const updateGradingRule = update<GradingRule>('academics/grading-scale');
export const deleteGradingRule = remove('academics/grading-scale');

// Fees
export const getFeeStructure = () => apiFetch('/academics/fee-structure');
export const findAllFeeItems = () => apiFetch('/academics/fee-structure');
export const createFeeItem = create<FeeItem>('academics/fee-structure');
export const updateFeeItem = update<FeeItem>('academics/fee-structure');
export const deleteFeeItem = remove('academics/fee-structure');

// Communications
export const findAllAnnouncements = (): Promise<Announcement[]> => apiFetch('/communications/announcements');
export const createAnnouncement = create<Announcement>('communications/announcements');
export const updateAnnouncement = (id: string, data: Partial<Announcement>): Promise<Announcement> => apiFetch(`/communications/announcements/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteAnnouncement = (id: string): Promise<void> => apiFetch(`/communications/announcements/${id}`, { method: 'DELETE' });
export const getCommunicationLogs = (params: any = {}): Promise<any> => {
    return apiFetch(`/communications/communication-logs${buildQueryString(params)}`);
};
export const createCommunicationLog = create<CommunicationLog>('communications/communication-logs');
export const createBulkCommunicationLogs = (data: NewCommunicationLog[]): Promise<CommunicationLog[]> => apiFetch('/communications/communication-logs/batch', { method: 'POST', body: JSON.stringify(data) });

// Academics (Batch updates)
export const updateClasses = batchUpdate<SchoolClass>('academics/classes');
export const updateSubjects = batchUpdate<Subject>('academics/subjects');
export const updateAssignments = batchUpdate<ClassSubjectAssignment>('academics/class-subject-assignments');
export const updateTimetable = batchUpdate<TimetableEntry>('academics/timetable-entries');
export const updateExams = batchUpdate<Exam>('academics/exams');
export const updateGrades = batchUpdate<Grade>('academics/grades');
export const updateAttendance = batchUpdate<AttendanceRecord>('academics/attendance-records');
export const updateEvents = batchUpdate<SchoolEvent>('academics/events');

// Compatibility aliases
export const getClasses = list<SchoolClass>('academics/classes');
export const getSubjects = list<Subject>('academics/subjects');

// Individual Academics
export const createClass = (data: any): Promise<SchoolClass> => apiFetch('/academics/classes', { method: 'POST', body: JSON.stringify(data) });
export const updateClass = (id: string, data: any): Promise<SchoolClass> => apiFetch(`/academics/classes/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteClass = (id: string): Promise<void> => apiFetch(`/class/classes/${id}`, { method: 'DELETE' });
export const createSubject = (data: any): Promise<Subject> => apiFetch('/academics/subjects', { method: 'POST', body: JSON.stringify(data) });
export const updateSubject = (id: string, data: any): Promise<Subject> => apiFetch(`/academics/subjects/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteSubject = (id: string): Promise<void> => apiFetch(`/academics/subjects/${id}`, { method: 'DELETE' });
export const createAssignment = (data: any): Promise<any> => apiFetch('/academics/class-subject-assignments', { method: 'POST', body: JSON.stringify(data) });
export const deleteAssignment = (id: string): Promise<void> => apiFetch(`/academics/class-subject-assignments/${id}`, { method: 'DELETE' });
export const findAllExams = (): Promise<Exam[]> => apiFetch('/academics/exams');
export const findAllAssignments = () => apiFetch('/academics/class-subject-assignments');
export const findAllTimetableEntries = () => apiFetch('/academics/timetable-entries');
export const getGrades = (params: any = {}): Promise<Grade[]> => {
    return apiFetch(`/academics/grades${buildQueryString(params)}`);
};
export const getAttendance = (params: any = {}): Promise<any> => {
    return apiFetch(`/academics/attendance-records${buildQueryString(params)}`);
};
export const getEvents = (): Promise<SchoolEvent[]> => apiFetch('/academics/events');

// Library
export const getBooks = (params: any = {}): Promise<any> => {
    return apiFetch(`/library/books${buildQueryString(params)}`);
};
export const addBook = (data: NewBook): Promise<Book> => apiFetch('/library/books', { method: 'POST', body: JSON.stringify(data) });
export const updateBook = (id: string, data: any): Promise<Book> => apiFetch(`/library/books/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteBook = (id: string): Promise<void> => apiFetch(`/library/books/${id}`, { method: 'DELETE' });
export const issueBook = (data: any): Promise<LibraryTransaction> => apiFetch('/library/issue', { method: 'POST', body: JSON.stringify(data) });
export const returnBook = (id: string): Promise<LibraryTransaction> => apiFetch(`/library/return/${id}`, { method: 'POST' });
export const markBookLost = (id: string): Promise<LibraryTransaction> => apiFetch(`/library/lost/${id}`, { method: 'POST' });
export const getLibraryTransactions = (params: any = {}): Promise<any> => {
    return apiFetch(`/library/transactions${buildQueryString(params)}`);
};

// Super Admin
export const getAllSchools = (): Promise<any[]> => apiFetch('/super-admin/schools');
export const getPlatformStats = (): Promise<any> => apiFetch('/super-admin/stats');
export const getSystemHealth = (): Promise<any> => apiFetch('/super-admin/health');
export const getPlatformPricing = (): Promise<PlatformPricing> => apiFetch('/settings/public/pricing');
export const updatePlatformPricing = (settings: any): Promise<any> => apiFetch('/super-admin/pricing', { method: 'PUT', body: JSON.stringify(settings) });
export const updateSchoolSubscription = (schoolId: string, payload: any): Promise<any> => apiFetch(`/super-admin/schools/${schoolId}/subscription`, { method: 'PATCH', body: JSON.stringify(payload) });
export const getSubscriptionPayments = (): Promise<any[]> => apiFetch('/super-admin/payments');
export const recordManualSubscriptionPayment = (data: any): Promise<any> => apiFetch('/super-admin/payments/manual', { method: 'POST', body: JSON.stringify(data) });
export const updateSchoolEmail = (id: string, email: string): Promise<any> => apiFetch(`/super-admin/schools/${id}/email`, { method: 'PATCH', body: JSON.stringify({ email }) });

export const registerSchool = (data: any): Promise<any> => apiFetch('/auth/register-school', { method: 'POST', body: JSON.stringify(data) });
export const createPaymentIntent = (data: { plan: string, billingCycle: string, email: string }): Promise<{ clientSecret: string, amount: number }> => apiFetch('/auth/create-payment-intent', { method: 'POST', body: JSON.stringify(data) });
