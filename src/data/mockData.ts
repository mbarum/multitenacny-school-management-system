import { 
    Role, StudentStatus, PaymentMethod, TransactionType, ExpenseCategory, 
    PayrollItemType, PayrollItemCategory, CalculationType, GradingSystem,
    ExamType, AttendanceStatus, SubscriptionPlan, SubscriptionStatus,
    type User, type Student, type SchoolClass, type Subject, type ClassSubjectAssignment,
    type TimetableEntry, type Exam, type Grade, type AttendanceRecord, type Staff,
    type Payroll, type PayrollItem, type Transaction, type Expense, type Announcement,
    type CommunicationLog, type GradingRule, type FeeItem, type SchoolInfo, type PlatformPricing,
    type DarajaSettings, type Book, type SubscriberSchool, type SaasInvoice, type SaasReceipt
} from '../types';
import { EXCHANGE_RATES } from '../utils/currency';

export const initialSchoolInfo: SchoolInfo = {
    id: 'school-1',
    name: 'Springfield Elementary',
    address: '123 Main St, Academic Ridge, Nairobi',
    phone: '+254 700 000 000',
    email: 'bursar@springfield.edu',
    logoUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&q=80&w=120',
    schoolCode: 'SPE',
    gradingSystem: GradingSystem.Traditional,
    currency: 'KES',
    bankName: 'Equity Bank Kenya',
    bankAccountName: 'Springfield Elementary School Main A/C',
    bankAccountNumber: '0140293847291',
    bankBranch: 'Westlands Supreme Branch',
    mpesaPaybill: '522522',
    mpesaAccountPrefix: 'SPE-',
    taxPin: 'P051239845X',
    subscription: {
        plan: SubscriptionPlan.PREMIUM,
        status: SubscriptionStatus.ACTIVE,
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    }
};

export const initialPricing: PlatformPricing = {
    id: 1,
    basicMonthlyPrice: 3000,
    basicAnnualPrice: 30000,
    premiumMonthlyPrice: 5000,
    premiumAnnualPrice: 50000,
    stripePublishableKey: 'pk_test_sample',
    mpesaPaybill: '522522',
    wireBankName: 'NCBA Bank Kenya PLC',
    wireAccountName: 'SaasLink Technologies Ltd - Cloud Operations',
    wireAccountNumber: '1004928371',
    wireBankBranch: 'Upper Hill Corporate Branch, Nairobi',
    wireSwiftCode: 'NCBAKENA',
    wirePaymentInstructions: 'Include the Proforma Invoice Number as the mandatory wire reference. Once wire transfer is remitted, our Super Administrator verifies the deposit and activates your institutional license with credentials dispatched.'
};

export const initialUsers: User[] = [
    {
        id: 'user-admin',
        name: 'Admin User',
        email: 'admin@saaslink.com',
        role: Role.Admin,
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120',
        status: 'Active',
        schoolId: 'school-1'
    },
    {
        id: 'user-super',
        name: 'Platform Owner',
        email: 'super@saaslink.com',
        role: Role.SuperAdmin,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
        status: 'Active'
    },
    {
        id: 'user-accountant',
        name: 'Accountant User',
        email: 'accountant@saaslink.com',
        role: Role.Accountant,
        avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=120',
        status: 'Active',
        schoolId: 'school-1'
    },
    {
        id: 'user-teacher-1',
        name: 'Alice Teacher',
        email: 'alice@saaslink.com',
        role: Role.Teacher,
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
        status: 'Active',
        schoolId: 'school-1'
    },
    {
        id: 'user-teacher-2',
        name: 'Bob Teacher',
        email: 'bob@saaslink.com',
        role: Role.Teacher,
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
        status: 'Active',
        schoolId: 'school-1'
    },
    {
        id: 'user-parent-1',
        name: 'Charlie Parent',
        email: 'parent1@saaslink.com',
        role: Role.Parent,
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120',
        status: 'Active',
        schoolId: 'school-1'
    },
    {
        id: 'user-parent-2',
        name: 'Diana Guardian',
        email: 'diana@example.com',
        role: Role.Parent,
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120',
        status: 'Active',
        schoolId: 'school-1'
    },
    {
        id: 'user-parent-3',
        name: 'Grace Kamau',
        email: 'grace.kamau@example.com',
        role: Role.Parent,
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120',
        status: 'Active',
        schoolId: 'school-1'
    }
];

export const initialClasses: SchoolClass[] = [
    { id: 'class-1', name: 'Grade 1', classCode: 'G1', formTeacherId: 'user-teacher-1', formTeacherName: 'Alice Teacher' },
    { id: 'class-2', name: 'Grade 2', classCode: 'G2', formTeacherId: 'user-teacher-2', formTeacherName: 'Bob Teacher' },
    { id: 'class-3', name: 'Grade 3', classCode: 'G3', formTeacherId: null, formTeacherName: null },
    { id: 'class-4', name: 'Grade 4', classCode: 'G4', formTeacherId: null, formTeacherName: null }
];

