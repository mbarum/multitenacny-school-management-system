
import React, { createContext, useState, useEffect, useMemo, useContext, useCallback } from 'react';
import * as api from '../services/api';
import { Role } from '../types';
import type { 
    User, Student, Staff, Transaction, Expense, Payroll, Subject, SchoolClass, ClassSubjectAssignment, 
    TimetableEntry, Exam, Grade, AttendanceRecord, SchoolEvent, SchoolInfo, GradingRule, FeeItem, 
    CommunicationLog, Announcement, PayrollItem, DarajaSettings, MpesaC2BTransaction, 
    Notification, NewStudent, NewStaff, NewTransaction, NewExpense, NewPayrollItem, NewAnnouncement, 
    NewCommunicationLog, NewUser, NewGradingRule, NewFeeItem, UpdateSchoolInfoDto, Book, NewBook, LibraryTransaction, IssueBookData
} from '../types';
import { NAVIGATION_ITEMS, TEACHER_NAVIGATION_ITEMS, PARENT_NAVIGATION_ITEMS, SUPER_ADMIN_NAVIGATION_ITEMS } from '../constants';
import type { NavItem } from '../constants';
import IDCardModal from '../components/common/IDCardModal';
import { connectSocket, disconnectSocket, getSocket } from '../services/socket';

interface IDataContext {
    // State
    isLoading: boolean;
    isOffline: boolean; // New Flag
    schoolInfo: SchoolInfo | null;
    currentUser: User | null;
    activeView: string;
    users: User[];
    students: Student[];
    transactions: Transaction[];
    expenses: Expense[];
    staff: Staff[];
    payrollHistory: Payroll[];
    subjects: Subject[];
    classes: SchoolClass[];
    classSubjectAssignments: ClassSubjectAssignment[];
    timetableEntries: TimetableEntry[];
    exams: Exam[];
    grades: Grade[];
    attendanceRecords: AttendanceRecord[];
    events: SchoolEvent[];
    gradingScale: GradingRule[];
    feeStructure: FeeItem[];
    communicationLogs: CommunicationLog[];
    announcements: Announcement[];
    payrollItems: PayrollItem[];
    darajaSettings: DarajaSettings | null;
    mpesaC2BTransactions: MpesaC2BTransaction[];
    notifications: Notification[];
    assignedClass: SchoolClass | null;
    parentChildren: Student[];
    selectedChild: Student | null;
    books: Book[];
    libraryTransactions: LibraryTransaction[];

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
    
    // Granular Actions
    addStudent: (studentData: NewStudent) => Promise<Student>;
    updateStudent: (studentId: string, updates: Partial<Student>) => Promise<void>;
    deleteStudent: (studentId: string) => Promise<void>;
    updateMultipleStudents: (updates: Array<Partial<Student> & { id: string }>) => Promise<void>;
    
    addTransaction: (transactionData: NewTransaction) => Promise<Transaction>;
    addMultipleTransactions: (transactionsData: NewTransaction[]) => Promise<void>;
    deleteTransaction: (id: string) => Promise<void>;

    addExpense: (expenseData: NewExpense) => Promise<Expense>;
    deleteExpense: (id: string) => Promise<void>;
    refetchExpenses: () => void;

    addStaff: (staffData: NewStaff) => Promise<Staff>;
    updateStaff: (staffId: string, updates: Partial<Staff>) => Promise<void>;
    savePayrollRun: (payrollData: Payroll[]) => Promise<void>;
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
    addBulkCommunicationLogs: (data: NewCommunicationLog[]) => Promise<void>;

    // Library
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
    updateGrades: (data: Grade[]) => Promise<void>;
    updateAttendance: (data: AttendanceRecord[]) => Promise<void>;
    updateEvents: (data: SchoolEvent[]) => Promise<void>;
    
    studentFinancials: Record<string, { balance: number; overpayment: number; lastPaymentDate: string | null }>;
}

