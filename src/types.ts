
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

export interface Subscription {
    id: string;
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    startDate: string;
    endDate: string;
}

export interface School {
    id: string;
    name: string;
    slug: string;
    email?: string;
    phone?: string;
    adminName?: string;
    subscription: Subscription;
    createdAt: string;
}

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
  dateOfBirth: string; 
  balance?: number; 
}
export type NewStudent = Omit<Student, 'id' | 'status' | 'admissionNumber' | 'balance'>;

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  last_page: number;
}

export interface SchoolClass {
    id: string;
    name: string;
    classCode: string;
    formTeacherId?: string;
    formTeacherName?: string;
}
export type NewSchoolClass = Omit<SchoolClass, 'id'>;

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
  date: string; 
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
  date: string; 
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
    joinDate: string; 
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
}

export interface Payroll {
    id: string;
    staffId: string;
    staffName: string;
    month: string; 
    payDate: string; 
    grossPay: number;
    totalDeductions: number;
    netPay: number;
    earnings: PayrollEntry[];
    deductions: PayrollEntry[];
}

export interface Subject {
    id: string;
    name: string;
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
    startTime: string; 
    endTime: string; 
}
export type NewTimetableEntry = Omit<TimetableEntry, 'id'>;

export enum ExamType {
    Traditional = 'Traditional',
    CBC = 'CBC'
}

export enum CbetScore {
  Exceeds = 'Exceeds',
  Meets = 'Meets',
  Approaching = 'Approaching',
  Below = 'Below',
  Exceeds_Expectation = 'Exceeds Expectation',
  Meets_Expectation = 'Meets Expectation',
  Approaching_Expectation = 'Approaching Expectation',
  Below_Expectation = 'Below Expectation'
}

export interface Exam {
    id: string;
    name: string;
    date: string; 
    classId: string;
    type: ExamType;
}
export type NewExam = Omit<Exam, 'id'>;

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
    date: string; 
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
    startDate: string; 
    endDate?: string; 
    category: EventCategory;
}
export type NewSchoolEvent = Omit<SchoolEvent, 'id'>;

export enum GradingSystem {
    Traditional = 'Traditional',
    CBC = 'CBC'
}

export interface SchoolInfo {
    name: string;
    address: string;
    phone: string;
    email: string;
    logoUrl?: string;
    schoolCode: string;
    gradingSystem: GradingSystem;
}
export type UpdateSchoolInfoDto = Partial<Omit<SchoolInfo, 'logoUrl'>>;

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
    date: string; 
    sentBy: string; 
}
export type NewCommunicationLog = Omit<CommunicationLog, 'id'>;

export interface Announcement {
    id: string;
    title: string;
    content: string;
    date: string; 
    audience: string; 
    sentBy: string; 
}
export type NewAnnouncement = Omit<Announcement, 'id'>;

export interface ReportShareLog {
    id: string;
    studentId: string;
    examId: string;
    sharedDate: string; 
    sharedBy: string; 
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
    transactionType: 'Pay Bill';
    transID: string;
    transTime: string;
    transAmount: string;
    businessShortCode: string;
    billRefNumber: string; 
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

export interface AuditLog {
    id: string;
    action: string;
    resource: string;
    details: string;
    ipAddress: string;
    timestamp: string;
    user?: {
        name: string;
        email: string;
    }
}

export enum LibraryStatus {
    BORROWED = 'Borrowed',
    RETURNED = 'Returned',
    OVERDUE = 'Overdue',
    LOST = 'Lost'
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
}
export type NewBook = Omit<Book, 'id' | 'availableQuantity'>;

export interface LibraryTransaction {
    id: string;
    bookId: string;
    bookTitle?: string; 
    studentId: string;
    studentName?: string; 
    borrowerName: string;
    borrowDate: string;
    dueDate: string;
    returnDate?: string | null;
    status: LibraryStatus;
}
export interface IssueBookData {
    bookId: string;
    studentId: string;
    dueDate: string;
}