export const initialSubjects: Subject[] = [
    { id: 'subj-1', name: 'Mathematics', code: 'MAT101' },
    { id: 'subj-2', name: 'English Language', code: 'ENG101' },
    { id: 'subj-3', name: 'Integrated Science', code: 'SCI101' },
    { id: 'subj-4', name: 'Social Studies', code: 'SST101' }
];

export const initialStudents: Student[] = [
    {
        id: 'stud-1',
        admissionNumber: '2026-0001',
        name: 'Liam Smith',
        class: 'Grade 1',
        classId: 'class-1',
        status: StudentStatus.Active,
        profileImage: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=120',
        guardianName: 'Charlie Parent',
        guardianContact: '+254 712 345 678',
        guardianAddress: '123 Fake St, Nairobi',
        guardianEmail: 'parent1@saaslink.com',
        emergencyContact: '+254 787 654 321',
        dateOfBirth: '2018-05-14',
        balance: 15000
    },
    {
        id: 'stud-2',
        admissionNumber: '2026-0002',
        name: 'Olivia Johnson',
        class: 'Grade 1',
        classId: 'class-1',
        status: StudentStatus.Active,
        profileImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=120',
        guardianName: 'Diana Parent',
        guardianContact: '+254 722 111 222',
        guardianAddress: '456 Palm Ave, Nairobi',
        guardianEmail: 'diana@example.com',
        emergencyContact: '+254 733 444 555',
        dateOfBirth: '2018-08-20',
        balance: 0
    },
    {
        id: 'stud-3',
        admissionNumber: '2026-0003',
        name: 'Noah Williams',
        class: 'Grade 2',
        classId: 'class-2',
        status: StudentStatus.Active,
        profileImage: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=120',
        guardianName: 'Charlie Parent',
        guardianContact: '+254 712 345 678',
        guardianAddress: '123 Fake St, Nairobi',
        guardianEmail: 'parent1@saaslink.com',
        emergencyContact: '+254 787 654 321',
        dateOfBirth: '2017-03-10',
        balance: 5000
    },
    {
        id: 'stud-4',
        admissionNumber: '2026-0004',
        name: 'Emma Brown',
        class: 'Grade 2',
        classId: 'class-2',
        status: StudentStatus.Active,
        profileImage: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=120',
        guardianName: 'George Brown',
        guardianContact: '+254 700 999 888',
        guardianAddress: '789 Oak Rd, Nairobi',
        guardianEmail: 'george@example.com',
        emergencyContact: '+254 711 222 333',
        dateOfBirth: '2017-11-05',
        balance: 20000
    },
    {
        id: 'stud-5',
        admissionNumber: '2026-0005',
        name: 'Ethan Kamau',
        class: 'Grade 3',
        classId: 'class-3',
        status: StudentStatus.Active,
        profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120',
        guardianName: 'Grace Kamau',
        guardianContact: '+254 720 334 455',
        guardianAddress: '14 Riverside Dr, Nairobi',
        guardianEmail: 'grace.kamau@example.com',
        emergencyContact: '+254 721 556 677',
        dateOfBirth: '2016-04-12',
        balance: 0
    },
    {
        id: 'stud-6',
        admissionNumber: '2026-0006',
        name: 'Sophia Muthoni',
        class: 'Grade 3',
        classId: 'class-3',
        status: StudentStatus.Active,
        profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
        guardianName: 'Peter Muthoni',
        guardianContact: '+254 733 987 654',
        guardianAddress: '88 Kilimani Rd, Nairobi',
        guardianEmail: 'peter.m@example.com',
        emergencyContact: '+254 734 112 233',
        dateOfBirth: '2016-09-25',
        balance: 8500
    },
    {
        id: 'stud-7',
        admissionNumber: '2026-0007',
        name: 'Lucas Otieno',
        class: 'Grade 4',
        classId: 'class-4',
        status: StudentStatus.Active,
        profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
        guardianName: 'Mary Otieno',
        guardianContact: '+254 715 678 901',
        guardianAddress: '42 Ngong Rd, Nairobi',
        guardianEmail: 'mary.otieno@example.com',
        emergencyContact: '+254 716 234 567',
        dateOfBirth: '2015-02-18',
        balance: 12000
    },
    {
        id: 'stud-8',
        admissionNumber: '2026-0008',
        name: 'Ava Wanjiku',
        class: 'Grade 4',
        classId: 'class-4',
        status: StudentStatus.Active,
        profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
        guardianName: 'James Wanjiku',
        guardianContact: '+254 722 890 123',
        guardianAddress: '200 Westlands Way, Nairobi',
        guardianEmail: 'james.w@example.com',
        emergencyContact: '+254 723 456 789',
        dateOfBirth: '2015-07-30',
        balance: 0
    }
];

