
import React, { createContext, useState, useEffect, useMemo, useContext, useCallback } from 'react';
import * as api from '../services/api';
import { Role } from '../types';
import type { 
    User, Student, Staff, Transaction, Expense, Payroll, Subject, SchoolClass, ClassSubjectAssignment, 
    TimetableEntry, Exam, Grade, AttendanceRecord, SchoolEvent, SchoolInfo, GradingRule, FeeItem, 
    CommunicationLog, Announcement, PayrollItem, DarajaSettings, MpesaC2BTransaction, 
    Notification, NewStudent, NewStaff, NewTransaction, NewExpense, NewPayrollItem, NewAnnouncement, 
    NewCommunicationLog, NewUser, NewGradingRule, NewFeeItem, UpdateSchoolInfoDto, Book, NewBook, IssueBookData, LibraryTransaction
} from '../types';
import { NAVIGATION_ITEMS, TEACHER_NAVIGATION_ITEMS, PARENT_NAVIGATION_ITEMS, SUPER_ADMIN_NAVIGATION_ITEMS } from '../constants';
import type { NavItem } from '../constants';
import IDCardModal from '../components/common/IDCardModal';
import { connectSocket, disconnectSocket } from '../services/socket';

interface IDataContext {
    // State
    isLoading: boolean;
    isOffline: boolean;
    schoolInfo: SchoolInfo | null;
    currentUser: User | null;
    activeView: string;
    
    // Core Configuration Data (Kept in Context)
    users: User[];
    students: Student[]; // Lightweight student list
    staff: Staff[];
    subjects: Subject[];
    classes: SchoolClass[];
    classSubjectAssignments: ClassSubjectAssignment[];
    timetableEntries: TimetableEntry[];
    exams: Exam[];
    gradingScale: GradingRule[];
    feeStructure: FeeItem[];
    payrollItems: PayrollItem[];
    announcements: Announcement[]; 
    darajaSettings: DarajaSettings | null;

    // Derived or Contextual Data
    notifications: Notification[];
    assignedClass: SchoolClass | null;
    parentChildren: Student[];
    selectedChild: Student | null;

    // UI State
    isSidebarCollapsed: boolean;
    isMobileSidebarOpen: boolean;
    setIsSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
    setIsMobileSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
    
    // Setters
    setActiveView: React.Dispatch<React.SetStateAction<string>>;
    setSelectedChild: React.Dispatch<React.SetStateAction<Student | null>>;
    
    // Action Functions
    addNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
    handleLogin: (user: User, token: string) => void;
    handleLogout: () => void;
    getNavigationItems: () => NavItem[];
    openIdCardModal: (person: Student | Staff, type: 'student' | 'staff') => void;
    
    // API Wrappers (Call API directly, minimal state update)
    addStudent: (studentData: NewStudent) => Promise<Student>;
    updateStudent: (studentId: string, updates: Partial<Student>) => Promise<Student>;
    deleteStudent: (studentId: string) => Promise<void>;
    updateMultipleStudents: (updates: Array<Partial<Student> & { id: string }>) => Promise<Student[]>;
    
    addTransaction: (transactionData: NewTransaction) => Promise<Transaction>;
    addMultipleTransactions: (transactionsData: NewTransaction[]) => Promise<Transaction[]>;
    deleteTransaction: (id: string) => Promise<void>;

    addExpense: (expenseData: NewExpense) => Promise<Expense>;
    deleteExpense: (id: string) => Promise<void>;
    refetchExpenses: () => void; // Deprecated placeholder

    addStaff: (staffData: NewStaff) => Promise<Staff>;
    updateStaff: (staffId: string, updates: Partial<Staff>) => Promise<Staff>;
    savePayrollRun: (payrollData: Payroll[]) => Promise<Payroll[]>;
    addPayrollItem: (itemData: NewPayrollItem) => Promise<PayrollItem>;
    updatePayrollItem: (itemId: string, updates: Partial<PayrollItem>) => Promise<void>;
    deletePayrollItem: (itemId: string) => Promise<void>;
    
    updateSchoolInfo: (info: UpdateSchoolInfoDto) => Promise<void>;
    uploadLogo: (formData: FormData) => Promise<void>;
    addUser: (userData: NewUser) => Promise<User>;
    updateUser: (userId: string, updates: Partial<User>) => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;
    updateUserProfile: (data: Partial<User>) => Promise<User>;
    uploadUserAvatar: (formData: FormData) => Promise<{ avatarUrl: string }>;
    
