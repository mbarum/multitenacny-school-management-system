
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/api';
import { Role } from '../types';
import type { 
    User, Student, Staff, SchoolInfo, Notification, DarajaSettings, 
    SchoolClass, Announcement, Payroll, PayrollItem, FeeItem, GradingRule,
    CommunicationLog, AttendanceRecord, TimetableEntry, ClassSubjectAssignment,
    Exam, Grade, SchoolEvent, Transaction, Expense,
    NewStudent, NewStaff, NewTransaction, NewExpense, NewPayrollItem,
    NewAnnouncement, NewCommunicationLog, NewUser, NewGradingRule, NewFeeItem
} from '../types';
import type { NavItem } from '../constants';
import { NAVIGATION_ITEMS, TEACHER_NAVIGATION_ITEMS, PARENT_NAVIGATION_ITEMS, SUPER_ADMIN_NAVIGATION_ITEMS } from '../constants';
import IDCardModal from '../components/common/IDCardModal';

interface IDataContext {
    isLoading: boolean;
    schoolInfo: SchoolInfo | null;
    currentUser: User | null;
    darajaSettings: DarajaSettings | null;
    isSidebarCollapsed: boolean;
    isMobileSidebarOpen: boolean;
    setIsSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
    setIsMobileSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
    notifications: Notification[];
    addNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
    handleLogin: (user: User) => void;
    handleLogout: () => void;
    getNavigationItems: () => NavItem[];
    openIdCardModal: (person: Student | Staff, type: 'student' | 'staff') => void;
    formatCurrency: (amount: number, currency?: string) => string;
    refreshSchoolInfo: () => Promise<void>;
    convertCurrency: (amount: number, toCurrency: string) => number;
    activeView: string; 
    setActiveView: (view: string) => void;
    parentChildren: Student[]; 
    selectedChild: Student | null;
    setSelectedChild: (child: Student | null) => void;
    assignedClass: SchoolClass | null;
    addStudent: (data: NewStudent) => Promise<Student>;
    updateStudent: (id: string, data: Partial<Student>) => Promise<any>;
    deleteStudent: (id: string) => Promise<void>;
    updateMultipleStudents: (updates: any[]) => Promise<any>;
    addTransaction: (data: NewTransaction) => Promise<Transaction>;
    addMultipleTransactions: (data: NewTransaction[]) => Promise<Transaction[]>;
    addExpense: (data: NewExpense) => Promise<Expense>;
    addStaff: (data: NewStaff) => Promise<Staff>;
    updateStaff: (id: string, data: Partial<Staff>) => Promise<any>;
    savePayrollRun: (data: Payroll[]) => Promise<Payroll[]>;
    addPayrollItem: (data: NewPayrollItem) => Promise<PayrollItem>;
    updatePayrollItem: (id: string, data: Partial<PayrollItem>) => Promise<any>;
    deletePayrollItem: (id: string) => Promise<void>;
    updateSchoolInfo: (data: SchoolInfo) => Promise<any>;
    updateDarajaSettings: (data: DarajaSettings) => Promise<any>;
    uploadLogo: (data: FormData) => Promise<any>;
    addUser: (data: NewUser) => Promise<User>;
    updateUser: (id: string, data: Partial<User>) => Promise<any>;
    deleteUser: (id: string) => Promise<void>;
    updateUserProfile: (data: Partial<User>) => Promise<any>;
    uploadUserAvatar: (data: FormData) => Promise<any>;
    adminUploadUserPhoto: (data: FormData) => Promise<any>;
    addGradingRule: (data: NewGradingRule) => Promise<GradingRule>;
    updateGradingRule: (id: string, data: Partial<GradingRule>) => Promise<any>;
    deleteGradingRule: (id: string) => Promise<void>;
    addFeeItem: (data: NewFeeItem) => Promise<FeeItem>;
    updateFeeItem: (id: string, data: Partial<FeeItem>) => Promise<any>;
    deleteFeeItem: (id: string) => Promise<void>;
    addAnnouncement: (data: NewAnnouncement) => Promise<Announcement>;
    addCommunicationLog: (data: NewCommunicationLog) => Promise<CommunicationLog>;
    addBulkCommunicationLogs: (data: NewCommunicationLog[]) => Promise<CommunicationLog[]>;
    updateClasses: (data: SchoolClass[]) => Promise<void>;
    updateSubjects: (data: any[]) => Promise<void>;
    updateAssignments: (data: any[]) => Promise<void>;
    updateTimetable: (data: any[]) => Promise<void>;
    updateExams: (data: any[]) => Promise<void>;
    updateGrades: (data: any[]) => Promise<void>;
    updateAttendance: (data: any[]) => Promise<void>;
    updateEvents: (data: any[]) => Promise<void>;
    addBook: (data: any) => Promise<any>;
    updateBook: (id: string, data: any) => Promise<any>;
    deleteBook: (id: string) => Promise<void>;
    issueBook: (data: any) => Promise<any>;
    returnBook: (id: string) => Promise<any>;
    markBookLost: (id: string) => Promise<any>;
    students: Student[];
    classes: SchoolClass[];
    subjects: any[];
    exams: any[];
    feeStructure: any[];
    expenses: any[];
    staff: Staff[];
    payrollItems: any[];
    users: User[];
    gradingScale: any[];
    announcements: Announcement[];
    communicationLogs: any[];
    attendanceRecords: any[];
    timetableEntries: any[];
    classSubjectAssignments: any[];
    events: any[];
    grades: any[];
    transactions: any[];
    studentFinancials: Record<string, { balance: number }>;
}