export const initialStaff: Staff[] = [
    {
        id: 'staff-1',
        userId: 'user-teacher-1',
        name: 'Alice Teacher',
        email: 'alice@saaslink.com',
        role: 'Senior Teacher',
        userRole: Role.Teacher,
        photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
        salary: 55000,
        joinDate: '2023-01-10',
        bankName: 'Equity Bank',
        accountNumber: '1234567890',
        kraPin: 'A001234567Z',
        nssfNumber: '20012345',
        shaNumber: '30012345'
    },
    {
        id: 'staff-2',
        userId: 'user-teacher-2',
        name: 'Bob Teacher',
        email: 'bob@saaslink.com',
        role: 'Science Teacher',
        userRole: Role.Teacher,
        photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
        salary: 52000,
        joinDate: '2023-05-15',
        bankName: 'KCB Bank',
        accountNumber: '9876543210',
        kraPin: 'A009876543Y',
        nssfNumber: '20098765',
        shaNumber: '30098765'
    }
];

export const initialTransactions: Transaction[] = [
    {
        id: 'tx-1',
        studentId: 'stud-1',
        studentName: 'Liam Smith',
        type: TransactionType.Invoice,
        date: '2026-01-05',
        description: 'Term 1 Tuition Fee',
        amount: 35000
    },
    {
        id: 'tx-2',
        studentId: 'stud-1',
        studentName: 'Liam Smith',
        type: TransactionType.Payment,
        date: '2026-01-10',
        description: 'Fee payment via M-Pesa',
        amount: 20000,
        method: PaymentMethod.MPesa,
        transactionCode: 'QWE123RTY'
    },
    {
        id: 'tx-3',
        studentId: 'stud-2',
        studentName: 'Olivia Johnson',
        type: TransactionType.Invoice,
        date: '2026-01-05',
        description: 'Term 1 Tuition Fee',
        amount: 35000
    },
    {
        id: 'tx-4',
        studentId: 'stud-2',
        studentName: 'Olivia Johnson',
        type: TransactionType.Payment,
        date: '2026-01-08',
        description: 'Full payment via Bank Deposit',
        amount: 35000,
        method: PaymentMethod.Check,
        transactionCode: 'BNK-99231'
    },
    {
        id: 'tx-5',
        studentId: 'stud-3',
        studentName: 'Noah Williams',
        type: TransactionType.Invoice,
        date: '2026-05-04',
        description: 'Term 2 Tuition Fee',
        amount: 35000
    },
    {
        id: 'tx-6',
        studentId: 'stud-3',
        studentName: 'Noah Williams',
        type: TransactionType.Payment,
        date: '2026-05-12',
        description: 'M-Pesa STK Push Settlement',
        amount: 30000,
        method: PaymentMethod.MPesa,
        transactionCode: 'SDA849MKL'
    },
    {
        id: 'tx-7',
        studentId: 'stud-4',
        studentName: 'Emma Brown',
        type: TransactionType.Invoice,
        date: '2026-05-04',
        description: 'Term 2 Tuition & Activity Fee',
        amount: 40000
    },
    {
        id: 'tx-8',
        studentId: 'stud-4',
        studentName: 'Emma Brown',
        type: TransactionType.Payment,
        date: '2026-05-20',
        description: 'Direct Cash Payment at Bursar Desk',
        amount: 20000,
        method: PaymentMethod.Cash,
        transactionCode: 'CSH-0042'
    },
    {
        id: 'tx-9',
        studentId: 'stud-5',
        studentName: 'Ethan Kamau',
        type: TransactionType.Invoice,
        date: '2026-09-01',
        description: 'Term 3 Tuition Fee',
        amount: 35000
    },
    {
        id: 'tx-10',
        studentId: 'stud-5',
        studentName: 'Ethan Kamau',
        type: TransactionType.Payment,
        date: '2026-09-02',
        description: 'Full Tuition Payment via M-Pesa',
        amount: 35000,
        method: PaymentMethod.MPesa,
        transactionCode: 'NJK384HGD'
    },
    {
        id: 'tx-11',
        studentId: 'stud-6',
        studentName: 'Sophia Muthoni',
        type: TransactionType.Invoice,
        date: '2026-09-01',
        description: 'Term 3 Tuition Fee',
        amount: 35000
    },
    {
        id: 'tx-12',
        studentId: 'stud-6',
        studentName: 'Sophia Muthoni',
        type: TransactionType.Payment,
        date: '2026-09-07',
        description: 'Partial Fee Installment (M-Pesa)',
        amount: 26500,
        method: PaymentMethod.MPesa,
        transactionCode: 'BVC912QAZ'
    },
    {
        id: 'tx-13',
        studentId: 'stud-7',
        studentName: 'Lucas Otieno',
        type: TransactionType.Invoice,
        date: '2026-09-01',
        description: 'Term 3 Tuition Fee',
        amount: 35000
    },
    {
        id: 'tx-14',
        studentId: 'stud-7',
        studentName: 'Lucas Otieno',
        type: TransactionType.Payment,
        date: '2026-09-08',
        description: 'First Term 3 Installment via Bank',
        amount: 23000,
        method: PaymentMethod.Check,
        transactionCode: 'EQUITY-8831'
    },
    {
        id: 'tx-15',
        studentId: 'stud-8',
        studentName: 'Ava Wanjiku',
        type: TransactionType.Invoice,
        date: '2026-09-01',
        description: 'Term 3 Tuition & Computer Fee',
        amount: 38000
    },
    {
        id: 'tx-16',
        studentId: 'stud-8',
        studentName: 'Ava Wanjiku',
        type: TransactionType.Payment,
        date: '2026-09-09',
        description: 'M-Pesa STK Instant Checkout',
        amount: 38000,
        method: PaymentMethod.MPesa,
        transactionCode: 'MPX7721KK'
    }
];

