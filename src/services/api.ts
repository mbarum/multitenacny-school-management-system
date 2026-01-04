import type { 
    User, Student, Transaction, Expense, Staff, Payroll, Subject, SchoolClass, 
    ClassSubjectAssignment, TimetableEntry, Exam, Grade, AttendanceRecord, SchoolEvent, 
    SchoolInfo, GradingRule, FeeItem, CommunicationLog, Announcement, ReportShareLog, 
    PayrollItem, DarajaSettings, MpesaC2BTransaction, NewStudent, NewStaff, 
    NewTransaction, NewExpense, NewPayrollItem, NewAnnouncement, NewCommunicationLog, 
    NewUser, NewGradingRule, NewFeeItem, PlatformPricing, Book, NewBook 
} from '../types';

/**
 * Clean parameters to prevent sending "undefined" or "null" strings to the API
 */
const cleanParams = (params: Record<string, any>) => {
    const cleaned: Record<string, any> = {};
    Object.keys(params).forEach(key => {
        const val = params[key];
        if (val !== undefined && val !== null && val !== '' && val !== 'undefined') {
            cleaned[key] = val;
        }
    });
    return cleaned;
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
        throw new Error(errorData.message || 'Server connection failed.');
    }

    if (response.status === 204) return null;
    return response.json();
};

// --- API Methods ---

// Auth
export const login = (credentials: {email: string, password: string}): Promise<{user: User, token: string}> => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
export const logout = (): Promise<void> => apiFetch('/auth/logout', { method: 'POST' });
export const getAuthenticatedUser = (): Promise<User> => apiFetch('/auth/me');

// Dashboard
export const getDashboardStats = () => apiFetch('/dashboard/stats');

