
// ... existing imports ...
import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import * as api from '../services/api';
// ... types import ...
import type { 
    User, Student, Staff, Transaction, Expense, Payroll, Subject, SchoolClass, ClassSubjectAssignment, 
    TimetableEntry, Exam, Grade, AttendanceRecord, SchoolEvent, SchoolInfo, GradingRule, FeeItem, 
    CommunicationLog, Announcement, PayrollItem, DarajaSettings, MpesaC2BTransaction, 
    Notification, NewStudent, NewStaff, NewTransaction, NewExpense, NewPayrollItem, NewAnnouncement, 
    NewCommunicationLog, NewUser, NewGradingRule, NewFeeItem, UpdateSchoolInfoDto
} from '../types';
import { Role, GradingSystem } from '../types';
import { NAVIGATION_ITEMS, TEACHER_NAVIGATION_ITEMS, PARENT_NAVIGATION_ITEMS } from '../constants';
import type { NavItem } from '../constants';
import IDCardModal from '../components/common/IDCardModal';

interface IDataContext {
    // ... existing state ...
    isLoading: boolean;
    schoolInfo: SchoolInfo | null;
    currentUser: User | null;
    activeView: string;
    users: User[];
    students: Student[];
    transactions: Transaction[];
    expenses: Expense[];
    staff: Staff[];
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
    announcements: Announcement[];
    payrollItems: PayrollItem[];
    darajaSettings: DarajaSettings | null;
    mpesaC2BTransactions: MpesaC2BTransaction[];
    notifications: Notification[];
    assignedClass: SchoolClass | null;
    parentChildren: Student[];
    selectedChild: Student | null;

    isSidebarCollapsed: boolean;
    isMobileSidebarOpen: boolean;
    setIsSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
    setIsMobileSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
    
    setActiveView: React.Dispatch<React.SetStateAction<string>>;
    setSelectedChild: React.Dispatch<React.SetStateAction<Student | null>>;
    
    addNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
    handleLogin: (user: User, token: string) => void;
    handleLogout: () => void;
    getNavigationItems: () => NavItem[];
    openIdCardModal: (person: Student | Staff, type: 'student' | 'staff') => void;
    
    addStudent: (studentData: NewStudent) => Promise<Student>;
    updateStudent: (studentId: string, updates: Partial<Student>) => Promise<Student>;
    deleteStudent: (studentId: string) => Promise<void>;
    updateMultipleStudents: (updates: Array<Partial<Student> & { id: string }>) => Promise<void>;
    refetchStudents: () => Promise<void>;
    refetchStaff: () => Promise<void>;
    refetchExpenses: () => Promise<void>;
    
    addTransaction: (transactionData: NewTransaction) => Promise<Transaction>;
    addMultipleTransactions: (transactionsData: NewTransaction[]) => Promise<void>;

    addExpense: (expenseData: NewExpense) => Promise<Expense>;
    deleteExpense: (expenseId: string) => Promise<void>;

    addStaff: (staffData: NewStaff) => Promise<Staff>;
    updateStaff: (staffId: string, updates: Partial<Staff>) => Promise<Staff>;
    deleteStaff: (staffId: string) => Promise<void>;
    savePayrollRun: (payrollData: Payroll[]) => Promise<void>;
    addPayrollItem: (itemData: NewPayrollItem) => Promise<PayrollItem>;
    updatePayrollItem: (itemId: string, updates: Partial<PayrollItem>) => Promise<PayrollItem>;
    deletePayrollItem: (itemId: string) => Promise<void>;
    
    updateSchoolInfo: (info: UpdateSchoolInfoDto) => Promise<void>;
    uploadLogo: (formData: FormData) => Promise<{ logoUrl: string }>;
    
    addUser: (userData: NewUser) => Promise<User>;
    updateUser: (userId: string, updates: Partial<User>) => Promise<User>;
    deleteUser: (userId: string) => Promise<void>;
    updateUserProfile: (data: Partial<User>) => Promise<void>;
    uploadUserAvatar: (formData: FormData) => Promise<{ avatarUrl: string }>;
    
    addGradingRule: (ruleData: NewGradingRule) => Promise<GradingRule>;
    updateGradingRule: (ruleId: string, updates: Partial<GradingRule>) => Promise<GradingRule>;
    deleteGradingRule: (ruleId: string) => Promise<void>;
    
    addFeeItem: (itemData: NewFeeItem) => Promise<FeeItem>;
    updateFeeItem: (itemId: string, updates: Partial<FeeItem>) => Promise<FeeItem>;
    deleteFeeItem: (itemId: string) => Promise<void>;
    
    updateDarajaSettings: (settings: DarajaSettings) => Promise<void>;