    addGradingRule: (ruleData: NewGradingRule) => Promise<GradingRule>;
    updateGradingRule: (ruleId: string, updates: Partial<GradingRule>) => Promise<void>;
    deleteGradingRule: (ruleId: string) => Promise<void>;
    
    addFeeItem: (itemData: NewFeeItem) => Promise<FeeItem>;
    updateFeeItem: (itemId: string, updates: Partial<FeeItem>) => Promise<void>;
    deleteFeeItem: (itemId: string) => Promise<void>;
    
    updateDarajaSettings: (settings: DarajaSettings) => Promise<void>;

    addAnnouncement: (data: NewAnnouncement) => Promise<Announcement>;
    addCommunicationLog: (data: NewCommunicationLog) => Promise<CommunicationLog>;
    addBulkCommunicationLogs: (data: NewCommunicationLog[]) => Promise<CommunicationLog[]>;

    // Library
    books: Book[];
    libraryTransactions: LibraryTransaction[];
    addBook: (book: NewBook) => Promise<Book>;
    updateBook: (id: string, updates: Partial<Book>) => Promise<Book>;
    deleteBook: (id: string) => Promise<void>;
    issueBook: (data: IssueBookData) => Promise<LibraryTransaction>;
    returnBook: (transactionId: string) => Promise<LibraryTransaction>;

    // Batch update actions
    updateClasses: (data: SchoolClass[]) => Promise<void>;
    updateSubjects: (data: Subject[]) => Promise<void>;
    updateAssignments: (data: ClassSubjectAssignment[]) => Promise<void>;
    updateTimetable: (data: TimetableEntry[]) => Promise<void>;
    updateExams: (data: Exam[]) => Promise<void>;
    updateGrades: (data: Grade[]) => Promise<Grade[]>;
    updateAttendance: (data: AttendanceRecord[]) => Promise<AttendanceRecord[]>;
    updateEvents: (data: SchoolEvent[]) => Promise<SchoolEvent[]>;
    
    studentFinancials: Record<string, { balance: number; overpayment: number; lastPaymentDate: string | null }>;
    
    // Deprecated state placeholders for compatibility
    transactions: Transaction[];
    expenses: Expense[];
    payrollHistory: Payroll[];
    grades: Grade[];
    attendanceRecords: AttendanceRecord[];
    events: SchoolEvent[];
    communicationLogs: CommunicationLog[];
    mpesaC2BTransactions: MpesaC2BTransaction[];
}