const DataContext = createContext<IDataContext | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [isLoading, setIsLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
    const [darajaSettings, setDarajaSettings] = useState<DarajaSettings | null>(null);
    
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isIdCardModalOpen, setIsIdCardModalOpen] = useState(false);
    const [idCardData, setIdCardData] = useState<{ type: 'student' | 'staff', data: Student | Staff } | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    
    const [activeView, setActiveView] = useState('dashboard');
    const [parentChildren, setParentChildren] = useState<Student[]>([]);
    const [selectedChild, setSelectedChild] = useState<Student | null>(null);
    const [assignedClass, setAssignedClass] = useState<SchoolClass | null>(null);

    const addNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);
        setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
    }, []);
    
    const handleLogout = useCallback(async () => {
        try {
            await api.logout();
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            setCurrentUser(null);
            setSchoolInfo(null);
            queryClient.clear();
            navigate('/login');
        }
    }, [navigate, queryClient]);

    const loadSchoolSpecificData = async (user: User) => {
        try {
            // Force a fresh fetch of school data
            const [info, daraja] = await Promise.all([
                api.getSchoolInfo(),
                api.getDarajaSettings()
            ]);
            setSchoolInfo(info);
            setDarajaSettings(daraja);

            if (user.role === Role.Teacher) {
                    const clsRes = await api.getClasses().then((res: any) => Array.isArray(res) ? res : res.data);
                    const myClass = clsRes.find((c: any) => c.formTeacherId === user.id);
                    setAssignedClass(myClass || null);
            } else if (user.role === Role.Parent) {
                    const childrenRes = await api.getStudents({ search: user.email, pagination: 'false' });
                    setParentChildren(Array.isArray(childrenRes) ? childrenRes : childrenRes.data || []);
            }
        } catch (e) {
            console.error("Critical: Failed to load tenant data", e);
        }
    };

    useEffect(() => {
        const checkSession = async () => {
            try {
                const user = await api.getAuthenticatedUser();
                if (user && user.id && user.name) {
                    setCurrentUser(user);
                    await loadSchoolSpecificData(user);
                } else {
                    const publicInfo = await api.getPublicSchoolInfo();
                    setSchoolInfo(publicInfo);
                }
            } catch (error) {
                 try {
                     const publicInfo = await api.getPublicSchoolInfo();
                     setSchoolInfo(publicInfo);
                 } catch(e) {}
            } finally {
                setIsLoading(false);
            }
        };
        checkSession();
    }, []);

    const handleLogin = useCallback(async (user: User) => {
        if (user && user.id) {
            setCurrentUser(user);
            // Block UI while we switch tenants
            setIsLoading(true);
            await loadSchoolSpecificData(user);
            setIsLoading(false);

            if (user.role === Role.SuperAdmin) navigate('/super-admin');
            else if (user.role === Role.Teacher) navigate('/teacher');
            else if (user.role === Role.Parent) navigate('/parent');
            else navigate('/');
        }
    }, [navigate]);

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

    const formatCurrency = useCallback((amount: number, currency?: string) => {
        const targetCurrency = currency || schoolInfo?.currency || 'KES';
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: targetCurrency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    }, [schoolInfo]);

    const convertCurrency = (amount: number, toCurrency: string) => amount; 

    const refreshSchoolInfo = async () => {
        const info = await api.getSchoolInfo();
        setSchoolInfo(info);
    };

    const addStudent = (data: NewStudent) => api.createStudent(data);
    const updateStudent = (id: string, data: Partial<Student>) => api.updateStudent(id, data);
    const deleteStudent = (id: string) => api.deleteStudent(id);
    const updateMultipleStudents = (updates: any[]) => api.updateMultipleStudents(updates);
    const addTransaction = (data: NewTransaction) => api.createTransaction(data);
    const addMultipleTransactions = (data: NewTransaction[]) => api.createMultipleTransactions(data);
    const addExpense = (data: NewExpense) => api.createExpense(data);
    const addStaff = (data: NewStaff) => api.createStaff(data);
    const updateStaff = (id: string, data: Partial<Staff>) => api.updateStaff(id, data);
    const savePayrollRun = (data: Payroll[]) => api.savePayrollRun(data);
    const addPayrollItem = (data: NewPayrollItem) => api.createPayrollItem(data);
    const updatePayrollItem = (id: string, data: Partial<PayrollItem>) => api.updatePayrollItem(id, data);
    const deletePayrollItem = (id: string) => api.deletePayrollItem(id);
    const updateDarajaSettings = (data: DarajaSettings) => api.updateDarajaSettings(data);
    const uploadLogo = (data: FormData) => api.uploadLogo(data);
    const addUser = (data: NewUser) => api.createUser(data);
    const updateUser = (id: string, data: Partial<User>) => api.updateUser(id, data);
    const deleteUser = (id: string) => api.deleteUser(id);
    const updateUserProfile = (data: Partial<User>) => api.updateUserProfile(data);
    const uploadUserAvatar = (data: FormData) => api.uploadUserAvatar(data);
    const adminUploadUserPhoto = (data: FormData) => api.adminUploadUserPhoto(data);
    const addGradingRule = (data: NewGradingRule) => api.createGradingRule(data);
    const updateGradingRule = (id: string, data: Partial<GradingRule>) => api.updateGradingRule(id, data);
    const deleteGradingRule = (id: string) => api.deleteGradingRule(id);
    const addFeeItem = (data: NewFeeItem) => api.createFeeItem(data);
    const updateFeeItem = (id: string, data: Partial<FeeItem>) => api.updateFeeItem(id, data);
    const deleteFeeItem = (id: string) => api.deleteFeeItem(id);
    const addAnnouncement = (data: NewAnnouncement) => api.createAnnouncement(data);
    const addCommunicationLog = (data: NewCommunicationLog) => api.createCommunicationLog(data);
    const addBulkCommunicationLogs = (data: NewCommunicationLog[]) => api.createBulkCommunicationLogs(data);
    const updateClasses = (data: SchoolClass[]) => api.updateClasses(data);
    const updateSubjects = (data: any[]) => api.updateSubjects(data);
    const updateAssignments = (data: any[]) => api.updateAssignments(data);
    const updateTimetable = (data: any[]) => api.updateTimetable(data);
    const updateExams = (data: any[]) => api.updateExams(data);
    const updateGrades = (data: any[]) => api.updateGrades(data);
    const updateAttendance = (data: any[]) => api.updateAttendance(data);
    const updateEvents = (data: any[]) => api.updateEvents(data);
    const addBook = (data: any) => api.addBook(data);
    const updateBook = (id: string, data: any) => api.updateBook(id, data);
    const deleteBook = (id: string) => api.deleteBook(id);
    const issueBook = (data: any) => api.issueBook(data);
    const returnBook = (id: string) => api.returnBook(id);
    const markBookLost = (id: string) => api.markBookLost(id);

    // Context Placeholders
    const students: Student[] = [];
    const classes: SchoolClass[] = [];
    const subjects: any[] = [];
    const exams: any[] = [];
    const feeStructure: any[] = [];
    const expenses: any[] = [];
    const staff: Staff[] = [];
    const payrollItems: any[] = [];
    const users: User[] = [];
    const gradingScale: any[] = [];
    const announcements: Announcement[] = [];
    const communicationLogs: any[] = [];
    const attendanceRecords: any[] = [];
    const timetableEntries: any[] = [];
    const classSubjectAssignments: any[] = [];
    const events: any[] = [];
    const grades: any[] = [];
    const transactions: any[] = [];
    const studentFinancials: Record<string, { balance: number }> = {};

    const value: IDataContext = {
        isLoading, schoolInfo, currentUser, darajaSettings, isSidebarCollapsed, isMobileSidebarOpen, setIsSidebarCollapsed, setIsMobileSidebarOpen, notifications, addNotification, handleLogin, handleLogout, getNavigationItems, openIdCardModal, formatCurrency, refreshSchoolInfo, convertCurrency, activeView, setActiveView, parentChildren, selectedChild, setSelectedChild, assignedClass, addStudent, updateStudent, deleteStudent, updateMultipleStudents: (u) => api.updateMultipleStudents(u), addTransaction, addMultipleTransactions: (d) => api.createMultipleTransactions(d), addExpense, addStaff, updateStaff, savePayrollRun: (d) => api.savePayrollRun(d), addPayrollItem, updatePayrollItem, deletePayrollItem, updateSchoolInfo: (d) => api.updateSchoolInfo(d), updateDarajaSettings: (d) => api.updateDarajaSettings(d), uploadLogo: (d) => api.uploadLogo(d), addUser, updateUser, deleteUser, updateUserProfile: (d) => api.updateUserProfile(d), uploadUserAvatar: (d) => api.uploadUserAvatar(d), adminUploadUserPhoto: (d) => api.adminUploadUserPhoto(d), addGradingRule, updateGradingRule, deleteGradingRule, addFeeItem, updateFeeItem, deleteFeeItem, addAnnouncement, addCommunicationLog, addBulkCommunicationLogs: (d) => api.createBulkCommunicationLogs(d), updateClasses: (d) => api.updateClasses(d), updateSubjects: (d) => api.updateSubjects(d), updateAssignments: (d) => api.updateAssignments(d), updateTimetable: (d) => api.updateTimetable(d), updateExams: (d) => api.updateExams(d), updateGrades: (d) => api.updateGrades(d), updateAttendance: (d) => api.updateAttendance(d), updateEvents: (d) => api.updateEvents(d), addBook, updateBook, deleteBook, issueBook, returnBook, markBookLost, students, classes, subjects, exams, feeStructure, expenses, staff, payrollItems, users, gradingScale, announcements, communicationLogs, attendanceRecords, timetableEntries, classSubjectAssignments, events, grades, transactions, studentFinancials
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