    addAnnouncement: (data: NewAnnouncement) => Promise<Announcement>;
    addCommunicationLog: (data: NewCommunicationLog) => Promise<CommunicationLog>;
    addBulkCommunicationLogs: (data: NewCommunicationLog[]) => Promise<void>;

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

// ... helpers and constants ...
const FALLBACK_SCHOOL_INFO: SchoolInfo = {
    name: 'School System (Offline Mode)',
    address: 'Local',
    phone: '',
    email: '',
    schoolCode: 'SCH',
    gradingSystem: GradingSystem.Traditional,
    logoUrl: 'https://i.imgur.com/pAEt4tQ.png'
};

const clearAllData = (setters: any) => {
    Object.values(setters).forEach((setter: any) => setter([]));
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // ... existing state initialization ...
    const [isLoading, setIsLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [activeView, setActiveView] = useState(localStorage.getItem('activeView') || 'dashboard');
    const [assignedClass, setAssignedClass] = useState<SchoolClass | null>(null);
    const [parentChildren, setParentChildren] = useState<Student[]>([]);
    const [selectedChild, setSelectedChild] = useState<Student | null>(null);
    
    const [users, setUsers] = useState<User[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [staff, setStaff] = useState<Staff[]>([]);
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
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [payrollItems, setPayrollItems] = useState<PayrollItem[]>([]);
    const [darajaSettings, setDarajaSettings] = useState<DarajaSettings | null>(null);
    const [mpesaC2BTransactions, setMpesaC2BTransactions] = useState<MpesaC2BTransaction[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isIdCardModalOpen, setIsIdCardModalOpen] = useState(false);
    const [idCardData, setIdCardData] = useState<{ type: 'student' | 'staff', data: Student | Staff } | null>(null);

    // ... existing useEffects and loadAuthenticatedData ...
    useEffect(() => {
        localStorage.setItem('activeView', activeView);
    }, [activeView]);

    const addNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);
        setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
    }, []);
    