export const initialExpenses: Expense[] = [
    {
        id: 'exp-1',
        category: ExpenseCategory.Utilities,
        description: 'Electricity Bill - January Token Purchase',
        amount: 8500,
        date: '2026-01-15',
        attachmentUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=400'
    },
    {
        id: 'exp-2',
        category: ExpenseCategory.Supplies,
        description: 'Stationery, Exercise Books & Printing Paper',
        amount: 14200,
        date: '2026-01-20',
        attachmentUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=400'
    },
    {
        id: 'exp-3',
        category: ExpenseCategory.Maintenance,
        description: 'Plumbing Repairs & Water Tank Overhaul in Block B',
        amount: 5000,
        date: '2026-02-02',
        attachmentUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=400'
    },
    {
        id: 'exp-4',
        category: ExpenseCategory.Salaries,
        description: 'Support Staff & Security Wages - Term 1',
        amount: 65000,
        date: '2026-02-28',
        attachmentUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=400'
    },
    {
        id: 'exp-5',
        category: ExpenseCategory.Utilities,
        description: 'Dedicated Fiber Internet Bandwidth - March',
        amount: 12000,
        date: '2026-03-05',
        attachmentUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=400'
    },
    {
        id: 'exp-6',
        category: ExpenseCategory.Supplies,
        description: 'Science Laboratory Reagents & Beakers',
        amount: 22500,
        date: '2026-05-15',
        attachmentUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=400'
    },
    {
        id: 'exp-7',
        category: ExpenseCategory.Maintenance,
        description: 'Classroom Desks Painting & Carpentry Restoration',
        amount: 9800,
        date: '2026-06-10',
        attachmentUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=400'
    },
    {
        id: 'exp-8',
        category: ExpenseCategory.PettyCash,
        description: 'Inter-School Sports Gala First Aid Kit Refill',
        amount: 3500,
        date: '2026-07-04',
        attachmentUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=400'
    },
    {
        id: 'exp-9',
        category: ExpenseCategory.Utilities,
        description: 'Water Bowing & City Council Sanitation Levy',
        amount: 6800,
        date: '2026-08-18',
        attachmentUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=400'
    },
    {
        id: 'exp-10',
        category: ExpenseCategory.Supplies,
        description: 'Term 3 Examination Papers & Duplicating Ink',
        amount: 18400,
        date: '2026-09-02',
        attachmentUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=400'
    },
    {
        id: 'exp-11',
        category: ExpenseCategory.Maintenance,
        description: 'Backup Generator Servicing & Diesel Refill',
        amount: 11200,
        date: '2026-09-06',
        attachmentUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=400'
    },
    {
        id: 'exp-12',
        category: ExpenseCategory.PettyCash,
        description: 'Emergency Electrical Breaker Replacement (Admin Wing)',
        amount: 2800,
        date: '2026-09-08',
        attachmentUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=400'
    }
];

export const initialGradingRules: GradingRule[] = [
    { id: 'gr-1', grade: 'A', minScore: 80, maxScore: 100 },
    { id: 'gr-2', grade: 'B', minScore: 70, maxScore: 79 },
    { id: 'gr-3', grade: 'C', minScore: 50, maxScore: 69 },
    { id: 'gr-4', grade: 'D', minScore: 40, maxScore: 49 },
    { id: 'gr-5', grade: 'E', minScore: 0, maxScore: 39 }
];

export const initialFeeStructure: FeeItem[] = [
    {
        id: 'fee-1',
        name: 'Tuition Fee',
        category: 'Tuition',
        frequency: 'Termly',
        isOptional: false,
        classSpecificFees: [
            { classId: 'class-1', amount: 30000 },
            { classId: 'class-2', amount: 32000 },
            { classId: 'class-3', amount: 35000 },
            { classId: 'class-4', amount: 35000 }
        ]
    },
    {
        id: 'fee-2',
        name: 'Lunch Program',
        category: 'Meals',
        frequency: 'Termly',
        isOptional: true,
        classSpecificFees: [
            { classId: 'class-1', amount: 8000 },
            { classId: 'class-2', amount: 8000 },
            { classId: 'class-3', amount: 8000 },
            { classId: 'class-4', amount: 8000 }
        ]
    }
];

