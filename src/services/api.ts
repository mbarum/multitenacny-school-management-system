
import type { 
    User, Student, Transaction, Expense, Staff, Payroll, Subject, SchoolClass, 
    Exam, Grade, AttendanceRecord, SchoolEvent, SchoolInfo, GradingRule, FeeItem, 
    DarajaSettings, NewStudent, NewStaff, NewTransaction, NewExpense, 
    NewUser, NewGradingRule, NewFeeItem, PlatformPricing, Announcement, NewAnnouncement,
    CommunicationLog, NewCommunicationLog, Book, NewBook, LibraryTransaction
} from '../types';

const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers);
    if (!(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }
    
    const response = await fetch(`/api${endpoint}`, {
        ...options,
        headers,
        credentials: 'include',
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `API Error: ${response.status}`);
    }
    if (response.status === 204) return null;
    return response.json();
};

// --- GETTERS ---
export const getStudents = (params: any = {}): Promise<any> => {
    const query = new URLSearchParams(params);
    return apiFetch(`/students?${query.toString()}`);
};
export const getDashboardStats = () => apiFetch('/dashboard/stats');
export const getSchoolInfo = () => apiFetch('/settings/school-info');
// Fix: Added missing getPublicSchoolInfo method
export const getPublicSchoolInfo = (): Promise<SchoolInfo> => apiFetch('/settings/public/school-info');
export const getPlatformPricing = (): Promise<PlatformPricing> => apiFetch('/settings/public/pricing');
export const getFeeStructure = () => apiFetch('/academics/fee-structure');
export const getGradingScale = () => apiFetch('/academics/grading-scale');
export const getDarajaSettings = () => apiFetch('/settings/daraja');
export const getStaff = (): Promise<Staff[]> => apiFetch('/staff');
// Fix: Added missing getPayrollItems method
export const getPayrollItems = (): Promise<any[]> => apiFetch('/payroll/payroll-items');
export const getPayrollHistory = (params: any = {}) => {
    const query = new URLSearchParams(params);
    return apiFetch(`/payroll/payroll-history?${query.toString()}`);
};
export const getClasses = (): Promise<any> => apiFetch('/academics/classes');
export const getSubjects = (): Promise<any> => apiFetch('/academics/subjects');
export const findAllExams = (): Promise<Exam[]> => apiFetch('/academics/exams');
// Fix: Added missing getEvents method
export const getEvents = (): Promise<SchoolEvent[]> => apiFetch('/academics/events');
export const getGrades = (params: any): Promise<Grade[]> => {
    const query = new URLSearchParams(params);
    return apiFetch(`/academics/grades?${query.toString()}`);
};
export const getAttendance = (params: any = {}): Promise<any> => {
    const query = new URLSearchParams(params);
    return apiFetch(`/academics/attendance-records?${query.toString()}`);
};

