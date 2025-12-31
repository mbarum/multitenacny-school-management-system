
export enum Role {
  SuperAdmin = 'SuperAdmin',
  Admin = 'Admin',
  Accountant = 'Accountant',
  Teacher = 'Teacher',
  Receptionist = 'Receptionist',
  Auditor = 'Auditor',
  Parent = 'Parent',
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: Role;
  avatarUrl: string;
  status: 'Active' | 'Disabled';
  schoolId?: string;
}
export type NewUser = Omit<User, 'id' | 'avatarUrl' | 'status'>;

export enum StudentStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Graduated = 'Graduated',
}

export interface Student {
  id: string;
  admissionNumber: string;
  name: string;
  class: string; 
  classId: string;
  status: StudentStatus;
  profileImage: string;
  guardianName: string;
  guardianContact: string;
  guardianAddress: string;
  guardianEmail: string;
  emergencyContact: string;
  dateOfBirth: string; // YYYY-MM-DD
  balance?: number; // Calculated field
}
export type NewStudent = Omit<Student, 'id' | 'status' | 'admissionNumber' | 'balance'>;

export interface SchoolClass {
    id: string;
    name: string;
    classCode: string;
    formTeacherId?: string | null;
    formTeacherName?: string | null;
}
export type NewSchoolClass = Omit<SchoolClass, 'id'>;

export interface Exam {
    id: string;
    name: string;
    date: string; // YYYY-MM-DD
    classId: string;
    type: ExamType;
    schoolClass?: SchoolClass;
}
export type NewExam = Omit<Exam, 'id'>;

export enum PaymentMethod {
    MPesa = 'MPesa',
    Cash = 'Cash',
    Check = 'Check'
}

export enum CheckStatus {
    Pending = 'Pending',
    Cleared = 'Cleared',
    Bounced = 'Bounced'
}

export enum TransactionType {
    Invoice = 'Invoice',
    Payment = 'Payment',
    ManualDebit = 'ManualDebit',
    ManualCredit = 'ManualCredit',
}

export interface Transaction {
  id: string;
  studentId: string;
  studentName?: string;
  type: TransactionType;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  method?: PaymentMethod;
  transactionCode?: string;
  checkNumber?: string;
  checkBank?: string;
  checkStatus?: CheckStatus;
}
export type NewTransaction = Omit<Transaction, 'id'>;

export enum ExpenseCategory {
    Salaries = 'Salaries',
    Utilities = 'Utilities',
    PettyCash = 'PettyCash',
    Supplies = 'Supplies',
    Maintenance = 'Maintenance'
}

export interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  attachmentUrl?: string;
}
export type NewExpense = Omit<Expense, 'id'>;

export interface Staff {
    id: string;
    userId: string;
    name: string;
    email: string;
    role: string;
    userRole: Role;
    photoUrl: string;
    salary: number; 
    joinDate: string; // YYYY-MM-DD
    bankName: string;
    accountNumber: string;
    kraPin: string;
    nssfNumber: string;
    shaNumber: string;
}
export type NewStaff = Omit<Staff, 'id' | 'userId'> & { password?: string };

export enum PayrollItemType {
    Earning = 'Earning',
    Deduction = 'Deduction',
}

export enum PayrollItemCategory {
    Allowance = 'Allowance',
    Bonus = 'Bonus',
    Statutory = 'Statutory',
    Loan = 'Loan',
    Advance = 'Advance',
    Other = 'Other'
}

export enum CalculationType {
    Fixed = 'Fixed',
    Percentage = 'Percentage'
}

export interface PayrollItem {
    id: string;
    name: string;
    type: PayrollItemType;
    category: PayrollItemCategory;
    calculationType: CalculationType;
    value: number;
    isRecurring: boolean;
}
export type NewPayrollItem = Omit<PayrollItem, 'id'>;

export interface PayrollEntry {
    name: string;
    amount: number;
    type?: PayrollItemType;
}

