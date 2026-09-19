
import { 
    Role, StudentStatus, TransactionType, CommunicationType, SubscriptionPlan, SubscriptionStatus,
    type User, type Student, type Transaction, type Expense, type Staff, type Payroll, type Subject, type SchoolClass, 
    type ClassSubjectAssignment, type TimetableEntry, type Exam, type Grade, type AttendanceRecord, type SchoolEvent, 
    type SchoolInfo, type GradingRule, type FeeItem, type CommunicationLog, type Announcement, type ReportShareLog, 
    type PayrollItem, type DarajaSettings, type MpesaC2BTransaction, type NewStudent, type NewStaff, 
    type NewTransaction, type NewExpense, type NewPayrollItem, type NewAnnouncement, type NewCommunicationLog, 
    type NewUser, type NewGradingRule, type NewFeeItem, type PlatformPricing, type Book, type NewBook,
    type SubscriberSchool, type SaasInvoice, type SaasReceipt, type LifecycleSweepResult,
    type LmsAssignment, type LmsSubmission, type LmsLiveClass, type EdTechArticle,
    type SystemHealthData, type OnlineUserSession
} from '../types';

// Utility to remove empty/undefined parameters from query strings
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

// Client-side fallback handler when network or backend is unreachable


const getApiBaseUrl = (): string => {
    const configured = ((import.meta as any).env?.VITE_API_URL || '').replace(/\/+$/, '');
    if (!configured) return '';
    // If the browser is accessing from outside or if localhost:3001 is specified,
    // never attempt to reach container-internal localhost:3001 directly from the user's browser.
    // Instead, use relative path '' so requests go through the public host / port 3000 proxy.
    if (typeof window !== 'undefined' && window.location) {
        if (configured.includes('localhost') || configured.includes('127.0.0.1')) {
            return '';
        }
    }
    return configured;
};

const API_BASE_URL = getApiBaseUrl();
// Strict mode: MySQL database is the only source of truth.
// Mock fallback is strictly disabled unless explicitly enabled for isolated tests.


/**
 * Tab-Scoped Session Management
 * Ensures closing the tab signs the user out immediately.
 * sessionStorage is uniquely bounded to the browser tab lifecycle and automatically discarded on tab close.
 */
export const getAuthToken = (): string | null => {
    try {
        const token = sessionStorage.getItem('authToken');
        if (token && token !== 'null' && token !== 'undefined') {
            return token;
        }
        return null;
    } catch {
        return null;
    }
};

export const setAuthToken = (token: string): void => {
    try {
        if (token) {
            sessionStorage.setItem('authToken', token);
        } else {
            sessionStorage.removeItem('authToken');
        }
        // Purge persistent localStorage tokens to enforce tab-closure logout
        localStorage.removeItem('authToken');
    } catch {
        // ignore
    }
};

export const clearAuthToken = (): void => {
    try {
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('saaslink_last_activity');
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('saaslink_last_activity');
    } catch {
        // ignore
    }
};

/**
 * Robust API Error Message Parser
 * Formats any nested error object into a clean human-readable string, preventing [object Object] errors.
 */
const parseApiErrorMessage = (errorData: any, statusText: string, status: number, endpoint: string): string => {
    if (!errorData) return statusText || `API error (${status}) on ${endpoint}`;
    if (typeof errorData === 'string') return errorData;
    if (typeof errorData.message === 'string') return errorData.message;
    if (Array.isArray(errorData.message)) {
        return errorData.message.map((m: any) => typeof m === 'string' ? m : (m?.message || JSON.stringify(m))).join(', ');
    }
    if (typeof errorData.error === 'string') return errorData.error;
    if (errorData.error && typeof errorData.error.message === 'string') return errorData.error.message;
    if (typeof errorData.message === 'object' && errorData.message !== null) {
        if (typeof errorData.message.message === 'string') return errorData.message.message;
        try { return JSON.stringify(errorData.message); } catch { /* ignore */ }
    }
    if (typeof errorData.error === 'object' && errorData.error !== null) {
        try { return JSON.stringify(errorData.error); } catch { /* ignore */ }
    }
    if (Array.isArray(errorData.errors)) {
        return errorData.errors.map((e: any) => typeof e === 'string' ? e : (e?.message || JSON.stringify(e))).join(', ');
    }
    return statusText || `API error (${status}) on ${endpoint}`;
};

