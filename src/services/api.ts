
import type { 
    User, Student, Transaction, Expense, Staff, Payroll, Subject, SchoolClass, 
    ClassSubjectAssignment, TimetableEntry, Exam, Grade, AttendanceRecord, SchoolEvent, 
    SchoolInfo, GradingRule, FeeItem, CommunicationLog, Announcement, ReportShareLog, 
    PayrollItem, DarajaSettings, MpesaC2BTransaction, NewStudent, NewStaff, 
    NewTransaction, NewExpense, NewPayrollItem, NewAnnouncement, NewCommunicationLog, 
    NewUser, NewGradingRule, NewFeeItem,
    /* FIX: Added missing type imports for Library and Platform features */
    Book, NewBook, LibraryTransaction, PlatformPricing
} from '../types';

/**
 * Robustly builds a query string by removing empty, null, or undefined filters.
 * This prevents the backend from receiving "undefined" as a string.
 */
const buildQueryString = (params: any): string => {
    const query = new URLSearchParams();
    Object.keys(params).forEach(key => {
        const val = params[key];
        if (val !== undefined && val !== null && val !== '' && val !== 'all') {
            query.append(key, val.toString());
        }
    });
    return query.toString();
};

const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('authToken');
    const headers = new Headers(options.headers);
    
    if (!(options.body instanceof FormData)) {
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
        throw new Error(errorData.message || `API Error: ${response.status}`);
    }

    if (response.status === 204) return null;
    return response.json();
};

// --- API Methods ---

export const login = (credentials: {email: string, password: string}): Promise<{user: User, token: string}> => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
export const logout = (): Promise<void> => apiFetch('/auth/logout', { method: 'POST' });
export const getAuthenticatedUser = (): Promise<User> => apiFetch('/auth/me');

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

export const getDashboardStats = () => apiFetch('/dashboard/stats');

export const getStudents = (params: any = {}): Promise<any> => {
    const qs = buildQueryString(params);
    return apiFetch(`/students?${qs}`);
};