export interface Payroll {
    id: string;
    staffId: string;
    staffName: string;
    month: string; 
    payDate: string; // YYYY-MM-DD
    grossPay: number;
    totalDeductions: number;
    netPay: number;
    earnings: PayrollEntry[];
    deductions: PayrollEntry[];
}

export interface Subject {
    id: string;
    name: string;
    code: string; // Kenyan Subject Code e.g. 901
}
export type NewSubject = Omit<Subject, 'id'>;

export interface ClassSubjectAssignment {
    id: string;
    classId: string;
    subjectId: string;
    teacherId: string;
}
export type NewClassSubjectAssignment = Omit<ClassSubjectAssignment, 'id'>;

export enum DayOfWeek {
    Monday = 'Monday',
    Tuesday = 'Tuesday',
    Wednesday = 'Wednesday',
    Thursday = 'Thursday',
    Friday = 'Friday',
}

export interface TimetableEntry {
    id: string;
    classId: string;
    subjectId: string;
    teacherId: string;
    day: DayOfWeek;
    startTime: string; // "HH:MM"
    endTime: string; // "HH:MM"
}
export type NewTimetableEntry = Omit<TimetableEntry, 'id'>;

export enum ExamType {
    Traditional = 'Traditional',
    CBC = 'CBC'
}

export enum CbetScore {
  EE1 = 'EE1',
  EE2 = 'EE2',
  ME1 = 'ME1',
  ME2 = 'ME2',
  AE1 = 'AE1',
  AE2 = 'AE2',
  BE1 = 'BE1',
  BE2 = 'BE2'
}

// CBC Points and Description Mapping for Kenya
export const CBC_LEVEL_MAP: Record<CbetScore, { points: number, description: string }> = {
    [CbetScore.EE1]: { points: 8, description: 'Exceeding Expectation' },
    [CbetScore.EE2]: { points: 7, description: 'Exceeding Expectation' },
    [CbetScore.ME1]: { points: 6, description: 'Meeting Expectation' },
    [CbetScore.ME2]: { points: 5, description: 'Meeting Expectation' },
    [CbetScore.AE1]: { points: 4, description: 'Approaching Expectation' },
    [CbetScore.AE2]: { points: 3, description: 'Approaching Expectation' },
    [CbetScore.BE1]: { points: 2, description: 'Below Expectation' },
    [CbetScore.BE2]: { points: 1, description: 'Below Expectation' },
};

export interface Grade {
    id: string;
    studentId: string;
    examId: string;
    subjectId: string;
    score: number | null;
    cbetScore?: CbetScore | null;
    comments?: string;
}
export type NewGrade = Omit<Grade, 'id'>;

export enum AttendanceStatus {
    Present = 'Present',
    Absent = 'Absent',
    Late = 'Late',
    Excused = 'Excused'
}

export interface AttendanceRecord {
    id: string;
    studentId: string;
    classId: string;
    date: string; // YYYY-MM-DD
    status: AttendanceStatus;
    remarks?: string;
}
export type NewAttendanceRecord = Omit<AttendanceRecord, 'id'>;

export enum EventCategory {
    Holiday = 'Holiday',
    Academic = 'Academic',
    Meeting = 'Meeting',
    Sports = 'Sports',
    General = 'General'
}

export interface SchoolEvent {
    id: string;
    title: string;
    description: string;
    startDate: string; // YYYY-MM-DD
    endDate?: string; // YYYY-MM-DD
    category: EventCategory;
}
export type NewSchoolEvent = Omit<SchoolEvent, 'id'>;

export enum GradingSystem {
    Traditional = 'Traditional',
    CBC = 'CBC'
}

export enum Currency {
    KES = 'KES',
    UGX = 'UGX',
    TZS = 'TZS',
    RWF = 'RWF',
    BIF = 'BIF',
    USD = 'USD',
    ZMW = 'ZMW',
    ETB = 'ETB',
    SDG = 'SDG',
    SSP = 'SSP'
}