const DataContext = createContext<IDataContext | undefined>(undefined);

const clearAllData = (setters: any) => {
    Object.values(setters).forEach((setter: any) => setter([]));
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isOffline, setIsOffline] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [activeView, setActiveView] = useState('dashboard');
    const [assignedClass, setAssignedClass] = useState<SchoolClass | null>(null);
    const [parentChildren, setParentChildren] = useState<Student[]>([]);
    const [selectedChild, setSelectedChild] = useState<Student | null>(null);
    
    // All data states
    const [users, setUsers] = useState<User[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [staff, setStaff] = useState<Staff[]>([]);
    const [payrollHistory, setPayrollHistory] = useState<Payroll[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [classSubjectAssignments, setClassSubjectAssignments] = useState<ClassSubjectAssignment[]>([]);
    const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
    const [exams, setExams] = useState<Exam[]>([]);
    const [grades, setGrades] = useState<Grade[]>([]);
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
    const [events, setEvents] = useState<SchoolEvent[]>([]);
    const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
    const [gradingScale, setGradingScale] = useState<GradingRule[]>([]);
    const [feeStructure, setFeeStructure] = useState<FeeItem[]>([]);
    const [communicationLogs, setCommunicationLogs] = useState<CommunicationLog[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [payrollItems, setPayrollItems] = useState<PayrollItem[]>([]);
    const [darajaSettings, setDarajaSettings] = useState<DarajaSettings | null>(null);
    const [mpesaC2BTransactions, setMpesaC2BTransactions] = useState<MpesaC2BTransaction[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [books, setBooks] = useState<Book[]>([]);
    const [libraryTransactions, setLibraryTransactions] = useState<LibraryTransaction[]>([]);
    
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
        // Clear all sensitive data
        const setters = { setUsers, setStudents, setTransactions, setExpenses, setStaff, setPayrollHistory, setSubjects, setClasses, setClassSubjectAssignments, setTimetableEntries, setExams, setGrades, setAttendanceRecords, setEvents, setGradingScale, setFeeStructure, setCommunicationLogs, setAnnouncements, setPayrollItems, setDarajaSettings, setBooks, setLibraryTransactions };
        clearAllData(setters);
    }, []);

    const loadAuthenticatedData = useCallback(async (user: User) => {
        try {
            setIsOffline(false);
            if (user.role === Role.SuperAdmin) {
                // Super Admin likely fetches data on demand in specific views
                return; 
            }

            const results = await api.fetchInitialData();
            
            // Helper to safely extract data from Promise.allSettled
            const getValue = (index: number, defaultVal: any = []) => 
                results[index].status === 'fulfilled' ? (results[index] as PromiseFulfilledResult<any>).value : defaultVal;

            setUsers(getValue(0));
            // Students are paginated, this initial fetch might return the first page or minimal list
            const studentData = getValue(1); 
            setStudents(Array.isArray(studentData) ? studentData : studentData.data || []);
            
            setSubjects(getValue(2));
            setClasses(getValue(3));
            setClassSubjectAssignments(getValue(4));
            setTimetableEntries(getValue(5));
            setExams(getValue(6));
            
            setEvents(getValue(7));
            setGradingScale(getValue(8));
            setFeeStructure(getValue(9));
            setPayrollItems(getValue(10));
            
            setAnnouncements(getValue(11));
            
            setSchoolInfo(getValue(12, null));
            setDarajaSettings(getValue(13, null));
            
            // Populate contextual data
            if (user.role === Role.Teacher) {
                const cls = (getValue(3) as SchoolClass[]).find(c => c.formTeacherId === user.id);
                setAssignedClass(cls || null);
            } else if (user.role === Role.Parent) {
                const childrenRes = await api.getStudents({ search: user.email }); // Assuming email match
                setParentChildren(childrenRes.data);
            }

            // Fetch Staff and Expenses separately as they are important for initial view
            api.getStaff().then(setStaff);
            api.getExpenses().then(setExpenses);
            api.getBooks().then(setBooks);
            api.getLibraryTransactions().then(setLibraryTransactions);

        } catch (e) {
            console.error("Data load error", e);
            setIsOffline(true);
            addNotification("Cannot connect to server. Running in offline mode.", "error");
        }
    }, [addNotification]);

    // Effect to check for an existing session on app load
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
                // A minimal fetch for non-authed view (login page school info)
                try {
                    const info = await api.getSchoolInfo();
                    setSchoolInfo(info);
                    setIsOffline(false);
                } catch (error) {
                    setIsOffline(true);
                    console.error("Could not load school info (public) - Backend likely down");
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

    // API ACTION FUNCTIONS
    
    // Generic Helper
    const createApiAction = <P, S>(setter: React.Dispatch<React.SetStateAction<S[]>>, apiFn: (data: P) => Promise<S>, sortFn?: (a: S, b: S) => number) => 
        useCallback(async (data: P) => {
            const newItem = await apiFn(data);
            setter(prev => {
                const newArr = [newItem, ...prev];
                return sortFn ? newArr.sort(sortFn) : newArr;
            });
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
    
    // Bind actions to state setters
    const addStudent = createApiAction(setStudents, api.createStudent, (a, b) => a.name.localeCompare(b.name));
    const updateStudent = updateApiAction(setStudents, api.updateStudent);
    const deleteStudent = deleteApiAction(setStudents, api.deleteStudent);
    
    const addTransaction = createApiAction(setTransactions, api.createTransaction);
    const deleteTransaction = deleteApiAction(setTransactions, api.deleteTransaction);
    
    const addExpense = createApiAction(setExpenses, api.createExpense);
    const deleteExpense = deleteApiAction(setExpenses, api.deleteExpense);
    const refetchExpenses = useCallback(() => api.getExpenses().then(setExpenses), []);

    const addStaff = createApiAction(setStaff, api.createStaff);
    const updateStaff = updateApiAction(setStaff, api.updateStaff);
    
    const addUser = createApiAction(setUsers, api.createUser);
    const updateUser = updateApiAction(setUsers, api.updateUser);
    const deleteUser = deleteApiAction(setUsers, api.deleteUser);
    const updateUserProfile = useCallback(async (data: Partial<User>) => {
        const updated = await api.updateUserProfile(data);
        setCurrentUser(updated);
        localStorage.setItem('currentUser', JSON.stringify(updated));
        return updated;
    }, []);
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
    const addCommunicationLog = createApiAction(setCommunicationLogs, api.createCommunicationLog);
    
    // Library
    const addBook = createApiAction(setBooks, api.createBook);
    const updateBook = updateApiAction(setBooks, api.updateBook);
    const deleteBook = deleteApiAction(setBooks, api.deleteBook);
    const issueBook = createApiAction(setLibraryTransactions, api.issueBook);
    const returnBook = useCallback(async (transactionId: string) => {
        const updated = await api.returnBook(transactionId);
        setLibraryTransactions(prev => prev.map(t => t.id === transactionId ? updated : t));
        return updated;
    }, []);

    // Non-standard actions
    const updateMultipleStudents = useCallback(async (updates: Array<Partial<Student> & { id: string }>) => {
        const updatedStudents = await api.updateMultipleStudents(updates);
        setStudents(prev => {
            const studentMap = new Map(prev.map(s => [s.id, s]));
            updatedStudents.forEach(updated => studentMap.set(updated.id, updated));
            return Array.from(studentMap.values()).sort((a: Student, b: Student) => a.name.localeCompare(b.name));
        });
    }, []);
    
    const addMultipleTransactions = useCallback(async (data: NewTransaction[]) => {
        const newItems = await api.createMultipleTransactions(data);
        setTransactions(prev => [...prev, ...newItems]);
    }, []);
    
    const savePayrollRun = useCallback(async (data: Payroll[]) => {
        const newItems = await api.savePayrollRun(data);
        setPayrollHistory(prev => [...prev, ...newItems]);
    }, []);
    
    const updateSchoolInfo = useCallback(async (data: UpdateSchoolInfoDto) => { setSchoolInfo(await api.updateSchoolInfo(data)); }, []);
    const uploadLogo = useCallback(async (formData: FormData) => { 
        const { logoUrl } = await api.uploadLogo(formData); 
        setSchoolInfo(prev => prev ? { ...prev, logoUrl } : null);
    }, []);
    const updateDarajaSettings = useCallback(async (data: DarajaSettings) => { setDarajaSettings(await api.updateDarajaSettings(data)); }, []);
    
    const addBulkCommunicationLogs = useCallback(async (data: NewCommunicationLog[]) => {
        const newItems = await api.createBulkCommunicationLogs(data);
        setCommunicationLogs(prev => [...prev, ...newItems]);
    }, []);
    
    // Batch update actions
    const createBatchUpdateAction = (setter: Function, apiFn: Function) => useCallback(async (data: any[]) => { const result = await apiFn(data); setter(result); }, [setter, apiFn]);
    const updateClasses = createBatchUpdateAction(setClasses, api.batchUpdateClasses);
    const updateSubjects = createBatchUpdateAction(setSubjects, api.batchUpdateSubjects);
    const updateAssignments = createBatchUpdateAction(setClassSubjectAssignments, api.batchUpdateAssignments);
    const updateTimetable = createBatchUpdateAction(setTimetableEntries, api.batchUpdateTimetable);
    const updateExams = createBatchUpdateAction(setExams, api.batchUpdateExams);
    const updateGrades = createBatchUpdateAction(setGrades, api.batchUpdateGrades);
    const updateAttendance = createBatchUpdateAction(setAttendanceRecords, api.batchUpdateAttendance);
    const updateEvents = createBatchUpdateAction(setEvents, api.batchUpdateEvents);

    const studentFinancials = useMemo(() => {
        const financials: Record<string, { balance: number; overpayment: number; lastPaymentDate: string | null }> = {};
        students.forEach(student => {
            financials[student.id] = { 
                balance: student.balance || 0, 
                overpayment: 0, 
                lastPaymentDate: null
            };
        });
        return financials;
    }, [students]);

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

    const value: IDataContext = {
        isLoading, isOffline, schoolInfo, currentUser, activeView, users, students, transactions, expenses, staff, payrollHistory, subjects, classes, classSubjectAssignments, timetableEntries, exams, grades, attendanceRecords, events, gradingScale, feeStructure, communicationLogs, announcements, payrollItems, darajaSettings, mpesaC2BTransactions, notifications, assignedClass, parentChildren, selectedChild, books, libraryTransactions,
        isSidebarCollapsed, isMobileSidebarOpen, setIsSidebarCollapsed, setIsMobileSidebarOpen, setActiveView, setSelectedChild, addNotification, handleLogin, handleLogout, getNavigationItems, openIdCardModal, studentFinancials, 
        addStudent, updateStudent, deleteStudent, updateMultipleStudents, 
        addTransaction, addMultipleTransactions, deleteTransaction, 
        addExpense, deleteExpense, refetchExpenses,
        addStaff, updateStaff, savePayrollRun, addPayrollItem, updatePayrollItem, deletePayrollItem, 
        updateSchoolInfo, uploadLogo, addUser, updateUser, deleteUser, updateUserProfile, uploadUserAvatar,
        addGradingRule, updateGradingRule, deleteGradingRule, 
        addFeeItem, updateFeeItem, deleteFeeItem, 
        updateDarajaSettings, 
        addAnnouncement, addCommunicationLog, addBulkCommunicationLogs, 
        addBook, updateBook, deleteBook, issueBook, returnBook,
        updateClasses, updateSubjects, updateAssignments, updateTimetable, updateExams, updateGrades, updateAttendance, updateEvents
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