// Generic API fetch wrapper for JSON responses with automatic resilient fallback
const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const token = getAuthToken();
    const headers = new Headers(options.headers);
    if (!(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }
    const url = API_BASE_URL ? `${API_BASE_URL}/api${endpoint}` : `/api${endpoint}`;
    try {
        const response = await fetch(url, { ...options, headers });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            const errorMessage = parseApiErrorMessage(errorData, response.statusText, response.status, endpoint);
            // Auth endpoints and all errors in strict mode must throw the real error to the caller
            if (response.status >= 400) {
                throw new Error(errorMessage);
            }
        }
        if (response.status === 204) return null;
        return await response.json();
    } catch (err: any) {
        if (err instanceof TypeError && err.message.includes('fetch')) {
                throw new Error(`Unable to connect to the backend server (${url}). Please ensure the backend and MySQL database are running.`);
            }
            throw err;
    }
};

// Specialized fetch for binary data (e.g. CSV exports)
const apiFetchBlob = async (endpoint: string, options: RequestInit = {}) => {
    const token = getAuthToken();
    const headers = new Headers(options.headers);
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }
    const url = API_BASE_URL ? `${API_BASE_URL}/api${endpoint}` : `/api${endpoint}`;
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
        throw new Error(`Export failed (${response.status})`);
    }
    return await response.blob();
};

// --- Auth ---
export const login = (credentials: {email: string, password: string}): Promise<{user: User, token: string}> => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
export const logout = async (): Promise<void> => {
    try {
        await apiFetch('/auth/logout', { method: 'POST' });
    } finally {
        clearAuthToken();
    }
};
export const getAuthenticatedUser = async (): Promise<User | null> => {
    const token = getAuthToken();
    if (!token) {
        return null;
    }
    try {
        return await apiFetch('/auth/me');
    } catch (err) {
        clearAuthToken();
        return null;
    }
};
export const registerSchool = (data: any): Promise<any> => apiFetch('/auth/register-school', { method: 'POST', body: JSON.stringify(data) });
export const createPaymentIntent = (data: { plan: string, billingCycle: string, email: string }): Promise<{ clientSecret: string, amount: number }> => apiFetch('/auth/create-payment-intent', { method: 'POST', body: JSON.stringify(data) });

// --- Dashboard ---
export const getDashboardStats = () => apiFetch('/dashboard/stats');