    const handleLogout = useCallback(() => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('activeView');
        setCurrentUser(null);
        setActiveView('dashboard');
        const setters = { setUsers, setStudents, setTransactions, setExpenses, setStaff, setSubjects, setClasses, setClassSubjectAssignments, setTimetableEntries, setExams, setGrades, setAttendanceRecords, setEvents, setGradingScale, setFeeStructure, setAnnouncements, setPayrollItems, setDarajaSettings };
        clearAllData(setters);
    }, []);

    useEffect(() => {
        const initApp = async () => {
            setIsLoading(true);
            const token = localStorage.getItem('authToken');
            
            try {
                const info = await api.getSchoolInfo();
                setSchoolInfo(info);
            } catch (error) {
                 console.warn("Backend unreachable for school info, using fallback");
                 setSchoolInfo(FALLBACK_SCHOOL_INFO);
            }

            if (token) {
                try {
                    const validatedUser = await api.getAuthenticatedUser();
                    setCurrentUser(validatedUser);
                    await loadAuthenticatedData(validatedUser);
                } catch (error) {
                    console.error("Session invalid or expired:", error);
                    handleLogout();
                }
            }
            setIsLoading(false);
        };

        initApp();
    }, [handleLogout]);

    const loadAuthenticatedData = async (user: User) => {
        const results = await api.fetchInitialData();
        const getData = (index: number, fallback: any = []) => {
            const result = results[index];
            return result.status === 'fulfilled' ? result.value : fallback;
        };

        setUsers(getData(0));
        const studentsData = getData(1);
        if (studentsData && Array.isArray(studentsData)) {
            setStudents(studentsData.sort((a: Student, b: Student) => a.name.localeCompare(b.name)));
        } else {
            setStudents([]);
        }

        setSubjects(getData(2));
        const classesData = getData(3, []);
        setClasses(classesData);
        setClassSubjectAssignments(getData(4));
        setTimetableEntries(getData(5));
        setExams(getData(6));
        setEvents(getData(7));
        setGradingScale(getData(8));
        setFeeStructure(getData(9));
        setPayrollItems(getData(10));
        setAnnouncements(getData(11));
        
        const darajaData = results[13].status === 'fulfilled' ? results[13].value : null;
        setDarajaSettings(darajaData);

        setStaff([]);
        setGrades([]);
        setAttendanceRecords([]);

        api.getExpenses().then(setExpenses).catch(err => console.error("Failed to load expenses", err));
        api.getStaff().then(setStaff).catch(err => console.error("Failed to load staff", err));

        if (user.role === Role.Teacher) {
            setAssignedClass(classesData.find((c: SchoolClass) => c.formTeacherId === user.id) || null);
        } else if (user.role === Role.Parent) {
            setParentChildren(studentsData.filter((s: Student) => s.guardianEmail === user.email));
        }
    };
    
    const handleLogin = useCallback((user: User, token: string) => {
        localStorage.setItem('authToken', token);
        localStorage.setItem('currentUser', JSON.stringify(user));
        setCurrentUser(user);
        setIsLoading(true);
        loadAuthenticatedData(user).then(() => setIsLoading(false));
        if (user.role === Role.Teacher) setActiveView('teacher_dashboard');
        else if (user.role === Role.Parent) setActiveView('parent_dashboard');
        else setActiveView('dashboard');
    }, []);

    // ... createApiAction, updateApiAction, deleteApiAction definitions ...
    const createApiAction = <P, S>(setter: React.Dispatch<React.SetStateAction<S[]>>, apiFn: (data: P) => Promise<S>, sortFn?: (a: S, b: S) => number) => 
        useCallback(async (data: P) => {
            const newItem = await apiFn(data);
            setter(prev => {
                const newArr = [...prev, newItem];
                return sortFn ? newArr.sort(sortFn) : newArr;
            });
            return newItem;
        }, [setter]);

    const updateApiAction = <P extends {id: string}, S extends {id: string}>(setter: React.Dispatch<React.SetStateAction<S[]>>, apiFn: (id: string, data: Partial<P>) => Promise<S>) =>
        useCallback(async (id: string, data: Partial<P>): Promise<S> => {
            const updatedItem = await apiFn(id, data);
            setter(prev => prev.map(item => item.id === id ? updatedItem : item));
            return updatedItem;
        }, [setter]);

    const deleteApiAction = (setter: React.Dispatch<React.SetStateAction<any[]>>, apiFn: (id: string) => Promise<void>) =>
        useCallback(async (id: string) => {
            await apiFn(id);
            setter(prev => prev.filter(item => item.id !== id));
        }, [setter]);

    // ... actions bindings ...
    const addStudent = createApiAction(setStudents, api.createStudent, (a, b) => a.name.localeCompare(b.name));
    const updateStudent = updateApiAction(setStudents, api.updateStudent);
    const deleteStudent = deleteApiAction(setStudents, api.deleteStudent);
    const addTransaction = useCallback(async (data: NewTransaction) => {
         const newTransaction = await api.createTransaction(data);
         setTransactions(prev => [...prev, newTransaction]); 
         return newTransaction;
    }, []);
    const addExpense = createApiAction(setExpenses, api.createExpense);
    const deleteExpense = deleteApiAction(setExpenses, api.deleteExpense);
    const addStaff = createApiAction(setStaff, api.createStaff);
    const updateStaff = updateApiAction(setStaff, api.updateStaff);
    const deleteStaff = deleteApiAction(setStaff, api.deleteStaff);
    const addUser = createApiAction(setUsers, api.createUser);
    const updateUser = updateApiAction(setUsers, api.updateUser);
    const deleteUser = deleteApiAction(setUsers, api.deleteUser);
    
    // New User Profile Actions
    const updateUserProfile = useCallback(async (data: Partial<User>) => {
        const updatedUser = await api.updateUserProfile(data);
        setCurrentUser(updatedUser);
        // Also update the user in the users list if present
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    }, []);

    const uploadUserAvatar = useCallback(async (formData: FormData) => {
        const { avatarUrl } = await api.uploadUserAvatar(formData);
        if (currentUser) {
            const updatedUser = { ...currentUser, avatarUrl };
            setCurrentUser(updatedUser);
            setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        }
        return { avatarUrl };
    }, [currentUser]);

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
    const addCommunicationLog = useCallback(async (data: NewCommunicationLog) => {
        return await api.createCommunicationLog(data);
    }, []);
    
    const refetchStudents = useCallback(async () => {
        // @ts-ignore
        const studentsData: any = await api.getStudents({ pagination: false, mode: 'minimal' });
        setStudents(studentsData);
    }, []);
    const refetchStaff = useCallback(async () => setStaff(await api.getStaff()), []);
    const refetchExpenses = useCallback(async () => setExpenses(await api.getExpenses()), []);

    const updateMultipleStudents = useCallback(async (updates: Array<Partial<Student> & { id: string }>) => {
        const updatedStudents = await api.updateMultipleStudents(updates);
        setStudents(prev => {
            const studentMap = new Map(prev.map(s => [s.id, s]));
            updatedStudents.forEach(updated => {
                const existing = studentMap.get(updated.id);
                if (existing) {
                    studentMap.set(updated.id, Object.assign({}, existing, updated));
                } else {
                    studentMap.set(updated.id, updated);
                }
            });
            return Array.from(studentMap.values()).sort((a: Student, b: Student) => a.name.localeCompare(b.name));
        });
    }, []);
    const addMultipleTransactions = useCallback(async (data: NewTransaction[]) => {
        await api.createMultipleTransactions(data);
    }, []);
    const savePayrollRun = useCallback(async (data: Payroll[]) => {
        await api.savePayrollRun(data);
    }, []);
    const updateSchoolInfo = useCallback(async (data: UpdateSchoolInfoDto) => { setSchoolInfo(await api.updateSchoolInfo(data)); }, []);
    
    const uploadLogo = useCallback(async (formData: FormData) => {
        const result = await api.uploadLogo(formData);
        setSchoolInfo(prev => prev ? { ...prev, logoUrl: result.logoUrl } : null);
        return result;
    }, []);

    const updateDarajaSettings = useCallback(async (data: DarajaSettings) => { setDarajaSettings(await api.updateDarajaSettings(data)); }, []);
    const addBulkCommunicationLogs = useCallback(async (data: NewCommunicationLog[]) => {
        await api.createBulkCommunicationLogs(data);
    }, []);
    
    const createBatchUpdateAction = (setter: Function, apiFn: Function) => useCallback(async (data: any[]) => { const result = await apiFn(data); setter(result); }, [setter, apiFn]);
    const updateClasses = createBatchUpdateAction(setClasses, api.batchUpdateClasses);
    const updateSubjects = createBatchUpdateAction(setSubjects, api.batchUpdateSubjects);
    const updateAssignments = createBatchUpdateAction(setClassSubjectAssignments, api.batchUpdateAssignments);
    const updateTimetable = createBatchUpdateAction(setTimetableEntries, api.batchUpdateTimetable);
    const updateExams = createBatchUpdateAction(setExams, api.batchUpdateExams);
    const updateGrades = useCallback(async (data: Grade[]) => {
         const updated = await api.batchUpdateGrades(data);
         setGrades(updated);
    }, []);
    const updateAttendance = useCallback(async (data: AttendanceRecord[]) => {
         const updated = await api.batchUpdateAttendance(data);
         setAttendanceRecords(updated);
    }, []);
    const updateEvents = createBatchUpdateAction(setEvents, api.batchUpdateEvents);

    const studentFinancials = useMemo(() => {
        const financials: Record<string, { balance: number; overpayment: number; lastPaymentDate: string | null }> = {};
        students.forEach(student => {
            const studentTransactions = transactions.filter(t => t.studentId === student.id).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            let balance = 0; let lastPaymentDate: string | null = null;
            studentTransactions.forEach(t => {
                if (t.type === 'Invoice' || t.type === 'ManualDebit') balance += t.amount;
                else { balance -= t.amount; if (t.type === 'Payment') lastPaymentDate = t.date; }
            });
            financials[student.id] = { balance: Math.max(0, balance), overpayment: Math.abs(Math.min(0, balance)), lastPaymentDate };
        });
        return financials;
    }, [students, transactions]);

    const getNavigationItems = useCallback(() => {
        if (currentUser?.role === Role.Teacher) return TEACHER_NAVIGATION_ITEMS;
        if (currentUser?.role === Role.Parent) return PARENT_NAVIGATION_ITEMS;
        return NAVIGATION_ITEMS;
    }, [currentUser]);

    const openIdCardModal = useCallback((person: Student | Staff, type: 'student' | 'staff') => {
        setIdCardData({ type, data: person });
        setIsIdCardModalOpen(true);
    }, []);
    
    const value: IDataContext = {
        isLoading, schoolInfo, currentUser, activeView, users, students, transactions, expenses, staff, subjects, classes, classSubjectAssignments, timetableEntries, exams, grades, attendanceRecords, events, gradingScale, feeStructure, announcements, payrollItems, darajaSettings, mpesaC2BTransactions, notifications, assignedClass, parentChildren, selectedChild, isSidebarCollapsed, isMobileSidebarOpen, setIsSidebarCollapsed, setIsMobileSidebarOpen, setActiveView, setSelectedChild, addNotification, handleLogin, handleLogout, getNavigationItems, openIdCardModal, addStudent, updateStudent, deleteStudent, updateMultipleStudents, refetchStudents, refetchStaff, refetchExpenses, addTransaction, addMultipleTransactions, addExpense, deleteExpense, addStaff, updateStaff, deleteStaff, savePayrollRun, addPayrollItem, updatePayrollItem, deletePayrollItem, updateSchoolInfo, uploadLogo, addUser, updateUser, deleteUser, addGradingRule, updateGradingRule, deleteGradingRule, addFeeItem, updateFeeItem, deleteFeeItem, updateDarajaSettings, addAnnouncement, addCommunicationLog, addBulkCommunicationLogs, updateClasses, updateSubjects, updateAssignments, updateTimetable, updateExams, updateGrades, updateAttendance, updateEvents, studentFinancials, updateUserProfile, uploadUserAvatar
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
