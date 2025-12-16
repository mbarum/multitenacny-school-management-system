
import type { 
    User, Student, Transaction, Expense, Staff, Payroll, Subject, SchoolClass, 
    ClassSubjectAssignment, TimetableEntry, Exam, Grade, AttendanceRecord, 
    SchoolEvent, SchoolInfo, GradingRule, FeeItem, CommunicationLog, Announcement,
    PayrollItem, DarajaSettings, NewStudent, NewStaff, NewTransaction, NewExpense,
    NewPayrollItem, NewAnnouncement, NewCommunicationLog, NewUser, NewFeeItem, 
    NewGradingRule, PlatformPricing, SubscriptionPlan, SubscriptionStatus,
    Book
} from '../types';

const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('authToken');
    const headers = new Headers(options.headers);
    if (!(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }
    if (token) headers.set('Authorization', `Bearer ${token}`);

    const response = await fetch(`/api${endpoint}`, { ...options, headers });
    
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
export const getClasses = () => apiFetch('/academics/classes');

export const getStudents = (params: { page?: number, limit?: number, search?: string, classId?: string, status?: string, pagination?: string, mode?: string } = {}) => {
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
export const getDarajaSettings = (schoolId?: string) => apiFetch('/settings/daraja');
export const getStaff = () => apiFetch('/staff');
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

// --- CRUD & Actions ---
const create = <T>(resource: string) => (data: any): Promise<T> => apiFetch(`/${resource}`, { method: 'POST', body: JSON.stringify(data) });
const update = <T>(resource: string) => (id: string, data: any): Promise<T> => apiFetch(`/${resource}/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
const remove = (resource: string) => (id: string): Promise<void> => apiFetch(`/${resource}/${id}`, { method: 'DELETE' });

// Students
export const createStudent = create<Student>('students');
export const updateStudent = (id: string, data: any) => apiFetch(`/students/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteStudent = remove('students');
export const updateMultipleStudents = (updates: any[]) => apiFetch('/students/batch-update', { method: 'POST', body: JSON.stringify(updates) });
export const uploadStudentPhoto = (formData: FormData) => apiFetch('/students/upload-photo', { method: 'POST', body: formData });
export const exportStudents = () => apiFetch('/students/export');
export const importStudents = (formData: FormData) => apiFetch('/students/import', { method: 'POST', body: formData });

// Transactions
export const getTransactions = (params: { page?: number, limit?: number, search?: string, startDate?: string, endDate?: string, type?: string, studentId?: string } = {}) => {
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
export const createMultipleTransactions = (data: NewTransaction[]) => apiFetch('/transactions/batch', { method: 'POST', body: JSON.stringify(data) });
export const updateTransaction = (id: string, data: Partial<Transaction>) => apiFetch(`/transactions/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteTransaction = remove('transactions');

// Expenses
export const getExpenses = (params: { page?: number, limit?: number, startDate?: string, endDate?: string, category?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.category) query.append('category', params.category);
    return apiFetch(`/expenses?${query.toString()}`);
};
export const createExpense = create<Expense>('expenses');
export const updateExpense = (id: string, data: Partial<Expense>) => apiFetch(`/expenses/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteExpense = remove('expenses');
export const uploadExpenseReceipt = (formData: FormData) => apiFetch('/expenses/upload-receipt', { method: 'POST', body: formData });
export const exportExpenses = (params: any) => {
    const query = new URLSearchParams(params);
    return apiFetch(`/expenses/export?${query.toString()}`);
}

// Staff & Payroll
export const createStaff = create<Staff>('staff');
export const updateStaff = update<Staff>('staff');
export const savePayrollRun = (data: Payroll[]) => apiFetch('/payroll/generate', { method: 'POST', body: JSON.stringify(data) });
export const createPayrollItem = create<PayrollItem>('payroll/payroll-items');
export const updatePayrollItem = (id: string, data: Partial<PayrollItem>) => apiFetch(`/payroll/payroll-items/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deletePayrollItem = (id: string) => apiFetch(`/payroll/payroll-items/${id}`, { method: 'DELETE' });
export const uploadStaffPhoto = (formData: FormData) => apiFetch('/staff/upload-photo', { method: 'POST', body: formData });

// Academics
export const createClass = create<SchoolClass>('academics/classes');
export const updateClass = (id: string, data: any) => apiFetch(`/academics/classes/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteClass = (id: string) => apiFetch(`/academics/classes/${id}`, { method: 'DELETE' });
export const updateClasses = (data: SchoolClass[]) => apiFetch('/academics/classes/batch', { method: 'PUT', body: JSON.stringify(data) });

export const createSubject = create<Subject>('academics/subjects');
export const updateSubject = (id: string, data: any) => apiFetch(`/academics/subjects/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteSubject = (id: string) => apiFetch(`/academics/subjects/${id}`, { method: 'DELETE' });
export const updateSubjects = (data: Subject[]) => apiFetch('/academics/subjects/batch', { method: 'PUT', body: JSON.stringify(data) });

export const createAssignment = create<ClassSubjectAssignment>('academics/class-subject-assignments');
export const updateAssignment = (id: string, data: any) => apiFetch(`/academics/class-subject-assignments/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteAssignment = (id: string) => apiFetch(`/academics/class-subject-assignments/${id}`, { method: 'DELETE' });
export const updateAssignments = (data: ClassSubjectAssignment[]) => apiFetch('/academics/class-subject-assignments/batch', { method: 'PUT', body: JSON.stringify(data) });

export const updateTimetable = (data: TimetableEntry[]) => apiFetch('/academics/timetable-entries/batch', { method: 'PUT', body: JSON.stringify(data) });
export const updateExams = (data: Exam[]) => apiFetch('/academics/exams/batch', { method: 'PUT', body: JSON.stringify(data) });
export const updateGrades = (data: Grade[]) => apiFetch('/academics/grades/batch', { method: 'PUT', body: JSON.stringify(data) });
export const updateAttendance = (data: AttendanceRecord[]) => apiFetch('/academics/attendance-records/batch', { method: 'PUT', body: JSON.stringify(data) });
export const updateEvents = (data: SchoolEvent[]) => apiFetch('/academics/events/batch', { method: 'PUT', body: JSON.stringify(data) });

export const getSubjects = () => apiFetch('/academics/subjects');
export const getEvents = () => apiFetch('/academics/events');
export const findAllExams = () => apiFetch('/academics/exams');
export const findAllAssignments = () => apiFetch('/academics/class-subject-assignments');
export const findAllTimetableEntries = () => apiFetch('/academics/timetable-entries');
export const findAllAnnouncements = () => apiFetch('/communications/announcements');

export const getAttendance = (params: { page?: number, limit?: number, pagination?: string, classId?: string, studentId?: string, startDate?: string, endDate?: string, date?: string } = {}) => {
     const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.pagination) query.append('pagination', params.pagination);
    if (params.classId) query.append('classId', params.classId);
    if (params.studentId) query.append('studentId', params.studentId);
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.date) query.append('date', params.date);
    return apiFetch(`/academics/attendance-records?${query.toString()}`);
}

export const getGrades = (params: { examId?: string, subjectId?: string, studentId?: string, classId?: string }) => {
     const query = new URLSearchParams();
     if(params.examId) query.append('examId', params.examId);
     if(params.subjectId) query.append('subjectId', params.subjectId);
     if(params.studentId) query.append('studentId', params.studentId);
     if(params.classId) query.append('classId', params.classId);
     return apiFetch(`/academics/grades?${query.toString()}`);
}

// Settings
export const updateSchoolInfo = (data: SchoolInfo) => apiFetch('/settings/school-info', { method: 'PUT', body: JSON.stringify(data) });
export const updateDarajaSettings = (data: DarajaSettings) => apiFetch('/settings/daraja', { method: 'PUT', body: JSON.stringify(data) });
export const uploadLogo = (formData: FormData) => apiFetch('/settings/upload-logo', { method: 'POST', body: formData });
export const createUser = create<User>('users');
export const updateUser = update<User>('users');
export const deleteUser = remove('users');
export const getUsers = () => apiFetch('/users');
export const updateUserProfile = (data: Partial<User>) => apiFetch('/users/profile', { method: 'PATCH', body: JSON.stringify(data) });
export const uploadUserAvatar = (formData: FormData) => apiFetch('/users/upload-avatar', { method: 'POST', body: formData });
export const adminUploadUserPhoto = (formData: FormData) => apiFetch('/users/upload-photo', { method: 'POST', body: formData });
export const createGradingRule = create<GradingRule>('academics/grading-scale');
export const updateGradingRule = (id: string, data: any) => apiFetch(`/academics/grading-scale/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteGradingRule = (id: string) => apiFetch(`/academics/grading-scale/${id}`, { method: 'DELETE' });
export const createFeeItem = create<FeeItem>('academics/fee-structure');
export const updateFeeItem = (id: string, data: any) => apiFetch(`/academics/fee-structure/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteFeeItem = (id: string) => apiFetch(`/academics/fee-structure/${id}`, { method: 'DELETE' });

// Communications
export const createAnnouncement = create<Announcement>('communications/announcements');
export const updateAnnouncement = (id: string, data: Partial<Announcement>) => apiFetch(`/communications/announcements/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteAnnouncement = (id: string) => apiFetch(`/communications/announcements/${id}`, { method: 'DELETE' });
export const createCommunicationLog = create<CommunicationLog>('communications/communication-logs');
export const createBulkCommunicationLogs = (data: NewCommunicationLog[]) => apiFetch('/communications/communication-logs/batch', { method: 'POST', body: JSON.stringify(data) });

// Library
export const addBook = create<Book>('library/books');
export const updateBook = (id: string, data: Partial<Book>) => apiFetch(`/library/books/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteBook = (id: string) => apiFetch(`/library/books/${id}`, { method: 'DELETE' });
export const issueBook = (data: { studentId: string, bookId: string, dueDate: string }) => apiFetch('/library/issue', { method: 'POST', body: JSON.stringify(data) });
export const returnBook = (transactionId: string) => apiFetch(`/library/return/${transactionId}`, { method: 'POST' });
export const markBookLost = (transactionId: string) => apiFetch(`/library/lost/${transactionId}`, { method: 'POST' });

// Super Admin
export const getAllSchools = () => apiFetch('/super-admin/schools');
export const getPlatformStats = () => apiFetch('/super-admin/stats');
export const getSystemHealth = () => apiFetch('/super-admin/health');
export const getSubscriptionPayments = () => apiFetch('/super-admin/payments');
export const updateSchoolSubscription = (schoolId: string, data: { plan: SubscriptionPlan, status: SubscriptionStatus, endDate?: string }) => apiFetch(`/super-admin/schools/${schoolId}/subscription`, { method: 'PATCH', body: JSON.stringify(data) });
export const updatePlatformPricing = (data: Partial<PlatformPricing>) => apiFetch('/super-admin/pricing', { method: 'PUT', body: JSON.stringify(data) });

// Auth
export const login = (creds: any) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(creds) });
export const registerSchool = (data: any) => apiFetch('/auth/register-school', { method: 'POST', body: JSON.stringify(data) });

// Deprecated: fetchInitialData is removed for scalability. Components should use useQuery.
export const fetchInitialData = () => {
    return Promise.resolve([]);
};