export const createStudent = (data: NewStudent): Promise<Student> => apiFetch('/students', { method: 'POST', body: JSON.stringify(data) });
export const updateStudent = (id: string, data: any): Promise<Student> => apiFetch(`/students/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteStudent = (id: string): Promise<void> => apiFetch(`/students/${id}`, { method: 'DELETE' });
export const updateMultipleStudents = (updates: any[]): Promise<Student[]> => apiFetch('/students/batch-update', { method: 'POST', body: JSON.stringify(updates) });
export const uploadStudentPhoto = (formData: FormData): Promise<{url: string}> => apiFetch('/students/upload-photo', { method: 'POST', body: formData });
export const exportStudents = (): Promise<Blob> => apiFetch('/students/export').then(res => res.blob());
export const importStudents = (formData: FormData): Promise<any> => apiFetch('/students/import', { method: 'POST', body: formData });

export const getUsers = () => apiFetch('/users');
export const createUser = (data: NewUser): Promise<User> => apiFetch('/users', { method: 'POST', body: JSON.stringify(data) });
export const updateUser = (id: string, data: any): Promise<User> => apiFetch(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteUser = (id: string): Promise<void> => apiFetch(`/users/${id}`, { method: 'DELETE' });
export const updateUserProfile = (data: Partial<User>): Promise<User> => apiFetch('/users/profile', { method: 'PATCH', body: JSON.stringify(data) });
export const uploadUserAvatar = (formData: FormData): Promise<{avatarUrl: string}> => apiFetch('/users/upload-avatar', { method: 'POST', body: formData });

/* FIX: Added missing adminUploadUserPhoto function to resolve context error */
export const adminUploadUserPhoto = (formData: FormData): Promise<{url: string}> => apiFetch('/users/upload-photo', { method: 'POST', body: formData });

export const getTransactions = (params: any = {}): Promise<any> => {
    const qs = buildQueryString(params);
    return apiFetch(`/transactions?${qs}`);
};
export const createTransaction = (data: NewTransaction): Promise<Transaction> => apiFetch('/transactions', { method: 'POST', body: JSON.stringify(data) });
export const updateTransaction = (id: string, data: any): Promise<Transaction> => apiFetch(`/transactions/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteTransaction = (id: string): Promise<void> => apiFetch(`/transactions/${id}`, { method: 'DELETE' });
export const createMultipleTransactions = (data: NewTransaction[]): Promise<Transaction[]> => apiFetch('/transactions/batch', { method: 'POST', body: JSON.stringify(data) });

export const getExpenses = (params: any = {}): Promise<any> => {
    const qs = buildQueryString(params);
    return apiFetch(`/expenses?${qs}`);
};
export const createExpense = (data: NewExpense): Promise<Expense> => apiFetch('/expenses', { method: 'POST', body: JSON.stringify(data) });
export const updateExpense = (id: string, data: Partial<Expense>): Promise<Expense> => apiFetch(`/expenses/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteExpense = (id: string): Promise<void> => apiFetch(`/expenses/${id}`, { method: 'DELETE' });
export const uploadExpenseReceipt = (formData: FormData): Promise<{url: string}> => apiFetch('/expenses/upload-receipt', { method: 'POST', body: formData });
export const exportExpenses = (params: any): Promise<Blob> => {
    const qs = buildQueryString(params);
    return apiFetch(`/expenses/export?${qs}`).then(res => res.blob());
};

export const getStaff = () => apiFetch('/staff');
export const createStaff = (data: NewStaff): Promise<Staff> => apiFetch('/staff', { method: 'POST', body: JSON.stringify(data) });
export const updateStaff = (id: string, data: any): Promise<Staff> => apiFetch(`/staff/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const uploadStaffPhoto = (formData: FormData): Promise<{url: string}> => apiFetch('/staff/upload-photo', { method: 'POST', body: formData });

export const savePayrollRun = (data: Payroll[]): Promise<Payroll[]> => apiFetch('/payroll/generate', { method: 'POST', body: JSON.stringify(data) });
export const getPayrollItems = () => apiFetch('/payroll/payroll-items');
export const createPayrollItem = (data: NewPayrollItem): Promise<any> => apiFetch('/payroll/payroll-items', { method: 'POST', body: JSON.stringify(data) });
export const updatePayrollItem = (id: string, data: any): Promise<any> => apiFetch(`/payroll/payroll-items/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deletePayrollItem = (id: string): Promise<void> => apiFetch(`/payroll/payroll-items/${id}`, { method: 'DELETE' });
export const getPayrollHistory = (params: any = {}): Promise<any> => {
    const qs = buildQueryString(params);
    return apiFetch(`/payroll/payroll-history?${qs}`);
};

export const getSchoolInfo = (): Promise<SchoolInfo> => apiFetch('/settings/school-info');
export const getPublicSchoolInfo = (): Promise<SchoolInfo> => apiFetch('/settings/public/school-info');
export const updateSchoolInfo = (data: SchoolInfo): Promise<SchoolInfo> => apiFetch('/settings/school-info', { method: 'PUT', body: JSON.stringify(data) });
export const getDarajaSettings = (): Promise<DarajaSettings> => apiFetch('/settings/daraja');
export const updateDarajaSettings = (data: DarajaSettings): Promise<DarajaSettings> => apiFetch('/settings/daraja', { method: 'PUT', body: JSON.stringify(data) });
export const uploadLogo = (formData: FormData): Promise<{logoUrl: string}> => apiFetch('/settings/upload-logo', { method: 'POST', body: formData });

export const getGradingScale = () => apiFetch('/academics/grading-scale');
export const createGradingRule = (data: NewGradingRule): Promise<GradingRule> => apiFetch('/academics/grading-scale', { method: 'POST', body: JSON.stringify(data) });
export const updateGradingRule = (id: string, data: any): Promise<GradingRule> => apiFetch(`/academics/grading-scale/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteGradingRule = (id: string): Promise<void> => apiFetch(`/academics/grading-scale/${id}`, { method: 'DELETE' });

export const getFeeStructure = () => apiFetch('/academics/fee-structure');
export const createFeeItem = (data: NewFeeItem): Promise<FeeItem> => apiFetch('/academics/fee-structure', { method: 'POST', body: JSON.stringify(data) });
export const updateFeeItem = (id: string, data: any): Promise<FeeItem> => apiFetch(`/academics/fee-structure/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteFeeItem = (id: string): Promise<void> => apiFetch(`/academics/fee-structure/${id}`, { method: 'DELETE' });

export const findAllAnnouncements = (): Promise<Announcement[]> => apiFetch('/communications/announcements');
export const createAnnouncement = (data: any): Promise<Announcement> => apiFetch('/communications/announcements', { method: 'POST', body: JSON.stringify(data) });
export const updateAnnouncement = (id: string, data: Partial<Announcement>): Promise<Announcement> => apiFetch(`/communications/announcements/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteAnnouncement = (id: string): Promise<void> => apiFetch(`/communications/announcements/${id}`, { method: 'DELETE' });

export const getCommunicationLogs = (params: any = {}): Promise<any> => {
    const qs = buildQueryString(params);
    return apiFetch(`/communications/communication-logs?${qs}`);
};
export const createCommunicationLog = (data: NewCommunicationLog): Promise<CommunicationLog> => apiFetch('/communications/communication-logs', { method: 'POST', body: JSON.stringify(data) });
export const createBulkCommunicationLogs = (data: NewCommunicationLog[]): Promise<CommunicationLog[]> => apiFetch('/communications/communication-logs/batch', { method: 'POST', body: JSON.stringify(data) });

export const getClasses = () => apiFetch('/academics/classes');
export const createClass = (data: any): Promise<SchoolClass> => apiFetch('/academics/classes', { method: 'POST', body: JSON.stringify(data) });
export const updateClass = (id: string, data: any): Promise<SchoolClass> => apiFetch(`/academics/classes/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteClass = (id: string): Promise<void> => apiFetch(`/academics/classes/${id}`, { method: 'DELETE' });
export const updateClasses = (data: any[]): Promise<void> => apiFetch('/academics/classes/batch', { method: 'PUT', body: JSON.stringify(data) });

export const getSubjects = () => apiFetch('/academics/subjects');
export const createSubject = (data: any): Promise<Subject> => apiFetch('/academics/subjects', { method: 'POST', body: JSON.stringify(data) });
export const updateSubject = (id: string, data: any): Promise<Subject> => apiFetch(`/academics/subjects/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteSubject = (id: string): Promise<void> => apiFetch(`/academics/subjects/${id}`, { method: 'DELETE' });
export const updateSubjects = (data: any[]): Promise<void> => apiFetch('/academics/subjects/batch', { method: 'PUT', body: JSON.stringify(data) });

export const findAllAssignments = () => apiFetch('/academics/class-subject-assignments');
export const createAssignment = (data: any): Promise<any> => apiFetch('/academics/class-subject-assignments', { method: 'POST', body: JSON.stringify(data) });
export const deleteAssignment = (id: string): Promise<void> => apiFetch(`/academics/class-subject-assignments/${id}`, { method: 'DELETE' });
export const updateAssignments = (data: any[]): Promise<void> => apiFetch('/academics/class-subject-assignments/batch', { method: 'PUT', body: JSON.stringify(data) });

export const findAllTimetableEntries = () => apiFetch('/academics/timetable-entries');
export const updateTimetable = (data: any[]): Promise<void> => apiFetch('/academics/timetable-entries/batch', { method: 'PUT', body: JSON.stringify(data) });

export const findAllExams = (): Promise<Exam[]> => apiFetch('/academics/exams');
export const createExam = (data: any): Promise<Exam> => apiFetch('/academics/exams', { method: 'POST', body: JSON.stringify(data) });
export const updateExam = (id: string, data: any): Promise<Exam> => apiFetch(`/academics/exams/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteExam = (id: string): Promise<void> => apiFetch(`/academics/exams/${id}`, { method: 'DELETE' });
export const updateExams = (data: any[]): Promise<void> => apiFetch('/academics/exams/batch', { method: 'PUT', body: JSON.stringify(data) });

export const getGrades = (params: any = {}): Promise<Grade[]> => {
    const qs = buildQueryString(params);
    return apiFetch(`/academics/grades?${qs}`);
};
export const updateGrades = (data: any[]): Promise<void> => apiFetch('/academics/grades/batch', { method: 'PUT', body: JSON.stringify(data) });

export const getAttendance = (params: any = {}): Promise<any> => {
    const qs = buildQueryString(params);
    return apiFetch(`/academics/attendance-records?${qs}`);
};
export const updateAttendance = (data: any[]): Promise<void> => apiFetch('/academics/attendance-records/batch', { method: 'PUT', body: JSON.stringify(data) });

export const getEvents = (): Promise<SchoolEvent[]> => apiFetch('/academics/events');
export const updateEvents = (data: any[]): Promise<void> => apiFetch('/academics/events/batch', { method: 'PUT', body: JSON.stringify(data) });

export const getBooks = (params: any = {}): Promise<any> => {
    const qs = buildQueryString(params);
    return apiFetch(`/library/books?${qs}`);
};
export const addBook = (data: NewBook): Promise<Book> => apiFetch('/library/books', { method: 'POST', body: JSON.stringify(data) });
export const updateBook = (id: string, data: any): Promise<Book> => apiFetch(`/library/books/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteBook = (id: string): Promise<void> => apiFetch(`/library/books/${id}`, { method: 'DELETE' });
export const issueBook = (data: any): Promise<LibraryTransaction> => apiFetch('/library/issue', { method: 'POST', body: JSON.stringify(data) });
export const returnBook = (id: string): Promise<LibraryTransaction> => apiFetch(`/library/return/${id}`, { method: 'POST' });
export const markBookLost = (id: string): Promise<LibraryTransaction> => apiFetch(`/library/lost/${id}`, { method: 'POST' });
export const getLibraryTransactions = (params: any = {}): Promise<any> => {
    const qs = buildQueryString(params);
    return apiFetch(`/library/transactions?${qs}`);
};

export const getAllSchools = (): Promise<any[]> => apiFetch('/super-admin/schools');
export const getPlatformStats = (): Promise<any> => apiFetch('/super-admin/stats');
export const getSystemHealth = (): Promise<any> => apiFetch('/super-admin/health');
export const getPlatformPricing = (): Promise<PlatformPricing> => apiFetch('/settings/public/pricing');
export const updatePlatformPricing = (settings: any): Promise<any> => apiFetch('/super-admin/pricing', { method: 'PUT', body: JSON.stringify(settings) });
export const updateSchoolSubscription = (schoolId: string, payload: any): Promise<any> => apiFetch(`/super-admin/schools/${schoolId}/subscription`, { method: 'PATCH', body: JSON.stringify(payload) });
export const getSubscriptionPayments = (): Promise<any[]> => apiFetch('/super-admin/payments');

export const registerSchool = (data: any): Promise<any> => apiFetch('/auth/register-school', { method: 'POST', body: JSON.stringify(data) });
