
import type { 
    User, Student, Transaction, Expense, Staff, Payroll, Subject, SchoolClass, 
    ClassSubjectAssignment, TimetableEntry, Exam, Grade, AttendanceRecord, 
    SchoolEvent, SchoolInfo, GradingRule, FeeItem, CommunicationLog, Announcement,
    PayrollItem, NewTransaction, NewExpense, NewPayrollItem, NewAnnouncement, 
    NewCommunicationLog, PlatformPricing, SubscriptionPlan, SubscriptionStatus,
    Book, DarajaSettings
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
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/csv')) {
        return response.blob();
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `API Error: ${response.status}`);
    }
    if (response.status === 204) return null;
    return response.json();
};

// --- GETTERS ---
// Robust getStudents implementation to handle both paginated and flat data.
// FIX: Explicitly typing return to aid useQuery inference.
export const getStudents = (params: { page?: number, limit?: number, search?: string, classId?: string, status?: string, pagination?: string, mode?: string } = {}): Promise<{data: Student[], last_page: number, total: number} | Student[]> => {
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

export const getDashboardStats = () => apiFetch('/dashboard/stats');
export const getSchoolInfo = () => apiFetch('/settings/school-info');
export const getPublicSchoolInfo = () => apiFetch('/settings/public/school-info');
export const getExchangeRates = () => apiFetch('/settings/public/rates');
export const getPlatformPricing = () => apiFetch('/settings/public/pricing');
export const getFeeStructure = () => apiFetch('/academics/fee-structure');
export const getGradingScale = () => apiFetch('/academics/grading-scale');
export const getDarajaSettings = () => apiFetch('/settings/daraja');
export const getStaff = (): Promise<Staff[]> => apiFetch('/staff');
export const getPayrollItems = () => apiFetch('/payroll/payroll-items');
export const getPayrollHistory = (params: { page?: number, limit?: number, staffId?: string, month?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.staffId) query.append('staffId', params.staffId);
    if (params.month) query.append('month', params.month);
    return apiFetch(`/payroll/payroll-history?${query.toString()}`);
};
export const getCommunicationLogs = (params: { page?: number, limit?: number, studentId?: string, type?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.studentId) query.append('studentId', params.studentId);
    if (params.type) query.append('type', params.type);
    return apiFetch(`/communications/communication-logs?${query.toString()}`);
};
export const getBooks = (params: { page?: number, limit?: number, search?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.search) query.append('search', params.search);
    return apiFetch(`/library/books?${query.toString()}`);
};
export const getLibraryTransactions = (params: { page?: number, limit?: number, status?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.status) query.append('status', params.status);
    return apiFetch(`/library/transactions?${query.toString()}`);
};

export const getClasses = (): Promise<any> => apiFetch('/academics/classes');
export const getSubjects = (): Promise<any> => apiFetch('/academics/subjects');
export const getEvents = (): Promise<SchoolEvent[]> => apiFetch('/academics/events');
export const findAllExams = (): Promise<Exam[]> => apiFetch('/academics/exams');
export const findAllAssignments = (): Promise<any> => apiFetch('/academics/class-subject-assignments');
export const findAllTimetableEntries = (): Promise<TimetableEntry[]> => apiFetch('/academics/timetable-entries');
export const findAllAnnouncements = (): Promise<Announcement[]> => apiFetch('/communications/announcements');

export const getAttendance = (params: { page?: number, limit?: number, pagination?: string, classId?: string, studentId?: string, startDate?: string, endDate?: string, date?: string, status?: string } = {}): Promise<any> => {
     const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.pagination) query.append('pagination', params.pagination);
    if (params.classId) query.append('classId', params.classId);
    if (params.studentId) query.append('studentId', params.studentId);
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.date) query.append('date', params.date);
    if (params.status) query.append('status', params.status);
    return apiFetch(`/academics/attendance-records?${query.toString()}`);
}

export const getGrades = (params: { examId?: string, subjectId?: string, studentId?: string, classId?: string }): Promise<Grade[]> => {
     const query = new URLSearchParams();
     if(params.examId) query.append('examId', params.examId);
     if(params.subjectId) query.append('subjectId', params.subjectId);
     if(params.studentId) query.append('studentId', params.studentId);
     if(params.classId) query.append('classId', params.classId);
     return apiFetch(`/academics/grades?${query.toString()}`);
}

