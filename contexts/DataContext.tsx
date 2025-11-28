import React, { createContext, useState, useEffect, useMemo, useContext, useCallback } from 'react';
import * as api from '../services/api';
import { Role } from '../types';
import type { 
    User, Student, Staff, Transaction, Expense, Payroll, Subject, SchoolClass, ClassSubjectAssignment, 
    TimetableEntry, Exam, Grade, AttendanceRecord, SchoolEvent, SchoolInfo, GradingRule, FeeItem, 
    CommunicationLog, Announcement, ReportShareLog, PayrollItem, DarajaSettings, MpesaC2BTransaction, 
    Notification, NewStudent, NewStaff, NewTransaction, NewExpense, NewPayrollItem, NewAnnouncement, 
    NewCommunicationLog, NewUser, NewGradingRule, NewFeeItem
} from '../types';
import { NAVIGATION_ITEMS, TEACHER_NAVIGATION_ITEMS, PARENT_NAVIGATION_ITEMS } from '../constants';
import type { NavItem } from '../constants';
import IDCardModal from '../components/common/IDCardModal';

interface IDataContext {
    // State
    isLoading: boolean;
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
    updateMultipleStudents: (updates: Array<Partial<Student> & { id: string }>) => Promise<void>;
    
    addTransaction: (transactionData: NewTransaction) => Promise<Transaction>;
    addMultipleTransactions: (transactionsData: NewTransaction[]) => Promise<void>;

    addExpense: (expenseData: NewExpense) => Promise<Expense>;

    addStaff: (staffData: NewStaff) => Promise<Staff>;
    updateStaff: (staffId: string, updates: Partial<Staff>) => Promise<void>;
    savePayrollRun: (payrollData: Payroll[]) => Promise<void>;
    addPayrollItem: (itemData: NewPayrollItem) => Promise<PayrollItem>;
    updatePayrollItem: (itemId: string, updates: Partial<PayrollItem>) => Promise<void>;
    deletePayrollItem: (itemId: string) => Promise<void>;
    