const DataContext = createContext<IDataContext | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isOffline, setIsOffline] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [activeView, setActiveView] = useState('dashboard');
    const [assignedClass, setAssignedClass] = useState<SchoolClass | null>(null);
    const [parentChildren, setParentChildren] = useState<Student[]>([]);
    const [selectedChild, setSelectedChild] = useState<Student | null>(null);
    
    // Global Config Data
    const [users, setUsers] = useState<User[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [staff, setStaff] = useState<Staff[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [classSubjectAssignments, setClassSubjectAssignments] = useState<ClassSubjectAssignment[]>([]);
    const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
    const [exams, setExams] = useState<Exam[]>([]);
    const [gradingScale, setGradingScale] = useState<GradingRule[]>([]);
    const [feeStructure, setFeeStructure] = useState<FeeItem[]>([]);
    const [payrollItems, setPayrollItems] = useState<PayrollItem[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
    const [darajaSettings, setDarajaSettings] = useState<DarajaSettings | null>(null);
    
    // Library
    const [books, setBooks] = useState<Book[]>([]);
    const [libraryTransactions, setLibraryTransactions] = useState<LibraryTransaction[]>([]);

    const [notifications, setNotifications] = useState<Notification[]>([]);
    
    // UI State
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isIdCardModalOpen, setIsIdCardModalOpen] = useState(false);
    const [idCardData, setIdCardData] = useState<{ type: 'student' | 'staff', data: Student | Staff } | null>(null);

    const addNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);
        setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
    }, []);
    
    const handleLogout = useCallback(() => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        setCurrentUser(null);
        disconnectSocket();
        setUsers([]);
        setSubjects([]);
        setClasses([]);
        setAnnouncements([]);
    }, []);

    const loadAuthenticatedData = useCallback(async (user: User) => {
        try {
            setIsOffline(false);
            if (user.role === Role.SuperAdmin) return;

            // Fetch lightweight config data only
            const results = await api.fetchInitialData(user.role);
            
            const getValue = (index: number, defaultVal: any = []) => 
                results[index].status === 'fulfilled' ? (results[index] as PromiseFulfilledResult<any>).value : defaultVal;

            setUsers(getValue(0));
            setSubjects(getValue(1));
            setClasses(getValue(2));
            setClassSubjectAssignments(getValue(3));
            setGradingScale(getValue(4));
            setFeeStructure(getValue(5));
            setPayrollItems(getValue(6));
            
            const info = getValue(7, null);
            if (info) setSchoolInfo(info);
            setDarajaSettings(getValue(8, null));
            
            // Fetch students list (lightweight mode)
            setStudents(getValue(9, []));
            setStaff(getValue(10, []));
            
            // Separate fetch for Announcements to keep header updated
            api.getAnnouncements().then(setAnnouncements).catch(() => {});
            
            // Library Data (Small enough for now)
            api.getBooks().then(setBooks).catch(() => {});
            api.getLibraryTransactions().then(setLibraryTransactions).catch(() => {});

            if (user.role === Role.Teacher) {
                const cls = (getValue(2) as SchoolClass[]).find(c => c.formTeacherId === user.id);
                setAssignedClass(cls || null);
            } else if (user.role === Role.Parent) {
                // If parent, students list might be empty, so fetch specifically for parent
                const childrenRes = await api.getStudents({ search: user.email });
                setParentChildren(childrenRes.data);
            }

        } catch (e) {
            console.error("Data load error", e);
            setIsOffline(true);
            addNotification("Cannot connect to server. Running in offline mode.", "error");
        }
    }, [addNotification]);

    useEffect(() => {
        const checkSession = async () => {
            const token = localStorage.getItem('authToken');
            const userJson = localStorage.getItem('currentUser');
            if (token && userJson) {
                try {
                    const user = JSON.parse(userJson);
                    setCurrentUser(user);
                    setIsLoading(true);
                    await loadAuthenticatedData(user);
                    connectSocket();
                } catch (error) {
                    handleLogout();
                }
            } else {
                try {
                    const info = await api.getPublicSchoolInfo();
                    setSchoolInfo(info);
                    setIsOffline(false);
                } catch (error) {
                    setIsOffline(true);
                }
            }
            setIsLoading(false);
        };
        checkSession();
    }, [handleLogout, addNotification, loadAuthenticatedData]);
    
    const handleLogin = useCallback((user: User, token: string) => {
        localStorage.setItem('authToken', token);
        localStorage.setItem('currentUser', JSON.stringify(user));
        setCurrentUser(user);
        setIsLoading(true);
        loadAuthenticatedData(user).then(() => setIsLoading(false));
        connectSocket();
        
        if (user.role === Role.SuperAdmin) setActiveView('super_admin_dashboard');
        else if (user.role === Role.Teacher) setActiveView('teacher_dashboard');
        else if (user.role === Role.Parent) setActiveView('parent_dashboard');
        else setActiveView('dashboard');
    }, [loadAuthenticatedData]);

    // API Actions - Wrappers around API calls
    const addStudent = async (data: NewStudent) => {
        const res = await api.createStudent(data);
        setStudents(prev => [...prev, res].sort((a,b) => a.name.localeCompare(b.name)));
        return res;
    }
    const updateStudent = async (id: string, data: Partial<Student>) => {
        const res = await api.updateStudent(id, data);
        setStudents(prev => prev.map(s => s.id === id ? res : s));
        return res;
    }
    const deleteStudent = async (id: string) => {
        await api.deleteStudent(id);
        setStudents(prev => prev.filter(s => s.id !== id));
    }
    const updateMultipleStudents = async (updates: any) => await api.updateMultipleStudents(updates);
    
    // Transactions - No longer updates global state
    const addTransaction = async (data: NewTransaction) => await api.createTransaction(data);
    const deleteTransaction = async (id: string) => await api.deleteTransaction(id);
    const addMultipleTransactions = async (data: NewTransaction[]) => await api.createMultipleTransactions(data);
    
    // Expenses - No longer updates global state
    const addExpense = async (data: NewExpense) => await api.createExpense(data);
    const deleteExpense = async (id: string) => await api.deleteExpense(id);
    const refetchExpenses = () => {}; // Placeholder
    
    const addStaff = async (data: NewStaff) => { const res = await api.createStaff(data); setStaff(prev => [...prev, res]); return res; }
    const updateStaff = async (id: string, data: Partial<Staff>) => { const res = await api.updateStaff(id, data); setStaff(prev => prev.map(s => s.id === id ? res : s)); return res; }
    
    const savePayrollRun = async (data: Payroll[]) => await api.savePayrollRun(data);
    
    const createApiAction = <P, S>(setter: React.Dispatch<React.SetStateAction<S[]>>, apiFn: (data: P) => Promise<S>) => 
        useCallback(async (data: P) => {
            const newItem = await apiFn(data);
            setter(prev => [...prev, newItem]);
            return newItem;
        }, [setter]);

    const updateApiAction = <P extends {id: string}, S extends {id: string}>(setter: React.Dispatch<React.SetStateAction<S[]>>, apiFn: (id: string, data: Partial<P>) => Promise<S>) =>
        useCallback(async (id: string, data: Partial<P>) => {
            const updatedItem = await apiFn(id, data);
            setter(prev => prev.map(item => item.id === id ? updatedItem : item));
        }, [setter]);
    
    const deleteApiAction = (setter: React.Dispatch<React.SetStateAction<any[]>>, apiFn: (id: string) => Promise<void>) =>
        useCallback(async (id: string) => {
            await apiFn(id);
            setter(prev => prev.filter(item => item.id !== id));
        }, [setter]);

    const addUser = createApiAction(setUsers, api.createUser);
    const updateUser = updateApiAction(setUsers, api.updateUser);
    const deleteUser = deleteApiAction(setUsers, api.deleteUser);
    const updateUserProfile = async (data: Partial<User>) => {
        const updated = await api.updateUserProfile(data);
        setCurrentUser(updated);
        localStorage.setItem('currentUser', JSON.stringify(updated));
        return updated;
    };
    const uploadUserAvatar = api.uploadUserAvatar;

    const addPayrollItem = createApiAction(setPayrollItems, api.createPayrollItem);
    const updatePayrollItem = updateApiAction(setPayrollItems, api.updatePayrollItem);
    const deletePayrollItem = deleteApiAction(setPayrollItems, api.deletePayrollItem);
    
    const addGradingRule = createApiAction(setGradingScale, api.createGradingRule);
    const updateGradingRule = updateApiAction(setGradingScale, api.updateGradingRule);
    const deleteGradingRule = deleteApiAction(setGradingScale, api.deleteGradingRule);
    
    const addFeeItem = createApiAction(setFeeStructure, api.createFeeItem);
    const updateFeeItem = updateApiAction(setFeeStructure, api.updateFeeItem);
    const deleteFeeItem = deleteApiAction(setFeeStructure, api.deleteFeeItem);
    
    const addAnnouncement = createApiAction(setAnnouncements, api.createAnnouncement);
    // Communication Logs are now handled locally in views
    const addCommunicationLog = async (data: NewCommunicationLog) => await api.createCommunicationLog(data);
    const addBulkCommunicationLogs = async (data: NewCommunicationLog[]) => await api.createBulkCommunicationLogs(data);

    // Settings
    const updateSchoolInfo = useCallback(async (data: UpdateSchoolInfoDto) => { setSchoolInfo(await api.updateSchoolInfo(data)); }, []);
    const uploadLogo = useCallback(async (formData: FormData) => { 
        const { logoUrl } = await api.uploadLogo(formData); 
        setSchoolInfo(prev => prev ? { ...prev, logoUrl } : null);
    }, []);
    const updateDarajaSettings = useCallback(async (data: DarajaSettings) => { setDarajaSettings(await api.updateDarajaSettings(data)); }, []);

    // Library
    const addBook = createApiAction(setBooks, api.createBook);
    const updateBook = updateApiAction(setBooks, api.updateBook);
    const deleteBook = deleteApiAction(setBooks, api.deleteBook);
    const issueBook = async (data: IssueBookData) => { const res = await api.issueBook(data); setLibraryTransactions(prev => [res, ...prev]); return res; }
    const returnBook = async (id: string) => { const res = await api.returnBook(id); setLibraryTransactions(prev => prev.map(t => t.id === id ? res : t)); return res; }
    
    // Batch Updates
    const createBatchUpdateAction = (setter: Function, apiFn: Function) => useCallback(async (data: any[]) => { const result = await apiFn(data); setter(result); }, [setter, apiFn]);
    const updateClasses = createBatchUpdateAction(setClasses, api.batchUpdateClasses);
    const updateSubjects = createBatchUpdateAction(setSubjects, api.batchUpdateSubjects);
    const updateAssignments = createBatchUpdateAction(setClassSubjectAssignments, api.batchUpdateAssignments);
    const updateTimetable = createBatchUpdateAction(setTimetableEntries, api.batchUpdateTimetable);
    const updateExams = createBatchUpdateAction(setExams, api.batchUpdateExams);
    // Grades, Attendance, Events moved to local view fetching to save memory
    const updateGrades = async (data: Grade[]) => await api.batchUpdateGrades(data);
    const updateAttendance = async (data: AttendanceRecord[]) => await api.batchUpdateAttendance(data);
    const updateEvents = async (data: SchoolEvent[]) => await api.batchUpdateEvents(data);

    const getNavigationItems = useCallback(() => {
        if (currentUser?.role === Role.SuperAdmin) return SUPER_ADMIN_NAVIGATION_ITEMS;
        if (currentUser?.role === Role.Teacher) return TEACHER_NAVIGATION_ITEMS;
        if (currentUser?.role === Role.Parent) return PARENT_NAVIGATION_ITEMS;
        return NAVIGATION_ITEMS;
    }, [currentUser]);

    const openIdCardModal = useCallback((person: Student | Staff, type: 'student' | 'staff') => {
        setIdCardData({ type, data: person });
        setIsIdCardModalOpen(true);
    }, []);
    
    // Mock for compatibility - Removed from context logic but kept to avoid immediate TS break in unrefactored components
    const studentFinancials = useMemo(() => ({}), []); 

    const value: IDataContext = {
        isLoading, isOffline, schoolInfo, currentUser, activeView, users, students, staff, subjects, classes, classSubjectAssignments, timetableEntries, exams, gradingScale, feeStructure, payrollItems, darajaSettings, announcements, notifications, assignedClass, parentChildren, selectedChild,
        isSidebarCollapsed, isMobileSidebarOpen, setIsSidebarCollapsed, setIsMobileSidebarOpen, setActiveView, setSelectedChild, addNotification, handleLogin, handleLogout, getNavigationItems, openIdCardModal, 
        addStudent, updateStudent, deleteStudent, updateMultipleStudents, 
        addTransaction, addMultipleTransactions, deleteTransaction, 
        addExpense, deleteExpense, refetchExpenses,
        addStaff, updateStaff, savePayrollRun, addPayrollItem, updatePayrollItem, deletePayrollItem, 
        updateSchoolInfo, uploadLogo, addUser, updateUser, deleteUser, updateUserProfile, uploadUserAvatar,
        addGradingRule, updateGradingRule, deleteGradingRule, 
        addFeeItem, updateFeeItem, deleteFeeItem, 
        updateDarajaSettings, 
        addAnnouncement, addCommunicationLog, addBulkCommunicationLogs, 
        books, libraryTransactions, addBook, updateBook, deleteBook, issueBook, returnBook,
        updateClasses, updateSubjects, updateAssignments, updateTimetable, updateExams, updateGrades, updateAttendance, updateEvents,
        studentFinancials,
        // Empty Arrays for removed items to satisfy type
        transactions: [], expenses: [], payrollHistory: [], grades: [], attendanceRecords: [], events: [], communicationLogs: [], mpesaC2BTransactions: []
    };

    return (
        <DataContext.Provider value={value}>
            {children}
            {schoolInfo && (
                 <IDCardModal
                    isOpen={isIdCardModalOpen}
                    onClose={() => setIsIdCardModalOpen(false)}
                    data={idCardData}
                    schoolInfo={schoolInfo}
                />
            )}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