export const initialPayrollItems: PayrollItem[] = [
    {
        id: 'pi-1',
        name: 'House Allowance',
        type: PayrollItemType.Earning,
        category: PayrollItemCategory.Allowance,
        calculationType: CalculationType.Fixed,
        value: 10000,
        isRecurring: true
    },
    {
        id: 'pi-2',
        name: 'Commuter Allowance',
        type: PayrollItemType.Earning,
        category: PayrollItemCategory.Allowance,
        calculationType: CalculationType.Fixed,
        value: 5000,
        isRecurring: true
    },
    {
        id: 'pi-3',
        name: 'NSSF',
        type: PayrollItemType.Deduction,
        category: PayrollItemCategory.Statutory,
        calculationType: CalculationType.Fixed,
        value: 1080,
        isRecurring: true
    }
];

export const initialPayrollHistory: Payroll[] = [
    {
        id: 'pr-1',
        staffId: 'staff-1',
        staffName: 'Alice Teacher',
        month: 'January 2026',
        payDate: '2026-01-28',
        grossPay: 70000,
        totalDeductions: 8500,
        netPay: 61500,
        earnings: [
            { name: 'Basic Salary', amount: 55000 },
            { name: 'House Allowance', amount: 10000 },
            { name: 'Commuter Allowance', amount: 5000 }
        ],
        deductions: [
            { name: 'PAYE', amount: 6000 },
            { name: 'NSSF', amount: 1080 },
            { name: 'SHA', amount: 1420 }
        ]
    }
];

export const initialAnnouncements: Announcement[] = [
    {
        id: 'ann-1',
        title: 'Welcome to Term 1 2026',
        content: 'We welcome all parents, staff, and learners back for an exciting and fruitful academic term!',
        date: '2026-01-05T08:00:00.000Z',
        audience: 'all',
        sentBy: 'Admin User'
    },
    {
        id: 'ann-2',
        title: 'Parent-Teacher Consultations Scheduled',
        content: 'Mid-term consultation meetings will be conducted next Friday starting at 9:00 AM in the main hall.',
        date: '2026-02-10T10:00:00.000Z',
        audience: 'all',
        sentBy: 'Admin User'
    }
];

export const initialCommunicationLogs: CommunicationLog[] = [
    {
        id: 'comm-1',
        studentId: 'stud-1',
        type: 'SMS' as any,
        message: 'Term 1 Fee invoice of KES 35,000 has been sent to your registered email.',
        date: '2026-01-05T14:30:00.000Z',
        sentBy: 'System'
    }
];

export const initialDarajaSettings: DarajaSettings = {
    consumerKey: 'mock_consumer_key',
    consumerSecret: 'mock_consumer_secret',
    shortCode: '174379',
    passkey: 'mock_passkey',
    paybillNumber: '522522',
    environment: 'sandbox'
};

export const initialAssignments: ClassSubjectAssignment[] = [
    { id: 'csa-1', classId: 'class-1', subjectId: 'subj-1', teacherId: 'user-teacher-1' },
    { id: 'csa-2', classId: 'class-1', subjectId: 'subj-2', teacherId: 'user-teacher-1' },
    { id: 'csa-3', classId: 'class-2', subjectId: 'subj-3', teacherId: 'user-teacher-2' },
    { id: 'csa-4', classId: 'class-2', subjectId: 'subj-4', teacherId: 'user-teacher-2' }
];

export const initialTimetable: TimetableEntry[] = [
    { id: 'tt-1', classId: 'class-1', subjectId: 'subj-1', teacherId: 'user-teacher-1', day: 'Monday' as any, startTime: '08:30', endTime: '09:15' },
    { id: 'tt-2', classId: 'class-1', subjectId: 'subj-2', teacherId: 'user-teacher-1', day: 'Monday' as any, startTime: '09:15', endTime: '10:00' },
    { id: 'tt-3', classId: 'class-2', subjectId: 'subj-3', teacherId: 'user-teacher-2', day: 'Tuesday' as any, startTime: '08:30', endTime: '09:15' }
];

export const initialExams: Exam[] = [
    { id: 'exam-1', name: 'Term 1 Opener Exam', date: '2026-01-20', classId: 'class-1', type: ExamType.Traditional },
    { id: 'exam-2', name: 'Term 1 Mid-Term Assessment', date: '2026-02-18', classId: 'class-1', type: ExamType.Traditional }
];

export const initialGrades: Grade[] = [
    { id: 'grd-1', studentId: 'stud-1', examId: 'exam-1', subjectId: 'subj-1', score: 88, comments: 'Excellent problem solving' },
    { id: 'grd-2', studentId: 'stud-1', examId: 'exam-1', subjectId: 'subj-2', score: 82, comments: 'Good reading fluency' },
    { id: 'grd-3', studentId: 'stud-2', examId: 'exam-1', subjectId: 'subj-1', score: 94, comments: 'Outstanding performance' }
];

export const initialAttendance: AttendanceRecord[] = [
    { id: 'att-1', studentId: 'stud-1', classId: 'class-1', date: '2026-02-01', status: AttendanceStatus.Present },
    { id: 'att-2', studentId: 'stud-2', classId: 'class-1', date: '2026-02-01', status: AttendanceStatus.Present },
    { id: 'att-3', studentId: 'stud-3', classId: 'class-2', date: '2026-02-01', status: AttendanceStatus.Present },
    { id: 'att-4', studentId: 'stud-4', classId: 'class-2', date: '2026-02-01', status: AttendanceStatus.Late }
];