// --- Students ---
export const getStudents = (params: any = {}): Promise<any> => apiFetch(`/students?${new URLSearchParams(cleanParams(params)).toString()}`);
export const createStudent = (data: NewStudent): Promise<Student> => apiFetch('/students', { method: 'POST', body: JSON.stringify(data) });
export const updateStudent = (id: string, data: Partial<Student>): Promise<Student> => apiFetch(`/students/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteStudent = (id: string): Promise<void> => apiFetch(`/students/${id}`, { method: 'DELETE' });
export const updateMultipleStudents = (updates: any[]): Promise<Student[]> => apiFetch('/students/batch-update', { method: 'POST', body: JSON.stringify(updates) });
export const uploadStudentPhoto = (body: FormData | { dataUrl: string }): Promise<{url: string}> => {
    if (body instanceof FormData) {
        return apiFetch('/students/upload-photo', { method: 'POST', body });
    }
    return apiFetch('/students/upload-photo', { method: 'POST', body: JSON.stringify(body) });
};

// --- Users ---
export const getUsers = (): Promise<User[]> => apiFetch('/users');
export const createUser = (data: NewUser): Promise<User> => apiFetch('/users', { method: 'POST', body: JSON.stringify(data) });
export const updateUser = (id: string, data: Partial<User>): Promise<User> => apiFetch(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteUser = (id: string): Promise<void> => apiFetch(`/users/${id}`, { method: 'DELETE' });
export const updateUserProfile = (data: Partial<User>): Promise<User> => apiFetch('/users/profile', { method: 'PATCH', body: JSON.stringify(data) });
export const uploadUserAvatar = (body: FormData | { dataUrl: string }): Promise<{avatarUrl: string}> => {
    if (body instanceof FormData) {
        return apiFetch('/users/upload-avatar', { method: 'POST', body });
    }
    return apiFetch('/users/upload-avatar', { method: 'POST', body: JSON.stringify(body) });
};
export const adminUploadUserPhoto = (body: FormData | { dataUrl: string }): Promise<{url: string}> => {
    if (body instanceof FormData) {
        return apiFetch('/users/upload-photo', { method: 'POST', body });
    }
    return apiFetch('/users/upload-photo', { method: 'POST', body: JSON.stringify(body) });
};

// --- Transactions ---
export const getTransactions = (params: any = {}): Promise<any> => apiFetch(`/transactions?${new URLSearchParams(cleanParams(params)).toString()}`);
export const createTransaction = (data: NewTransaction): Promise<Transaction> => apiFetch('/transactions', { method: 'POST', body: JSON.stringify(data) });
export const updateTransaction = (id: string, data: any): Promise<Transaction> => apiFetch(`/transactions/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteTransaction = (id: string): Promise<void> => apiFetch(`/transactions/${id}`, { method: 'DELETE' });
export const createMultipleTransactions = (data: NewTransaction[]): Promise<Transaction[]> => apiFetch('/transactions/batch', { method: 'POST', body: JSON.stringify(data) });

// --- Expenses ---
export const getExpenses = (params: any = {}): Promise<any> => apiFetch(`/expenses?${new URLSearchParams(cleanParams(params)).toString()}`);
export const createExpense = (data: NewExpense): Promise<Expense> => apiFetch('/expenses', { method: 'POST', body: JSON.stringify(data) });
export const updateExpense = (id: string, data: Partial<Expense>): Promise<Expense> => apiFetch(`/expenses/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteExpense = (id: string): Promise<void> => apiFetch(`/expenses/${id}`, { method: 'DELETE' });
export const uploadExpenseReceipt = (formData: FormData): Promise<{url: string}> => apiFetch('/expenses/upload-receipt', { method: 'POST', body: formData });
export const exportExpenses = (params: any = {}): Promise<Blob> => apiFetchBlob(`/expenses/export?${new URLSearchParams(cleanParams(params)).toString()}`);

// --- Staff ---
export const getStaff = (): Promise<Staff[]> => apiFetch('/staff');
export const createStaff = (data: NewStaff): Promise<Staff> => apiFetch('/staff', { method: 'POST', body: JSON.stringify(data) });
export const updateStaff = (id: string, data: Partial<Staff>): Promise<Staff> => apiFetch(`/staff/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const uploadStaffPhoto = (body: FormData | { dataUrl: string; folder?: string }): Promise<{url: string}> => {
    if (body instanceof FormData) {
        return apiFetch('/staff/upload-photo', { method: 'POST', body });
    }
    return apiFetch('/staff/upload-photo', { method: 'POST', body: JSON.stringify(body) });
};
export const uploadMedia = (dataUrl: string, folder = 'media'): Promise<{url: string; filename?: string}> => {
    return apiFetch('/media/upload', { method: 'POST', body: JSON.stringify({ dataUrl, folder }) });
};

// --- Payroll ---
export const getPayrollItems = (): Promise<PayrollItem[]> => apiFetch('/payroll/payroll-items');
export const createPayrollItem = (data: NewPayrollItem): Promise<PayrollItem> => apiFetch('/payroll/payroll-items', { method: 'POST', body: JSON.stringify(data) });
export const updatePayrollItem = (id: string, data: Partial<PayrollItem>): Promise<PayrollItem> => apiFetch(`/payroll/payroll-items/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deletePayrollItem = (id: string): Promise<void> => apiFetch(`/payroll/payroll-items/${id}`, { method: 'DELETE' });
export const getPayrollHistory = (params: any = {}): Promise<any> => apiFetch(`/payroll/payroll-history?${new URLSearchParams(cleanParams(params)).toString()}`);
export const savePayrollRun = (data: Payroll[]): Promise<Payroll[]> => apiFetch('/payroll/generate', { method: 'POST', body: JSON.stringify(data) });

// --- Settings ---
export const getSchoolInfo = (): Promise<SchoolInfo> => apiFetch('/settings/school-info');
export const getPublicSchoolInfo = (): Promise<SchoolInfo> => apiFetch('/settings/public/school-info');
export const getExchangeRates = (): Promise<Record<string, number>> => apiFetch('/settings/public/rates');
export const updateSchoolInfo = (data: SchoolInfo): Promise<SchoolInfo> => apiFetch('/settings/school-info', { method: 'PUT', body: JSON.stringify(data) });
export const getDarajaSettings = (): Promise<DarajaSettings> => apiFetch('/settings/daraja');
export const updateDarajaSettings = (data: DarajaSettings): Promise<DarajaSettings> => apiFetch('/settings/daraja', { method: 'PUT', body: JSON.stringify(data) });
export const uploadLogo = (formData: FormData): Promise<{logoUrl: string}> => apiFetch('/settings/upload-logo', { method: 'POST', body: formData });

// --- Academics ---
export const getClasses = (): Promise<any> => apiFetch('/academics/classes');
export const createClass = (data: any): Promise<SchoolClass> => apiFetch('/academics/classes', { method: 'POST', body: JSON.stringify(data) });
export const updateClass = (id: string, data: any): Promise<SchoolClass> => apiFetch(`/academics/classes/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteClass = (id: string): Promise<void> => apiFetch(`/academics/classes/${id}`, { method: 'DELETE' });
export const updateClasses = (data: SchoolClass[]): Promise<SchoolClass[]> => apiFetch('/academics/classes/batch', { method: 'PUT', body: JSON.stringify(data) });

export const getSubjects = (): Promise<any> => apiFetch('/academics/subjects');
export const createSubject = (data: any): Promise<Subject> => apiFetch('/academics/subjects', { method: 'POST', body: JSON.stringify(data) });
export const updateSubject = (id: string, data: any): Promise<Subject> => apiFetch(`/academics/subjects/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteSubject = (id: string): Promise<void> => apiFetch(`/academics/subjects/${id}`, { method: 'DELETE' });
export const updateSubjects = (data: Subject[]): Promise<Subject[]> => apiFetch('/academics/subjects/batch', { method: 'PUT', body: JSON.stringify(data) });

export const findAllAssignments = (): Promise<any> => apiFetch('/academics/class-subject-assignments');
export const createAssignment = (data: any): Promise<ClassSubjectAssignment> => apiFetch('/academics/class-subject-assignments', { method: 'POST', body: JSON.stringify(data) });
export const deleteAssignment = (id: string): Promise<void> => apiFetch(`/academics/class-subject-assignments/${id}`, { method: 'DELETE' });
export const updateAssignments = (data: ClassSubjectAssignment[]): Promise<ClassSubjectAssignment[]> => apiFetch('/academics/class-subject-assignments/batch', { method: 'PUT', body: JSON.stringify(data) });

export const findAllTimetableEntries = (): Promise<TimetableEntry[]> => apiFetch('/academics/timetable-entries');
export const updateTimetable = (data: TimetableEntry[]): Promise<TimetableEntry[]> => apiFetch('/academics/timetable-entries/batch', { method: 'PUT', body: JSON.stringify(data) });
export const findAllExams = (): Promise<Exam[]> => apiFetch('/academics/exams');
export const updateExams = (data: Exam[]): Promise<Exam[]> => apiFetch('/academics/exams/batch', { method: 'PUT', body: JSON.stringify(data) });
export const getGrades = (params: any = {}): Promise<Grade[]> => apiFetch(`/academics/grades?${new URLSearchParams(cleanParams(params)).toString()}`);
export const updateGrades = (data: Grade[]): Promise<Grade[]> => apiFetch('/academics/grades/batch', { method: 'PUT', body: JSON.stringify(data) });
export const getAttendance = (params: any = {}): Promise<any> => apiFetch(`/academics/attendance-records?${new URLSearchParams(cleanParams(params)).toString()}`);
export const updateAttendance = (data: AttendanceRecord[]): Promise<AttendanceRecord[]> => apiFetch('/academics/attendance-records/batch', { method: 'PUT', body: JSON.stringify(data) });
export const getEvents = (): Promise<SchoolEvent[]> => apiFetch('/academics/events');
export const updateEvents = (data: SchoolEvent[]): Promise<SchoolEvent[]> => apiFetch('/academics/events/batch', { method: 'PUT', body: JSON.stringify(data) });
export const getGradingScale = (): Promise<GradingRule[]> => apiFetch('/academics/grading-scale');
export const createGradingRule = (data: NewGradingRule): Promise<GradingRule> => apiFetch('/academics/grading-scale', { method: 'POST', body: JSON.stringify(data) });
export const updateGradingRule = (id: string, data: Partial<GradingRule>): Promise<GradingRule> => apiFetch(`/academics/grading-scale/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteGradingRule = (id: string): Promise<void> => apiFetch(`/academics/grading-scale/${id}`, { method: 'DELETE' });
export const getFeeStructure = (): Promise<FeeItem[]> => apiFetch('/academics/fee-structure');
export const createFeeItem = (data: NewFeeItem): Promise<FeeItem> => apiFetch('/academics/fee-structure', { method: 'POST', body: JSON.stringify(data) });
export const updateFeeItem = (id: string, data: Partial<FeeItem>): Promise<FeeItem> => apiFetch(`/academics/fee-structure/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteFeeItem = (id: string): Promise<void> => apiFetch(`/academics/fee-structure/${id}`, { method: 'DELETE' });

// --- Communications ---
export const sendEmail = (payload: { to: string | string[]; subject: string; body: string }): Promise<{ success: boolean; message: string }> => apiFetch('/communications/send-email', { method: 'POST', body: JSON.stringify(payload) });
export const findAllAnnouncements = (): Promise<Announcement[]> => apiFetch('/communications/announcements');
export const createAnnouncement = (data: NewAnnouncement): Promise<Announcement> => apiFetch('/communications/announcements', { method: 'POST', body: JSON.stringify(data) });
export const updateAnnouncement = (id: string, data: Partial<Announcement>): Promise<Announcement> => apiFetch(`/communications/announcements/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteAnnouncement = (id: string): Promise<void> => apiFetch(`/communications/announcements/${id}`, { method: 'DELETE' });
export const getCommunicationLogs = (params: any = {}): Promise<any> => apiFetch(`/communications/communication-logs?${new URLSearchParams(cleanParams(params)).toString()}`);
export const createCommunicationLog = (data: NewCommunicationLog): Promise<CommunicationLog> => apiFetch('/communications/communication-logs', { method: 'POST', body: JSON.stringify(data) });
export const createBulkCommunicationLogs = (data: NewCommunicationLog[]): Promise<CommunicationLog[]> => apiFetch('/communications/communication-logs/batch', { method: 'POST', body: JSON.stringify(data) });

// --- Super Admin ---
export const getPlatformStats = () => apiFetch('/super-admin/stats');
export const getAllSchools = async (): Promise<SubscriberSchool[]> => {
    const res = await apiFetch('/super-admin/schools');
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    return [];
};
export const createSuperAdminSchool = (data: any): Promise<SubscriberSchool> => apiFetch('/super-admin/schools', { method: 'POST', body: JSON.stringify(data) });
export const getSystemHealth = (): Promise<SystemHealthData> => apiFetch('/super-admin/health');
export const getOnlineUsers = (): Promise<OnlineUserSession[]> => apiFetch('/super-admin/online-users');
export const pingDatabase = (): Promise<{ success: boolean; latencyMs: number; timestamp: string }> => apiFetch('/super-admin/health/ping-db', { method: 'POST' });
export const testQueueWorker = (): Promise<{ success: boolean; jobId: string; message: string; latencyMs: number }> => apiFetch('/super-admin/health/test-queue', { method: 'POST' });
export const retryFailedQueueJobs = (): Promise<{ success: boolean; retriedCount: number }> => apiFetch('/super-admin/health/retry-failed-jobs', { method: 'POST' });
export const getPlatformPricing = (): Promise<PlatformPricing> => apiFetch('/settings/public/pricing');
export const updatePlatformPricing = (data: Partial<PlatformPricing>) => apiFetch('/super-admin/pricing', { method: 'PUT', body: JSON.stringify(data) });
export const testSuperAdminStkPush = (data: { phone: string; amount: number; paybill?: string }): Promise<any> => apiFetch('/super-admin/test-stk-push', { method: 'POST', body: JSON.stringify(data) });
export const cardSubscriptionCheckout = (data: { schoolId: string; plan: string; billingCycle: string; amount: number; cardDetails: any }): Promise<any> => apiFetch('/super-admin/payments/card-checkout', { method: 'POST', body: JSON.stringify(data) });
export const updateSchoolSubscription = (schoolId: string, payload: any) => apiFetch(`/super-admin/schools/${schoolId}/subscription`, { method: 'PATCH', body: JSON.stringify(payload) });
export const getSubscriptionPayments = () => apiFetch('/super-admin/payments');
export const recordManualSubscriptionPayment = (data: any) => apiFetch('/super-admin/payments/manual', { method: 'POST', body: JSON.stringify(data) });
export const updateSchoolEmail = (id: string, email: string) => apiFetch(`/super-admin/schools/${id}/email`, { method: 'PATCH', body: JSON.stringify({ email }) });
export const updateSchoolPhone = (id: string, phone: string) => apiFetch(`/super-admin/schools/${id}/phone`, { method: 'PATCH', body: JSON.stringify({ phone }) });
export const initiateSubscriptionPayment = (data: { schoolId?: string; amount: number; method: string; plan: string; billingCycle?: string; transactionCode: string; email?: string }): Promise<any> => apiFetch('/super-admin/payments/initiate', { method: 'POST', body: JSON.stringify(data) });

export const getSaasInvoices = async (): Promise<SaasInvoice[]> => {
    const res = await apiFetch('/super-admin/invoices');
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    return [];
};
export const createSaasInvoice = (data: Partial<SaasInvoice>): Promise<SaasInvoice> => apiFetch('/super-admin/invoices', { method: 'POST', body: JSON.stringify(data) });
export const updateSaasInvoiceStatus = (id: string, status: string, paidDate?: string, ref?: string, paymentMethod?: string): Promise<SaasInvoice> => apiFetch(`/super-admin/invoices/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, paidDate, transactionRef: ref, paymentMethod }) });
export const getSaasReceipts = async (): Promise<SaasReceipt[]> => {
    const res = await apiFetch('/super-admin/receipts');
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    return [];
};
export const runLifecycleSweep = (): Promise<LifecycleSweepResult> => apiFetch('/super-admin/lifecycle-sweep', { method: 'POST' });
export const sendSchoolReminder = (schoolId: string, message?: string): Promise<any> => apiFetch(`/super-admin/schools/${schoolId}/reminder`, { method: 'POST', body: JSON.stringify({ message }) });
export const toggleSchoolAccess = (schoolId: string, enabled: boolean): Promise<any> => apiFetch(`/super-admin/schools/${schoolId}/toggle-access`, { method: 'PATCH', body: JSON.stringify({ enabled }) });
export const extendSchoolSubscription = (schoolId: string, days: number): Promise<any> => apiFetch(`/super-admin/schools/${schoolId}/extend`, { method: 'POST', body: JSON.stringify({ days }) });
export const activateSchoolSubscription = (schoolId: string, payload: { paymentMethod?: string; transactionRef?: string; plan?: string; billingCycle?: string } = {}): Promise<any> => apiFetch(`/super-admin/schools/${schoolId}/activate`, { method: 'POST', body: JSON.stringify(payload) });

// --- Library ---
export const getBooks = (params: any = {}): Promise<any> => apiFetch(`/library/books?${new URLSearchParams(cleanParams(params)).toString()}`);
export const addBook = (data: NewBook): Promise<any> => apiFetch('/library/books', { method: 'POST', body: JSON.stringify(data) });
export const updateBook = (id: string, data: Partial<Book>): Promise<any> => apiFetch(`/library/books/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteBook = (id: string): Promise<void> => apiFetch(`/library/books/${id}`, { method: 'DELETE' });
export const issueBook = (data: any): Promise<any> => apiFetch('/library/issue', { method: 'POST', body: JSON.stringify(data) });
export const returnBook = (id: string): Promise<any> => apiFetch(`/library/return/${id}`, { method: 'POST' });
export const markBookLost = (id: string): Promise<any> => apiFetch(`/library/lost/${id}`, { method: 'POST' });
export const getLibraryTransactions = (params: any = {}): Promise<any> => apiFetch(`/library/transactions?${new URLSearchParams(cleanParams(params)).toString()}`);

// --- LMS & Virtual Classrooms ---
export const getLmsAssignments = (params: any = {}): Promise<LmsAssignment[]> => 
    apiFetch(`/lms/assignments?${new URLSearchParams(cleanParams(params)).toString()}`);

export const createLmsAssignment = (data: Partial<LmsAssignment>): Promise<LmsAssignment> => 
    apiFetch('/lms/assignments', { method: 'POST', body: JSON.stringify(data) });

export const updateLmsAssignment = (id: string, data: Partial<LmsAssignment>): Promise<LmsAssignment> => 
    apiFetch(`/lms/assignments/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

export const deleteLmsAssignment = (id: string): Promise<any> => 
    apiFetch(`/lms/assignments/${id}`, { method: 'DELETE' });

export const getLmsSubmissions = (params: any = {}): Promise<LmsSubmission[]> => 
    apiFetch(`/lms/submissions?${new URLSearchParams(cleanParams(params)).toString()}`);

export const submitLmsAssignment = (data: Partial<LmsSubmission>): Promise<LmsSubmission> => 
    apiFetch('/lms/submissions', { method: 'POST', body: JSON.stringify(data) });

export const gradeLmsSubmission = (id: string, data: { score: number; gradeLetter: string; teacherFeedback?: string; gradedBy?: string; rubricScores?: any[] }): Promise<LmsSubmission> => 
    apiFetch(`/lms/submissions/${id}/grade`, { method: 'PATCH', body: JSON.stringify(data) });

export const getLmsLiveClasses = (params: any = {}): Promise<LmsLiveClass[]> => 
    apiFetch(`/lms/live-classes?${new URLSearchParams(cleanParams(params)).toString()}`);

export const createLmsLiveClass = (data: Partial<LmsLiveClass>): Promise<LmsLiveClass> => 
    apiFetch('/lms/live-classes', { method: 'POST', body: JSON.stringify(data) });

export const updateLmsLiveClass = (id: string, data: Partial<LmsLiveClass>): Promise<LmsLiveClass> => 
    apiFetch(`/lms/live-classes/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

export const deleteLmsLiveClass = (id: string): Promise<any> => 
    apiFetch(`/lms/live-classes/${id}`, { method: 'DELETE' });

// --- EdTech News & Learning Resources ---
export const getEdTechArticles = async (params: { category?: string; status?: string } = {}): Promise<EdTechArticle[]> => {
    const query = new URLSearchParams(cleanParams(params)).toString();
    const res = await apiFetch(`/edtech-news${query ? `?${query}` : ''}`);
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    return [];
};

export const getEdTechArticleById = (id: string): Promise<EdTechArticle> => 
    apiFetch(`/edtech-news/${id}`);

export const createEdTechArticle = (data: Partial<EdTechArticle>): Promise<EdTechArticle> => 
    apiFetch('/super-admin/edtech-news', { method: 'POST', body: JSON.stringify(data) });

export const updateEdTechArticle = (id: string, data: Partial<EdTechArticle>): Promise<EdTechArticle> => 
    apiFetch(`/super-admin/edtech-news/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteEdTechArticle = (id: string): Promise<any> => 
    apiFetch(`/super-admin/edtech-news/${id}`, { method: 'DELETE' });

export const toggleEdTechArticleStatus = (id: string): Promise<EdTechArticle> => 
    apiFetch(`/super-admin/edtech-news/${id}/toggle-status`, { method: 'POST' });

export const toggleEdTechArticleFeatured = (id: string): Promise<EdTechArticle> => 
    apiFetch(`/super-admin/edtech-news/${id}/toggle-featured`, { method: 'POST' });

export const fetchInitialData = async () => {
    const results = await Promise.all([
        getUsers(),
        getStudents({ pagination: 'false' }),
        getTransactions({ pagination: 'false' }),
        getExpenses({ pagination: 'false' }),
        getStaff(),
        getPayrollHistory({ limit: 1000 }),
        getSubjects(),
        getClasses(),
        findAllAssignments(),
        findAllTimetableEntries(),
        findAllExams(),
        getGrades(),
        getAttendance({ pagination: 'false' }),
        getEvents(),
        getGradingScale(),
        getFeeStructure(),
        getPayrollItems(),
        getCommunicationLogs({ limit: 1000 }),
        findAllAnnouncements(),
        getSchoolInfo(),
        getDarajaSettings()
    ]);
    return results.map(res => (res && typeof res === 'object' && 'data' in res && !Array.isArray(res)) ? res.data : res);
};