    updateSchoolInfo: (info: SchoolInfo) => Promise<void>;
    addUser: (userData: NewUser) => Promise<User>;
    updateUser: (userId: string, updates: Partial<User>) => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;
    
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
        // Clear all sensitive data
        const setters = { setUsers, setStudents, setTransactions, setExpenses, setStaff, setPayrollHistory, setSubjects, setClasses, setClassSubjectAssignments, setTimetableEntries, setExams, setGrades, setAttendanceRecords, setEvents, setGradingScale, setFeeStructure, setCommunicationLogs, setAnnouncements, setPayrollItems, setDarajaSettings };
        clearAllData(setters);
    }, []);

    // Effect to check for an existing session on app load
    useEffect(() => {
        const checkSession = async () => {
            const token = localStorage.getItem('authToken');
            const userJson = localStorage.getItem('currentUser');
            if (token && userJson) {
                try {
                    const user = JSON.parse(userJson);
                    // Optionally, you could verify the token with a '/api/auth/me' endpoint here
                    setCurrentUser(user);
                } catch (error) {
                    handleLogout();
                }
            }
            // A minimal fetch for non-authed view (login page)
            try {
                // Fix: Replaced call to non-exported `api.list` with `api.getSchoolInfo`.
                const info = await api.getSchoolInfo();
                setSchoolInfo(info);
            } catch (error) {
                 addNotification("Could not load school information.", "error");
            }
            setIsLoading(false);
        };
        checkSession();
    }, [handleLogout, addNotification]);

    // Effect to fetch all app data when a user logs in
    useEffect(() => {
        if (currentUser) {
            setIsLoading(true);
            api.fetchInitialData().then(data => {
                const [users, students, transactions, expenses, staff, payrollHistory, subjects, classes, classSubjectAssignments, timetableEntries, exams, grades, attendanceRecords, events, gradingScale, feeStructure, payrollItems, communicationLogs, announcements, schoolInfo, darajaSettings] = data;
                setUsers(users); setStudents(students.sort((a: Student,b: Student) => a.name.localeCompare(b.name))); setTransactions(transactions); setExpenses(expenses); setStaff(staff); setPayrollHistory(payrollHistory); setSubjects(subjects); setClasses(classes); setClassSubjectAssignments(classSubjectAssignments); setTimetableEntries(timetableEntries); setExams(exams); setGrades(grades); setAttendanceRecords(attendanceRecords); setEvents(events); setGradingScale(gradingScale); setFeeStructure(feeStructure); setPayrollItems(payrollItems); setCommunicationLogs(communicationLogs); setAnnouncements(announcements); setSchoolInfo(schoolInfo); setDarajaSettings(darajaSettings);
                
                 if (currentUser.role === Role.Teacher) {
                    setAssignedClass(classes.find(c => c.formTeacherId === currentUser.id) || null);
                } else if (currentUser.role === Role.Parent) {
                    setParentChildren(students.filter(s => s.guardianEmail === currentUser.email));
                }
                setIsLoading(false);
            }).catch(error => {
                addNotification("Failed to load application data. Please try again.", "error");
                console.error("Data fetch error:", error);
                setIsLoading(false);
                if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                    handleLogout();
                }
            });
        }
    }, [currentUser, addNotification, handleLogout]);
    
    const handleLogin = useCallback((user: User, token: string) => {
        localStorage.setItem('authToken', token);
        localStorage.setItem('currentUser', JSON.stringify(user));
        setCurrentUser(user);
        if (user.role === Role.Teacher) setActiveView('teacher_dashboard');
        else if (user.role === Role.Parent) setActiveView('parent_dashboard');
        else setActiveView('dashboard');
    }, []);

    // API ACTION FUNCTIONS
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
    const addTransaction = createApiAction(setTransactions, api.createTransaction);
    const addExpense = createApiAction(setExpenses, api.createExpense);
    const addStaff = createApiAction(setStaff, api.createStaff);
    const updateStaff = updateApiAction(setStaff, api.updateStaff);
    const addUser = createApiAction(setUsers, api.createUser);
    const updateUser = updateApiAction(setUsers, api.updateUser);
    const deleteUser = deleteApiAction(setUsers, api.deleteUser);
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
    
    // Non-standard actions
    const updateMultipleStudents = useCallback(async (updates: Array<Partial<Student> & { id: string }>) => {
        const updatedStudents = await api.updateMultipleStudents(updates);
        setStudents(prev => {
            const studentMap = new Map(prev.map(s => [s.id, s]));
            updatedStudents.forEach(updated => studentMap.set(updated.id, updated));
            // Fix: Explicitly type sort parameters to resolve error on 'a.name' and 'b.name'.
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
    const updateSchoolInfo = useCallback(async (data: SchoolInfo) => { setSchoolInfo(await api.updateSchoolInfo(data)); }, []);
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

    // Fix: Corrected types for actions to match IDataContext and implementation.
    const value: IDataContext = {
        isLoading, schoolInfo, currentUser, activeView, users, students, transactions, expenses, staff, payrollHistory, subjects, classes, classSubjectAssignments, timetableEntries, exams, grades, attendanceRecords, events, gradingScale, feeStructure, communicationLogs, announcements, payrollItems, darajaSettings, mpesaC2BTransactions, notifications, assignedClass, parentChildren, selectedChild, isSidebarCollapsed, isMobileSidebarOpen, setIsSidebarCollapsed, setIsMobileSidebarOpen, setActiveView, setSelectedChild, addNotification, handleLogin, handleLogout, getNavigationItems, openIdCardModal, studentFinancials, addStudent, updateStudent, updateMultipleStudents, addTransaction, addMultipleTransactions, addExpense, addStaff, updateStaff, savePayrollRun, addPayrollItem, updatePayrollItem, deletePayrollItem, updateSchoolInfo, addUser, updateUser, deleteUser, addGradingRule, updateGradingRule, deleteGradingRule, addFeeItem, updateFeeItem, deleteFeeItem, updateDarajaSettings, addAnnouncement, addCommunicationLog, addBulkCommunicationLogs, updateClasses, updateSubjects, updateAssignments, updateTimetable, updateExams, updateGrades, updateAttendance, updateEvents
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