export const initialBooks: Book[] = [
    { id: 'bk-1', title: 'Primary Mathematics Grade 1', author: 'Kenya Institute of Curriculum', isbn: '978-9966-001', category: 'Mathematics', totalQuantity: 40, availableQuantity: 38, shelfLocation: 'A1-04' },
    { id: 'bk-2', title: 'Integrated Science Basics', author: 'Oxford Press', isbn: '978-9966-002', category: 'Science', totalQuantity: 30, availableQuantity: 28, shelfLocation: 'B2-12' },
    { id: 'bk-3', title: 'Story of the Savannah', author: 'Ngugi wa Thiong\'o', isbn: '978-9966-003', category: 'Fiction', totalQuantity: 25, availableQuantity: 24, shelfLocation: 'C3-01' }
];

export const initialSchools: SubscriberSchool[] = [
    {
        id: 'school-1',
        name: 'Springfield Elementary',
        slug: 'springfield-elementary',
        schoolCode: 'SPE',
        email: 'bursar@springfield.edu',
        phone: '+254 700 000 000',
        address: '123 Main St, Academic Ridge, Nairobi',
        logoUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&q=80&w=120',
        plan: SubscriptionPlan.PREMIUM,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        startDate: '2025-01-01',
        endDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
        studentCount: 120,
        staffCount: 14,
        billingCycle: 'ANNUALLY',
        lastPaymentDate: '2025-01-15',
        lastPaymentAmount: 60000,
        remindersCount: 0
    },
    {
        id: 'school-2',
        name: 'Greenfield Academy',
        slug: 'greenfield-academy',
        schoolCode: 'GFA',
        email: 'principal@greenfield.ac.ke',
        phone: '+254 711 223 344',
        address: 'Kilimani Road, Nairobi',
        logoUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=120',
        plan: SubscriptionPlan.PREMIUM,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        startDate: '2025-02-15',
        endDate: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
        studentCount: 240,
        staffCount: 22,
        billingCycle: 'ANNUALLY',
        lastPaymentDate: '2024-02-15',
        lastPaymentAmount: 60000,
        lastReminderDate: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
        remindersCount: 1
    },
    {
        id: 'school-3',
        name: 'Hillcrest International School',
        slug: 'hillcrest-intl',
        schoolCode: 'HIS',
        email: 'accounts@hillcrest.edu',
        phone: '+254 722 334 455',
        address: 'Karen Plains, Nairobi',
        logoUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=120',
        plan: SubscriptionPlan.PREMIUM,
        subscriptionStatus: SubscriptionStatus.PAST_DUE,
        startDate: '2024-03-01',
        endDate: new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0],
        studentCount: 480,
        staffCount: 38,
        billingCycle: 'ANNUALLY',
        lastPaymentDate: '2024-03-01',
        lastPaymentAmount: 60000,
        lastReminderDate: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
        remindersCount: 3,
        autoLockoutGraceDaysRemaining: 8
    },
    {
        id: 'school-4',
        name: 'St. Jude Preparatory',
        slug: 'st-jude-prep',
        schoolCode: 'SJP',
        email: 'admin@stjudeprep.sc.ke',
        phone: '+254 733 445 566',
        address: 'Eldoret Bypass, Uasin Gishu',
        logoUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=120',
        plan: SubscriptionPlan.BASIC,
        subscriptionStatus: SubscriptionStatus.SUSPENDED,
        startDate: '2024-01-10',
        endDate: new Date(Date.now() - 18 * 86400000).toISOString().split('T')[0],
        studentCount: 95,
        staffCount: 9,
        billingCycle: 'MONTHLY',
        lastPaymentDate: '2024-01-10',
        lastPaymentAmount: 5000,
        lastReminderDate: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0],
        remindersCount: 7,
        autoLockoutGraceDaysRemaining: 0
    },
    {
        id: 'school-5',
        name: 'Nairobi Apex Academy',
        slug: 'nairobi-apex',
        schoolCode: 'NAA',
        email: 'info@nairobiapex.co.ke',
        phone: '+254 744 556 677',
        address: 'Westlands Commercial Hub, Nairobi',
        logoUrl: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&q=80&w=120',
        plan: SubscriptionPlan.BASIC,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        startDate: '2025-01-10',
        endDate: new Date(Date.now() + 110 * 86400000).toISOString().split('T')[0],
        studentCount: 180,
        staffCount: 16,
        billingCycle: 'ANNUALLY',
        lastPaymentDate: '2025-01-10',
        lastPaymentAmount: 30000,
        remindersCount: 0
    }
];