// --- CRUD & Actions ---
const create = <T>(resource: string) => (data: any): Promise<T> => apiFetch(`/${resource}`, { method: 'POST', body: JSON.stringify(data) });
const update = <T>(resource: string) => (id: string, data: any): Promise<T> => apiFetch(`/${resource}/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
const remove = (resource: string) => (id: string): Promise<void> => apiFetch(`/${resource}/${id}`, { method: 'DELETE' });

// Students
export const createStudent = create<Student>('students');
export const updateStudent = (id: string, data: any): Promise<Student> => apiFetch(`/students/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteStudent = remove('students');
export const updateMultipleStudents = (updates: any[]): Promise<Student[]> => apiFetch('/students/batch-update', { method: 'POST', body: JSON.stringify(updates) });
export const uploadStudentPhoto = (formData: FormData): Promise<{url: string}> => apiFetch('/students/upload-photo', { method: 'POST', body: formData });
export const exportStudents = (): Promise<Blob> => apiFetch('/students/export');
export const importStudents = (formData: FormData): Promise<{imported: number, failed: number, errors: any[]}> => apiFetch('/students/import', { method: 'POST', body: formData });

// Transactions
export const getTransactions = (params: { page?: number, limit?: number, search?: string, startDate?: string, endDate?: string, type?: string, studentId?: string } = {}): Promise<any> => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.search) query.append('search', params.search);
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.type) query.append('type', params.type);
    if (params.studentId) query.append('studentId', params.studentId);
    return apiFetch(`/transactions?${query.toString()}`);
};
export const createTransaction = create<Transaction>('transactions');
export const createMultipleTransactions = (data: NewTransaction[]): Promise<Transaction[]> => apiFetch('/transactions/batch', { method: 'POST', body: JSON.stringify(data) });
export const updateTransaction = (id: string, data: Partial<Transaction>): Promise<Transaction> => apiFetch(`/transactions/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteTransaction = remove('transactions');

// Expenses
export const getExpenses = (params: { page?: number, limit?: number, startDate?: string, endDate?: string, category?: string } = {}): Promise<any> => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.category) query.append('category', params.category);
    return apiFetch(`/expenses?${query.toString()}`);
};
export const createExpense = create<Expense>('expenses');
export const updateExpense = (id: string, data: Partial<Expense>): Promise<Expense> => apiFetch(`/expenses/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteExpense = remove('expenses');
export const uploadExpenseReceipt = (formData: FormData): Promise<{url: string}> => apiFetch('/expenses/upload-receipt', { method: 'POST', body: formData });
export const exportExpenses = (params: any): Promise<Blob> => {
    const query = new URLSearchParams(params);
    return apiFetch(`/expenses/export?${query.toString()}`);
}

// Staff & Payroll
export const createStaff = create<Staff>('staff');
export const updateStaff = update<Staff>('staff');
export const savePayrollRun = (data: Payroll[]): Promise<Payroll[]> => apiFetch('/payroll/generate', { method: 'POST', body: JSON.stringify(data) });
export const createPayrollItem = create<PayrollItem>('payroll/payroll-items');
export const updatePayrollItem = (id: string, data: Partial<PayrollItem>): Promise<PayrollItem> => apiFetch(`/payroll/payroll-items/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deletePayrollItem = (id: string) => apiFetch(`/payroll/payroll-items/${id}`, { method: 'DELETE' });
export const uploadStaffPhoto = (formData: FormData): Promise<{url: string}> => apiFetch('/staff/upload-photo', { method: 'POST', body: formData });

// Academics
export const createClass = create<SchoolClass>('academics/classes');
export const updateClass = (id: string, data: any): Promise<SchoolClass> => apiFetch(`/academics/classes/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteClass = (id: string) => apiFetch(`/academics/classes/${id}`, { method: 'DELETE' });
export const updateClasses = (data: SchoolClass[]): Promise<void> => apiFetch('/academics/classes/batch', { method: 'PUT', body: JSON.stringify(data) });

export const createSubject = create<Subject>('academics/subjects');
export const updateSubject = (id: string, data: any): Promise<Subject> => apiFetch(`/academics/subjects/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteSubject = (id: string) => apiFetch(`/academics/subjects/${id}`, { method: 'DELETE' });
export const updateSubjects = (data: Subject[]): Promise<void> => apiFetch('/academics/subjects/batch', { method: 'PUT', body: JSON.stringify(data) });

export const createAssignment = create<ClassSubjectAssignment>('academics/class-subject-assignments');
export const updateAssignment = (id: string, data: any): Promise<ClassSubjectAssignment> => apiFetch(`/academics/class-subject-assignments/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteAssignment = (id: string) => apiFetch(`/academics/class-subject-assignments/${id}`, { method: 'DELETE' });
export const updateAssignments = (data: ClassSubjectAssignment[]): Promise<void> => apiFetch('/academics/class-subject-assignments/batch', { method: 'PUT', body: JSON.stringify(data) });

export const updateTimetable = (data: TimetableEntry[]): Promise<void> => apiFetch('/academics/timetable-entries/batch', { method: 'PUT', body: JSON.stringify(data) });
export const updateExams = (data: Exam[]): Promise<void> => apiFetch('/academics/exams/batch', { method: 'PUT', body: JSON.stringify(data) });
export const updateGrades = (data: Grade[]): Promise<void> => apiFetch('/academics/grades/batch', { method: 'PUT', body: JSON.stringify(data) });
export const updateAttendance = (data: AttendanceRecord[]): Promise<void> => apiFetch('/academics/attendance-records/batch', { method: 'PUT', body: JSON.stringify(data) });
export const updateEvents = (data: SchoolEvent[]): Promise<void> => apiFetch('/academics/events/batch', { method: 'PUT', body: JSON.stringify(data) });

// Settings
export const updateSchoolInfo = (data: SchoolInfo): Promise<SchoolInfo> => apiFetch('/settings/school-info', { method: 'PUT', body: JSON.stringify(data) });
export const updateDarajaSettings = (data: DarajaSettings): Promise<DarajaSettings> => apiFetch('/settings/daraja', { method: 'PUT', body: JSON.stringify(data) });
export const uploadLogo = (formData: FormData): Promise<{logoUrl: string}> => apiFetch('/settings/upload-logo', { method: 'POST', body: formData });
export const createUser = create<User>('users');
export const updateUser = update<User>('users');
export const deleteUser = remove('users');
export const getUsers = (): Promise<User[]> => apiFetch('/users');
export const updateUserProfile = (data: Partial<User>): Promise<User> => apiFetch('/users/profile', { method: 'PATCH', body: JSON.stringify(data) });
export const uploadUserAvatar = (formData: FormData): Promise<{avatarUrl: string}> => apiFetch('/users/upload-avatar', { method: 'POST', body: formData });
export const adminUploadUserPhoto = (formData: FormData): Promise<{url: string}> => apiFetch('/users/upload-photo', { method: 'POST', body: formData });
export const createGradingRule = create<GradingRule>('academics/grading-scale');
export const updateGradingRule = (id: string, data: any): Promise<GradingRule> => apiFetch(`/academics/grading-scale/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteGradingRule = (id: string) => apiFetch(`/academics/grading-scale/${id}`, { method: 'DELETE' });
export const createFeeItem = create<FeeItem>('academics/fee-structure');
export const updateFeeItem = (id: string, data: any): Promise<FeeItem> => apiFetch(`/academics/fee-structure/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteFeeItem = (id: string) => apiFetch(`/academics/fee-structure/${id}`, { method: 'DELETE' });

// Communications
export const createAnnouncement = create<Announcement>('communications/announcements');
export const updateAnnouncement = (id: string, data: Partial<Announcement>): Promise<Announcement> => apiFetch(`/communications/announcements/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteAnnouncement = (id: string) => apiFetch(`/communications/announcements/${id}`, { method: 'DELETE' });
export const createCommunicationLog = create<CommunicationLog>('communications/communication-logs');
export const createBulkCommunicationLogs = (data: NewCommunicationLog[]): Promise<CommunicationLog[]> => apiFetch('/communications/communication-logs/batch', { method: 'POST', body: JSON.stringify(data) });

// Library
export const addBook = create<Book>('library/books');
export const updateBook = (id: string, data: Partial<Book>): Promise<Book> => apiFetch(`/library/books/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteBook = (id: string) => apiFetch(`/library/books/${id}`, { method: 'DELETE' });
export const issueBook = (data: { studentId: string, bookId: string, dueDate: string }): Promise<any> => apiFetch('/library/issue', { method: 'POST', body: JSON.stringify(data) });
export const returnBook = (transactionId: string): Promise<any> => apiFetch(`/library/return/${transactionId}`, { method: 'POST' });
export const markBookLost = (transactionId: string): Promise<any> => apiFetch(`/library/lost/${transactionId}`, { method: 'POST' });

// Super Admin
export const getAllSchools = (): Promise<any[]> => apiFetch('/super-admin/schools');
export const getPlatformStats = (): Promise<any> => apiFetch('/super-admin/stats');
export const getSystemHealth = (): Promise<any> => apiFetch('/super-admin/health');
export const getSubscriptionPayments = (): Promise<any[]> => apiFetch('/super-admin/payments');
export const updateSchoolSubscription = (schoolId: string, data: { plan: SubscriptionPlan, status: SubscriptionStatus, endDate?: string }): Promise<any> => apiFetch(`/super-admin/schools/${schoolId}/subscription`, { method: 'PATCH', body: JSON.stringify(data) });
export const updatePlatformPricing = (data: Partial<PlatformPricing>): Promise<PlatformPricing> => apiFetch('/super-admin/pricing', { method: 'PUT', body: JSON.stringify(data) });

// Auth
// FIX: Added missing login method.
export const login = (credentials: {email: string, password: string}): Promise<{user: User, token: string}> => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
export const logout = (): Promise<void> => apiFetch('/auth/logout', { method: 'POST' });
export const registerSchool = (data: any): Promise<any> => apiFetch('/auth/register-school', { method: 'POST', body: JSON.stringify(data) });
export const getAuthenticatedUser = (): Promise<User> => apiFetch('/users/me');