export interface SchoolInfo {
    id: string;
    name: string;
    address: string;
    phone: string;
    email: string;
    logoUrl?: string;
    schoolCode: string;
    gradingSystem: GradingSystem;
    currency?: Currency;
}

export interface School {
    id: string;
    name: string;
    slug: string;
    email?: string;
    phone?: string;
    logoUrl?: string;
    createdAt?: string;
    adminName?: string;
    studentCount?: number;
    subscription?: {
        plan: SubscriptionPlan;
        status: SubscriptionStatus;
        endDate?: string;
    };
}

export interface GradingRule {
    id: string;
    grade: string;
    minScore: number;
    maxScore: number;
}
export type NewGradingRule = Omit<GradingRule, 'id'>;

export interface ClassFee {
    classId: string;
    amount: number;
}

export interface FeeItem {
    id: string;
    name: string;
    category: string;
    frequency: 'Termly' | 'Annually' | 'One-Time';
    isOptional: boolean;
    classSpecificFees: ClassFee[];
}
export type NewFeeItem = Omit<FeeItem, 'id'>;

export enum CommunicationType {
    SMS = 'SMS',
    Email = 'Email',
    PortalMessage = 'PortalMessage'
}

export interface CommunicationLog {
    id: string;
    studentId: string;
    type: CommunicationType;
    message: string;
    date: string; // ISO String
    sentBy: string; // User's name
}
export type NewCommunicationLog = Omit<CommunicationLog, 'id'>;

export interface Announcement {
    id: string;
    title: string;
    content: string;
    date: string; // ISO String
    audience: string; // 'all' or classId
    sentBy: string; // User's name
    sentById?: string;
}
export type NewAnnouncement = Omit<Announcement, 'id'>;

export interface ReportShareLog {
    id: string;
    studentId: string;
    examId: string;
    sharedDate: string; // ISO String
    sharedBy: string; // User's name
}

export interface DarajaSettings {
    consumerKey: string;
    consumerSecret: string;
    shortCode: string;
    passkey: string;
    paybillNumber: string;
}

export interface MpesaC2BTransaction {
    id: string;
    transactionType: 'Pay Bill' | 'STK Push';
    transID: string;
    transTime: string;
    transAmount: string;
    businessShortCode: string;
    billRefNumber: string; // Student Admission Number
    msisdn: string;
    firstName: string;
    lastName: string;
    isProcessed: boolean;
}

export interface Notification {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
}

export interface Book {
    id: string;
    title: string;
    author: string;
    isbn?: string;
    category: string;
    totalQuantity: number;
    availableQuantity: number;
    shelfLocation?: string;
    price?: number;
}
export type NewBook = Omit<Book, 'id' | 'availableQuantity'>;

export enum LibraryStatus {
    BORROWED = 'Borrowed',
    RETURNED = 'Returned',
    OVERDUE = 'Overdue',
    LOST = 'Lost'
}

export interface LibraryTransaction {
    id: string;
    bookId: string;
    bookTitle: string;
    studentId: string;
    borrowerName: string;
    borrowDate: string;
    dueDate: string;
    returnDate?: string;
    status: LibraryStatus;
}

export interface IssueBookData {
    bookId: string;
    studentId: string;
    dueDate: string;
}

export enum SubscriptionPlan {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM'
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  CANCELLED = 'CANCELLED',
  TRIAL = 'TRIAL'
}

export interface PlatformPricing {
    id: number;
    basicMonthlyPrice: number;
    basicAnnualPrice: number;
    premiumMonthlyPrice: number;
    premiumAnnualPrice: number;
    mpesaPaybill?: string;
    mpesaConsumerKey?: string;
    mpesaConsumerSecret?: string;
    mpesaPasskey?: string;
    stripePublishableKey?: string;
    stripeSecretKey?: string;
    stripeWebhookSecret?: string;
}