export const initialSaasInvoices: SaasInvoice[] = [
    {
        id: 'inv-saas-1',
        invoiceNumber: 'INV-SAAS-2025-001',
        schoolId: 'school-1',
        schoolName: 'Springfield Elementary',
        schoolCode: 'SPE',
        recipientEmail: 'bursar@springfield.edu',
        recipientPhone: '+254 700 000 000',
        plan: SubscriptionPlan.PREMIUM,
        billingCycle: 'ANNUALLY',
        amount: 60000,
        currency: 'KES',
        issueDate: '2025-01-05',
        dueDate: '2025-01-15',
        status: 'PAID',
        paidDate: '2025-01-15',
        transactionRef: 'QKD872619H',
        notes: 'Annual SaaS Enterprise subscription with multi-campus and biometric SMS add-on.'
    },
    {
        id: 'inv-saas-2',
        invoiceNumber: 'INV-SAAS-2025-002',
        schoolId: 'school-5',
        schoolName: 'Nairobi Apex Academy',
        schoolCode: 'NAA',
        recipientEmail: 'info@nairobiapex.co.ke',
        recipientPhone: '+254 744 556 677',
        plan: SubscriptionPlan.BASIC,
        billingCycle: 'ANNUALLY',
        amount: 30000,
        currency: 'KES',
        issueDate: '2025-01-02',
        dueDate: '2025-01-10',
        status: 'PAID',
        paidDate: '2025-01-10',
        transactionRef: 'NCBA-TXN-8841',
        notes: 'Basic Annual License for primary level management.'
    },
    {
        id: 'inv-saas-3',
        invoiceNumber: 'INV-SAAS-2025-003',
        schoolId: 'school-2',
        schoolName: 'Greenfield Academy',
        schoolCode: 'GFA',
        recipientEmail: 'principal@greenfield.ac.ke',
        recipientPhone: '+254 711 223 344',
        plan: SubscriptionPlan.PREMIUM,
        billingCycle: 'ANNUALLY',
        amount: 60000,
        currency: 'KES',
        issueDate: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
        status: 'ISSUED',
        notes: 'Upcoming renewal. 5-day pre-expiry reminder dispatched.'
    },
    {
        id: 'inv-saas-4',
        invoiceNumber: 'INV-SAAS-2025-004',
        schoolId: 'school-3',
        schoolName: 'Hillcrest International School',
        schoolCode: 'HIS',
        recipientEmail: 'accounts@hillcrest.edu',
        recipientPhone: '+254 722 334 455',
        plan: SubscriptionPlan.PREMIUM,
        billingCycle: 'ANNUALLY',
        amount: 60000,
        currency: 'KES',
        issueDate: new Date(Date.now() - 20 * 86400000).toISOString().split('T')[0],
        dueDate: new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0],
        status: 'OVERDUE',
        notes: 'In 14-day grace period. Account will lock out in 8 days if unsettled.'
    },
    {
        id: 'inv-saas-5',
        invoiceNumber: 'INV-SAAS-2025-005',
        schoolId: 'school-4',
        schoolName: 'St. Jude Preparatory',
        schoolCode: 'SJP',
        recipientEmail: 'admin@stjudeprep.sc.ke',
        recipientPhone: '+254 733 445 566',
        plan: SubscriptionPlan.BASIC,
        billingCycle: 'MONTHLY',
        amount: 5000,
        currency: 'KES',
        issueDate: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
        dueDate: new Date(Date.now() - 18 * 86400000).toISOString().split('T')[0],
        status: 'OVERDUE',
        notes: 'EXCEEDED 14-DAY GRACE PERIOD: Account disabled until settlement.'
    }
];

export const initialSaasReceipts: SaasReceipt[] = [
    {
        id: 'rec-saas-1',
        receiptNumber: 'REC-SAAS-2025-001',
        invoiceId: 'inv-saas-1',
        invoiceNumber: 'INV-SAAS-2025-001',
        schoolId: 'school-1',
        schoolName: 'Springfield Elementary',
        amount: 60000,
        currency: 'KES',
        paymentDate: '2025-01-15',
        paymentMethod: 'Lipa Na M-Pesa',
        transactionCode: 'QKD872619H',
        plan: SubscriptionPlan.PREMIUM,
        provisionedUntil: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
        verifiedBy: 'Platform Super Administrator'
    },
    {
        id: 'rec-saas-2',
        receiptNumber: 'REC-SAAS-2025-002',
        invoiceId: 'inv-saas-2',
        invoiceNumber: 'INV-SAAS-2025-002',
        schoolId: 'school-5',
        schoolName: 'Nairobi Apex Academy',
        amount: 30000,
        currency: 'KES',
        paymentDate: '2025-01-10',
        paymentMethod: 'Bank Wire (NCBA)',
        transactionCode: 'NCBA-TXN-8841',
        plan: SubscriptionPlan.BASIC,
        provisionedUntil: new Date(Date.now() + 110 * 86400000).toISOString().split('T')[0],
        verifiedBy: 'Platform Super Administrator'
    }
];

// Helper to load or initialize LocalStorage store
const STORAGE_KEY = 'saaslink_app_data_v1';