// Students
export const getStudents = (params: any = {}): Promise<any> => {
    const query = new URLSearchParams(cleanParams(params));
    return apiFetch(`/students?${query.toString()}`);
};
export const createStudent = (data: NewStudent): Promise<Student> => apiFetch('/students', { method: 'POST', body: JSON.stringify(data) });
export const updateStudent = (id: string, data: Partial<Student>): Promise<Student> => apiFetch(`/students/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteStudent = (id: string): Promise<void> => apiFetch(`/students/${id}`, { method: 'DELETE' });
export const updateMultipleStudents = (updates: any[]): Promise<Student[]> => apiFetch('/students/batch-update', { method: 'POST', body: JSON.stringify(updates) });
export const uploadStudentPhoto = (formData: FormData): Promise<{url: string}> => apiFetch('/students/upload-photo', { method: 'POST', body: formData });
export const exportStudents = (): Promise<Blob> => apiFetch('/students/export');
export const importStudents = (formData: FormData): Promise<any> => apiFetch('/students/import', { method: 'POST', body: formData });

// Users
export const getUsers = (): Promise<User[]> => apiFetch('/users');
export const createUser = (data: NewUser): Promise<User> => apiFetch('/users', { method: 'POST', body: JSON.stringify(data) });
export const updateUser = (id: string, data: Partial<User>): Promise<User> => apiFetch(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteUser = (id: string): Promise<void> => apiFetch(`/users/${id}`, { method: 'DELETE' });
export const updateUserProfile = (data: Partial<User>): Promise<User> => apiFetch('/users/profile', { method: 'PATCH', body: JSON.stringify(data) });
export const uploadUserAvatar = (formData: FormData): Promise<{avatarUrl: string}> => apiFetch('/users/upload-avatar', { method: 'POST', body: formData });
export const adminUploadUserPhoto = (formData: FormData): Promise<{url: string}> => apiFetch('/users/upload-photo', { method: 'POST', body: formData });

// Transactions
export const getTransactions = (params: any = {}): Promise<any> => {
    const query = new URLSearchParams(cleanParams(params));
    return apiFetch(`/transactions?${query.toString()}`);
};
export const createTransaction = (data: NewTransaction): Promise<Transaction> => apiFetch('/transactions', { method: 'POST', body: JSON.stringify(data) });
export const createMultipleTransactions = (data: NewTransaction[]): Promise<Transaction[]> => apiFetch('/transactions/batch', { method: 'POST', body: JSON.stringify(data) });
export const updateTransaction = (id: string, data: any): Promise<Transaction> => apiFetch(`/transactions/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteTransaction = (id: string): Promise<void> => apiFetch(`/transactions/${id}`, { method: 'DELETE' });

// Expenses
export const getExpenses = (params: any = {}): Promise<any> => {
    const query = new URLSearchParams(cleanParams(params));
    return apiFetch(`/expenses?${query.toString()}`);
};
export const createExpense = (data: NewExpense): Promise<Expense> => apiFetch('/expenses', { method: 'POST', body: JSON.stringify(data) });
export const updateExpense = (id: string, data: Partial<Expense>): Promise<Expense> => apiFetch(`/expenses/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteExpense = (id: string): Promise<void> => apiFetch(`/expenses/${id}`, { method: 'DELETE' });
export const uploadExpenseReceipt = (formData: FormData): Promise<{url: string}> => apiFetch('/expenses/upload-receipt', { method: 'POST', body: formData });
export const exportExpenses = (params: any): Promise<Blob> => {
    const query = new URLSearchParams(cleanParams(params));
    return apiFetch(`/expenses/export?${query.toString()}`);
};

// Staff
export const getStaff = (): Promise<Staff[]> => apiFetch('/staff');
export const createStaff = (data: NewStaff): Promise<Staff> => apiFetch('/staff', { method: 'POST', body: JSON.stringify(data) });
export const updateStaff = (id: string, data: Partial<Staff>): Promise<Staff> => apiFetch(`/staff/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteStaff = (id: string): Promise<void> => apiFetch(`/staff/${id}`, { method: 'DELETE' });
export const uploadStaffPhoto = (formData: FormData): Promise<{url: string}> => apiFetch('/staff/upload-photo', { method: 'POST', body: formData });

// Payroll
export const savePayrollRun = (data: Payroll[]): Promise<Payroll[]> => apiFetch('/payroll/generate', { method: 'POST', body: JSON.stringify(data) });
export const getPayrollHistory = (params: any = {}): Promise<any> => {
    const query = new URLSearchParams(cleanParams(params));
    return apiFetch(`/payroll/payroll-history?${query.toString()}`);
};
export const getPayrollItems = (): Promise<PayrollItem[]> => apiFetch('/payroll/payroll-items');
export const createPayrollItem = (data: NewPayrollItem): Promise<PayrollItem> => apiFetch('/payroll/payroll-items', { method: 'POST', body: JSON.stringify(data) });
export const updatePayrollItem = (id: string, data: Partial<PayrollItem>): Promise<PayrollItem> => apiFetch(`/payroll/payroll-items/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deletePayrollItem = (id: string): Promise<void> => apiFetch(`/payroll/payroll-items/${id}`, { method: 'DELETE' });

// Settings
export const getSchoolInfo = (): Promise<SchoolInfo> => apiFetch('/settings/school-info');
export const getPublicSchoolInfo = (): Promise<SchoolInfo> => apiFetch('/settings/public/school-info');
export const updateSchoolInfo = (data: SchoolInfo): Promise<SchoolInfo> => apiFetch('/settings/school-info', { method: 'PUT', body: JSON.stringify(data) });
export const getDarajaSettings = (): Promise<DarajaSettings> => apiFetch('/settings/daraja');
export const updateDarajaSettings = (data: DarajaSettings): Promise<DarajaSettings> => apiFetch('/settings/daraja', { method: 'PUT', body: JSON.stringify(data) });
export const uploadLogo = (formData: FormData): Promise<{logoUrl: string}> => apiFetch('/settings/upload-logo', { method: 'POST', body: formData });

// Academics
export const getClasses = (): Promise<any> => apiFetch('/academics/classes');
export const createClass = (data: any): Promise<any> => apiFetch('/academics/classes', { method: 'POST', body: JSON.stringify(data) });
export const updateClass = (id: string, data: any): Promise<any> => apiFetch(`/academics/classes/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteClass = (id: string): Promise<void> => apiFetch(`/academics/classes/${id}`, { method: 'DELETE' });
export const updateClasses = (data: SchoolClass[]): Promise<any> => apiFetch('/academics/classes/batch', { method: 'PUT', body: JSON.stringify(data) });

export const getSubjects = (): Promise<any> => apiFetch('/academics/subjects');
export const createSubject = (data: any): Promise<any> => apiFetch('/academics/subjects', { method: 'POST', body: JSON.stringify(data) });
export const updateSubject = (id: string, data: any): Promise<any> => apiFetch(`/academics/subjects/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteSubject = (id: string): Promise<void> => apiFetch(`/academics/subjects/${id}`, { method: 'DELETE' });
export const updateSubjects = (data: any[]): Promise<any> => apiFetch('/academics/subjects/batch', { method: 'PUT', body: JSON.stringify(data) });

export const findAllAssignments = (): Promise<any> => apiFetch('/academics/class-subject-assignments');
export const createAssignment = (data: any): Promise<any> => apiFetch('/academics/class-subject-assignments', { method: 'POST', body: JSON.stringify(data) });
export const deleteAssignment = (id: string): Promise<void> => apiFetch(`/academics/class-subject-assignments/${id}`, { method: 'DELETE' });
export const updateAssignments = (data: any[]): Promise<any> => apiFetch('/academics/class-subject-assignments/batch', { method: 'PUT', body: JSON.stringify(data) });

export const findAllTimetableEntries = (): Promise<TimetableEntry[]> => apiFetch('/academics/timetable-entries');
export const updateTimetable = (data: any[]): Promise<any> => apiFetch('/academics/timetable-entries/batch', { method: 'PUT', body: JSON.stringify(data) });

export const findAllExams = (): Promise<Exam[]> => apiFetch('/academics/exams');
export const createExam = (data: any): Promise<any> => apiFetch('/academics/exams', { method: 'POST', body: JSON.stringify(data) });
export const updateExam = (id: string, data: any): Promise<any> => apiFetch(`/academics/exams/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteExam = (id: string): Promise<void> => apiFetch(`/academics/exams/${id}`, { method: 'DELETE' });
export const updateExams = (data: any[]): Promise<any> => apiFetch('/academics/exams/batch', { method: 'PUT', body: JSON.stringify(data) });

export const getGrades = (params: any = {}): Promise<Grade[]> => {
    const query = new URLSearchParams(cleanParams(params));
    return apiFetch(`/academics/grades?${query.toString()}`);
};
export const updateGrades = (data: any[]): Promise<any> => apiFetch('/academics/grades/batch', { method: 'PUT', body: JSON.stringify(data) });

export const getAttendance = (params: any = {}): Promise<any> => {
    const query = new URLSearchParams(cleanParams(params));
    return apiFetch(`/academics/attendance-records?${query.toString()}`);
};
export const updateAttendance = (data: any[]): Promise<any> => apiFetch('/academics/attendance-records/batch', { method: 'PUT', body: JSON.stringify(data) });

export const getEvents = (): Promise<SchoolEvent[]> => apiFetch('/academics/events');
export const updateEvents = (data: any[]): Promise<any> => apiFetch('/academics/events/batch', { method: 'PUT', body: JSON.stringify(data) });

export const getGradingScale = (): Promise<GradingRule[]> => apiFetch('/academics/grading-scale');
export const createGradingRule = (data: NewGradingRule): Promise<GradingRule> => apiFetch('/academics/grading-scale', { method: 'POST', body: JSON.stringify(data) });
export const updateGradingRule = (id: string, data: Partial<GradingRule>): Promise<GradingRule> => apiFetch(`/academics/grading-scale/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteGradingRule = (id: string): Promise<void> => apiFetch(`/academics/grading-scale/${id}`, { method: 'DELETE' });

export const getFeeStructure = (): Promise<FeeItem[]> => apiFetch('/academics/fee-structure');
export const createFeeItem = (data: NewFeeItem): Promise<FeeItem> => apiFetch('/academics/fee-structure', { method: 'POST', body: JSON.stringify(data) });
export const updateFeeItem = (id: string, data: Partial<FeeItem>): Promise<FeeItem> => apiFetch(`/academics/fee-structure/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteFeeItem = (id: string): Promise<void> => apiFetch(`/academics/fee-structure/${id}`, { method: 'DELETE' });

// Communication
export const findAllAnnouncements = (): Promise<Announcement[]> => apiFetch('/communications/announcements');
export const createAnnouncement = (data: NewAnnouncement): Promise<Announcement> => apiFetch('/communications/announcements', { method: 'POST', body: JSON.stringify(data) });
export const updateAnnouncement = (id: string, data: Partial<Announcement>): Promise<Announcement> => apiFetch(`/communications/announcements/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteAnnouncement = (id: string): Promise<void> => apiFetch(`/communications/announcements/${id}`, { method: 'DELETE' });

export const getCommunicationLogs = (params: any = {}): Promise<any> => {
    const query = new URLSearchParams(cleanParams(params));
    return apiFetch(`/communications/communication-logs?${query.toString()}`);
};
export const createCommunicationLog = (data: NewCommunicationLog): Promise<CommunicationLog> => apiFetch('/communications/communication-logs', { method: 'POST', body: JSON.stringify(data) });
export const createBulkCommunicationLogs = (data: NewCommunicationLog[]): Promise<CommunicationLog[]> => apiFetch('/communications/communication-logs/batch', { method: 'POST', body: JSON.stringify(data) });

// Platform (Super Admin)
export const getPlatformStats = () => apiFetch('/super-admin/stats');
export const getAllSchools = () => apiFetch('/super-admin/schools');
export const getSystemHealth = () => apiFetch('/super-admin/health');
export const getPlatformPricing = (): Promise<PlatformPricing> => apiFetch('/settings/public/pricing');
export const updatePlatformPricing = (data: Partial<PlatformPricing>) => apiFetch('/super-admin/pricing', { method: 'PUT', body: JSON.stringify(data) });
export const updateSchoolSubscription = (schoolId: string, payload: any) => apiFetch(`/super-admin/schools/${schoolId}/subscription`, { method: 'PATCH', body: JSON.stringify(payload) });
export const getSubscriptionPayments = () => apiFetch('/super-admin/payments');
export const recordManualSubscriptionPayment = (data: any) => apiFetch('/super-admin/payments/manual', { method: 'POST', body: JSON.stringify(data) });
export const updateSchoolEmail = (id: string, email: string) => apiFetch(`/super-admin/schools/${id}/email`, { method: 'PATCH', body: JSON.stringify({ email }) });
export const updateSchoolPhone = (id: string, phone: string) => apiFetch(`/super-admin/schools/${id}/phone`, { method: 'PATCH', body: JSON.stringify({ phone }) });

// Registration
export const registerSchool = (data: any) => apiFetch('/auth/register-school', { method: 'POST', body: JSON.stringify(data) });
export const createPaymentIntent = (data: any) => apiFetch('/auth/create-payment-intent', { method: 'POST', body: JSON.stringify(data) });

// Library
export const getBooks = (params: any = {}): Promise<any> => {
    const query = new URLSearchParams(cleanParams(params));
    return apiFetch(`/library/books?${query.toString()}`);
};
export const addBook = (data: NewBook): Promise<any> => apiFetch('/library/books', { method: 'POST', body: JSON.stringify(data) });
export const updateBook = (id: string, data: Partial<Book>): Promise<any> => apiFetch(`/library/books/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteBook = (id: string): Promise<void> => apiFetch(`/library/books/${id}`, { method: 'DELETE' });
export const issueBook = (data: any): Promise<any> => apiFetch('/library/issue', { method: 'POST', body: JSON.stringify(data) });
export const returnBook = (id: string): Promise<any> => apiFetch(`/library/return/${id}`, { method: 'POST' });
export const markBookLost = (id: string): Promise<any> => apiFetch(`/library/lost/${id}`, { method: 'POST' });
export const getLibraryTransactions = (params: any = {}): Promise<any> => {
    const query = new URLSearchParams(cleanParams(params));
    return apiFetch(`/library/transactions?${query.toString()}`);
};