// --- TRANSACTIONS & FEES ---
export const getTransactions = (params: { page?: number, limit?: number, search?: string, startDate?: string, endDate?: string, studentId?: string, type?: string } = {}): Promise<any> => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v && query.append(k, v.toString()));
    return apiFetch(`/transactions?${query.toString()}`);
};
export const createTransaction = (data: NewTransaction): Promise<Transaction> => apiFetch('/transactions', { method: 'POST', body: JSON.stringify(data) });
export const updateTransaction = (id: string, data: Partial<Transaction>): Promise<Transaction> => apiFetch(`/transactions/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteTransaction = (id: string): Promise<void> => apiFetch(`/transactions/${id}`, { method: 'DELETE' });
export const createMultipleTransactions = (data: NewTransaction[]): Promise<Transaction[]> => apiFetch('/transactions/batch', { method: 'POST', body: JSON.stringify(data) });

// --- CRUD ---
export const createStudent = (data: NewStudent): Promise<Student> => apiFetch('/students', { method: 'POST', body: JSON.stringify(data) });
export const updateStudent = (id: string, data: any): Promise<Student> => apiFetch(`/students/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteStudent = (id: string): Promise<void> => apiFetch(`/students/${id}`, { method: 'DELETE' });
export const uploadStudentPhoto = (formData: FormData): Promise<{url: string}> => apiFetch('/students/upload-photo', { method: 'POST', body: formData });
// Fix: Added missing updateMultipleStudents, exportStudents, and importStudents
export const updateMultipleStudents = (updates: any[]): Promise<any> => apiFetch('/students/batch-update', { method: 'POST', body: JSON.stringify(updates) });
export const exportStudents = (): Promise<Blob> => apiFetch('/students/export').then(res => new Blob([res], { type: 'text/csv' }));
export const importStudents = (formData: FormData): Promise<any> => apiFetch('/students/import', { method: 'POST', body: formData });

// Fix: Added missing exportExpenses
export const exportExpenses = (params: any): Promise<Blob> => {
    const query = new URLSearchParams(params);
    return apiFetch(`/expenses/export?${query.toString()}`).then(res => new Blob([res], { type: 'text/csv' }));
}
export const createExpense = (data: NewExpense): Promise<Expense> => apiFetch('/expenses', { method: 'POST', body: JSON.stringify(data) });
export const updateExpense = (id: string, data: Partial<Expense>): Promise<Expense> => apiFetch(`/expenses/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteExpense = (id: string): Promise<void> => apiFetch(`/expenses/${id}`, { method: 'DELETE' });
export const uploadExpenseReceipt = (formData: FormData): Promise<{url: string}> => apiFetch('/expenses/upload-receipt', { method: 'POST', body: formData });

export const createStaff = (data: NewStaff): Promise<Staff> => apiFetch('/staff', { method: 'POST', body: JSON.stringify(data) });
export const updateStaff = (id: string, data: any): Promise<Staff> => apiFetch(`/staff/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
// Fix: Added missing uploadStaffPhoto
export const uploadStaffPhoto = (formData: FormData): Promise<{url: string}> => apiFetch('/staff/upload-photo', { method: 'POST', body: formData });

export const savePayrollRun = (data: Payroll[]): Promise<Payroll[]> => apiFetch('/payroll/generate', { method: 'POST', body: JSON.stringify(data) });
export const createPayrollItem = (data: NewPayrollItem): Promise<any> => apiFetch('/payroll/payroll-items', { method: 'POST', body: JSON.stringify(data) });
export const updatePayrollItem = (id: string, data: any): Promise<any> => apiFetch(`/payroll/payroll-items/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deletePayrollItem = (id: string): Promise<void> => apiFetch(`/payroll/payroll-items/${id}`, { method: 'DELETE' });

export const createClass = (data: any): Promise<SchoolClass> => apiFetch('/academics/classes', { method: 'POST', body: JSON.stringify(data) });
export const updateClass = (id: string, data: any): Promise<SchoolClass> => apiFetch(`/academics/classes/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteClass = (id: string): Promise<void> => apiFetch(`/academics/classes/${id}`, { method: 'DELETE' });

export const createSubject = (data: any): Promise<Subject> => apiFetch('/academics/subjects', { method: 'POST', body: JSON.stringify(data) });
export const updateSubject = (id: string, data: any): Promise<Subject> => apiFetch(`/academics/subjects/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteSubject = (id: string): Promise<void> => apiFetch(`/academics/subjects/${id}`, { method: 'DELETE' });

export const createAssignment = (data: any): Promise<any> => apiFetch('/academics/class-subject-assignments', { method: 'POST', body: JSON.stringify(data) });
export const deleteAssignment = (id: string): Promise<void> => apiFetch(`/academics/class-subject-assignments/${id}`, { method: 'DELETE' });
// Fix: Added missing findAllAssignments
export const findAllAssignments = (): Promise<any[]> => apiFetch('/academics/class-subject-assignments');

export const updateSchoolInfo = (data: SchoolInfo): Promise<SchoolInfo> => apiFetch('/settings/school-info', { method: 'PUT', body: JSON.stringify(data) });
export const updateDarajaSettings = (data: DarajaSettings): Promise<DarajaSettings> => apiFetch('/settings/daraja', { method: 'PUT', body: JSON.stringify(data) });
export const uploadLogo = (formData: FormData): Promise<{logoUrl: string}> => apiFetch('/settings/upload-logo', { method: 'POST', body: formData });

export const createUser = (data: NewUser): Promise<User> => apiFetch('/users', { method: 'POST', body: JSON.stringify(data) });
export const updateUser = (id: string, data: any): Promise<User> => apiFetch(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteUser = (id: string): Promise<void> => apiFetch(`/users/${id}`, { method: 'DELETE' });
export const getUsers = (): Promise<User[]> => apiFetch('/users');
// Fix: Added missing updateUserProfile, uploadUserAvatar, and adminUploadUserPhoto
export const updateUserProfile = (data: Partial<User>): Promise<User> => apiFetch('/users/profile', { method: 'PATCH', body: JSON.stringify(data) });
export const uploadUserAvatar = (formData: FormData): Promise<{avatarUrl: string}> => apiFetch('/users/upload-avatar', { method: 'POST', body: formData });
export const adminUploadUserPhoto = (formData: FormData): Promise<{url: string}> => apiFetch('/users/upload-photo', { method: 'POST', body: formData });

export const getAuthenticatedUser = (): Promise<User> => apiFetch('/auth/me');
export const logout = (): Promise<void> => apiFetch('/auth/logout', { method: 'POST' });
export const login = (credentials: any): Promise<{user: User}> => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
export const registerSchool = (data: any): Promise<any> => apiFetch('/auth/register-school', { method: 'POST', body: JSON.stringify(data) });

export const createGradingRule = (data: NewGradingRule): Promise<GradingRule> => apiFetch('/academics/grading-scale', { method: 'POST', body: JSON.stringify(data) });
export const updateGradingRule = (id: string, data: any): Promise<GradingRule> => apiFetch(`/academics/grading-scale/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteGradingRule = (id: string): Promise<void> => apiFetch(`/academics/grading-scale/${id}`, { method: 'DELETE' });

export const createFeeItem = (data: NewFeeItem): Promise<FeeItem> => apiFetch('/academics/fee-structure', { method: 'POST', body: JSON.stringify(data) });
export const updateFeeItem = (id: string, data: any): Promise<FeeItem> => apiFetch(`/academics/fee-structure/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteFeeItem = (id: string): Promise<void> => apiFetch(`/academics/fee-structure/${id}`, { method: 'DELETE' });

export const createAnnouncement = (data: any): Promise<Announcement> => apiFetch('/communications/announcements', { method: 'POST', body: JSON.stringify(data) });
// Fix: Added missing updateAnnouncement and deleteAnnouncement
export const updateAnnouncement = (id: string, data: Partial<Announcement>): Promise<Announcement> => apiFetch(`/communications/announcements/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteAnnouncement = (id: string): Promise<void> => apiFetch(`/communications/announcements/${id}`, { method: 'DELETE' });
export const findAllAnnouncements = (): Promise<Announcement[]> => apiFetch('/communications/announcements');

// Fix: Added missing communication log methods
export const getCommunicationLogs = (params: any = {}): Promise<any> => {
    const query = new URLSearchParams(params);
    return apiFetch(`/communications/communication-logs?${query.toString()}`);
};
export const createCommunicationLog = (data: NewCommunicationLog): Promise<CommunicationLog> => apiFetch('/communications/communication-logs', { method: 'POST', body: JSON.stringify(data) });
export const createBulkCommunicationLogs = (data: NewCommunicationLog[]): Promise<CommunicationLog[]> => apiFetch('/communications/communication-logs/batch', { method: 'POST', body: JSON.stringify(data) });

export const updateClasses = (data: any[]): Promise<void> => apiFetch('/academics/classes/batch', { method: 'PUT', body: JSON.stringify(data) });
export const updateSubjects = (data: any[]): Promise<void> => apiFetch('/academics/subjects/batch', { method: 'PUT', body: JSON.stringify(data) });
export const updateAssignments = (data: any[]): Promise<void> => apiFetch('/academics/class-subject-assignments/batch', { method: 'PUT', body: JSON.stringify(data) });
export const updateTimetable = (data: any[]): Promise<void> => apiFetch('/academics/timetable-entries/batch', { method: 'PUT', body: JSON.stringify(data) });
export const updateExams = (data: any[]): Promise<void> => apiFetch('/academics/exams/batch', { method: 'PUT', body: JSON.stringify(data) });
export const updateGrades = (data: any[]): Promise<void> => apiFetch('/academics/grades/batch', { method: 'PUT', body: JSON.stringify(data) });
export const updateAttendance = (data: any[]): Promise<void> => apiFetch('/academics/attendance-records/batch', { method: 'PUT', body: JSON.stringify(data) });
export const updateEvents = (data: any[]): Promise<void> => apiFetch('/academics/events/batch', { method: 'PUT', body: JSON.stringify(data) });
// Fix: Added missing findAllTimetableEntries
export const findAllTimetableEntries = (): Promise<TimetableEntry[]> => apiFetch('/academics/timetable-entries');

// Library Methods
export const getBooks = (params: any = {}): Promise<any> => {
    const query = new URLSearchParams(params);
    return apiFetch(`/library/books?${query.toString()}`);
};
export const addBook = (data: NewBook): Promise<Book> => apiFetch('/library/books', { method: 'POST', body: JSON.stringify(data) });
export const updateBook = (id: string, data: any): Promise<Book> => apiFetch(`/library/books/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteBook = (id: string): Promise<void> => apiFetch(`/library/books/${id}`, { method: 'DELETE' });
export const issueBook = (data: any): Promise<LibraryTransaction> => apiFetch('/library/issue', { method: 'POST', body: JSON.stringify(data) });
export const returnBook = (id: string): Promise<LibraryTransaction> => apiFetch(`/library/return/${id}`, { method: 'POST' });
export const markBookLost = (id: string): Promise<LibraryTransaction> => apiFetch(`/library/lost/${id}`, { method: 'POST' });
export const getLibraryTransactions = (params: any = {}): Promise<any> => {
    const query = new URLSearchParams(params);
    return apiFetch(`/library/transactions?${query.toString()}`);
};

// Super Admin
export const getAllSchools = (): Promise<any[]> => apiFetch('/super-admin/schools');
export const getPlatformStats = (): Promise<any> => apiFetch('/super-admin/stats');
export const getSystemHealth = (): Promise<any> => apiFetch('/super-admin/health');
export const getSubscriptionPayments = (): Promise<any[]> => apiFetch('/super-admin/payments');
export const updateSchoolSubscription = (schoolId: string, data: any): Promise<any> => apiFetch(`/super-admin/schools/${schoolId}/subscription`, { method: 'PATCH', body: JSON.stringify(data) });
export const updatePlatformPricing = (data: any): Promise<any> => apiFetch('/super-admin/pricing', { method: 'PUT', body: JSON.stringify(data) });