export interface AppMockStore {
    schoolInfo: SchoolInfo;
    pricing: PlatformPricing;
    exchangeRates: Record<string, number>;
    users: User[];
    students: Student[];
    classes: SchoolClass[];
    subjects: Subject[];
    assignments: ClassSubjectAssignment[];
    timetable: TimetableEntry[];
    exams: Exam[];
    grades: Grade[];
    attendance: AttendanceRecord[];
    staff: Staff[];
    payrollItems: PayrollItem[];
    payrollHistory: Payroll[];
    transactions: Transaction[];
    expenses: Expense[];
    announcements: Announcement[];
    communicationLogs: CommunicationLog[];
    gradingScale: GradingRule[];
    feeStructure: FeeItem[];
    darajaSettings: DarajaSettings;
    books: Book[];
    schools: SubscriberSchool[];
    saasInvoices: SaasInvoice[];
    saasReceipts: SaasReceipt[];
}

export const getInitialMockStore = (): AppMockStore => ({
    schoolInfo: { ...initialSchoolInfo },
    pricing: { ...initialPricing },
    exchangeRates: { ...EXCHANGE_RATES },
    users: [...initialUsers],
    students: [...initialStudents],
    classes: [...initialClasses],
    subjects: [...initialSubjects],
    assignments: [...initialAssignments],
    timetable: [...initialTimetable],
    exams: [...initialExams],
    grades: [...initialGrades],
    attendance: [...initialAttendance],
    staff: [...initialStaff],
    payrollItems: [...initialPayrollItems],
    payrollHistory: [...initialPayrollHistory],
    transactions: [...initialTransactions],
    expenses: [...initialExpenses],
    announcements: [...initialAnnouncements],
    communicationLogs: [...initialCommunicationLogs],
    gradingScale: [...initialGradingRules],
    feeStructure: [...initialFeeStructure],
    darajaSettings: { ...initialDarajaSettings },
    books: [...initialBooks],
    schools: [...initialSchools],
    saasInvoices: [...initialSaasInvoices],
    saasReceipts: [...initialSaasReceipts]
});

export const loadMockStore = (): AppMockStore => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            const initial = getInitialMockStore();
            const store: AppMockStore = {
                ...initial,
                ...parsed
            };

            // Ensure subscriber schools are populated
            if (!store.schools || !Array.isArray(store.schools) || store.schools.length === 0) {
                store.schools = [...initialSchools];
            }

            // Ensure saasInvoices are populated
            if (!store.saasInvoices || !Array.isArray(store.saasInvoices) || store.saasInvoices.length === 0) {
                store.saasInvoices = [...initialSaasInvoices];
            }

            // Ensure saasReceipts are populated
            if (!store.saasReceipts || !Array.isArray(store.saasReceipts) || store.saasReceipts.length === 0) {
                store.saasReceipts = [...initialSaasReceipts];
            }

            // Ensure students collection is populated
            if (!store.students || !Array.isArray(store.students) || store.students.length === 0) {
                store.students = [...initialStudents];
            } else {
                // Ensure class display name is present on every student
                store.students = store.students.map(s => {
                    if (!s.class && s.classId) {
                        const c = (store.classes || initialClasses).find(cl => cl.id === s.classId);
                        if (c) return { ...s, class: c.name };
                    }
                    return s;
                });
            }

            // Ensure transactions collection is populated and matched with student names
            if (!store.transactions || !Array.isArray(store.transactions) || store.transactions.length === 0) {
                store.transactions = [...initialTransactions];
            } else {
                store.transactions = store.transactions.map(t => {
                    if (!t.studentName || t.studentName === 'Unassigned' || t.studentName === 'General Student') {
                        const s = store.students.find(stud => stud.id === t.studentId);
                        if (s) return { ...t, studentName: s.name };
                    }
                    return t;
                });
            }

            // Ensure expenses collection is populated
            if (!store.expenses || !Array.isArray(store.expenses) || store.expenses.length === 0) {
                store.expenses = [...initialExpenses];
            }

            // Ensure all student guardians have corresponding Parent accounts in store.users
            if (store.students && Array.isArray(store.students)) {
                if (!store.users) store.users = [...initialUsers];
                store.students.forEach(st => {
                    if (st.guardianEmail) {
                        const gEmail = st.guardianEmail.toLowerCase().trim();
                        const exists = store.users.some(u => u.email.toLowerCase() === gEmail);
                        if (!exists) {
                            store.users.push({
                                id: `user-parent-${st.id}`,
                                name: st.guardianName || `Guardian of ${st.name}`,
                                email: gEmail,
                                role: Role.Parent,
                                status: 'Active',
                                avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120',
                                schoolId: store.schoolInfo?.id || 'school-1'
                            });
                        }
                    }
                });
            }

            return store;
        }
    } catch {
        // Ignore JSON/storage errors and return default
    }
    const store = getInitialMockStore();
    saveMockStore(store);
    return store;
};

export const saveMockStore = (store: AppMockStore) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
        // LocalStorage quota or access denied
    }
};
