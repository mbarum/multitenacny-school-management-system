
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
    
    // UI
    isSidebarCollapsed: boolean;
    isMobileSidebarOpen: boolean;
    setIsSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
    setIsMobileSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
    
    // Notifications
    notifications: Notification[];
    addNotification: (message: string, type?: 'success' | 'error' | 'info') => void;

    // Actions
    handleLogin: (user: User, token: string) => void;
    handleLogout: () => void;
    getNavigationItems: () => NavItem[];
    openIdCardModal: (person: Student | Staff, type: 'student' | 'staff') => void;
    formatCurrency: (amount: number, currency?: string) => string;
    refreshSchoolInfo: () => Promise<void>;
    convertCurrency: (amount: number, toCurrency: string) => number;
    
    // Context Specific
    activeView: string; 
    setActiveView: (view: string) => void;
    parentChildren: Student[]; 
    selectedChild: Student | null;
    setSelectedChild: (child: Student | null) => void;
    assignedClass: SchoolClass | null;
    
    // API Pass-throughs
    addStudent: (data: NewStudent) => Promise<Student>;
    updateStudent: (id: string, data: Partial<Student>) => Promise<any>;
    deleteStudent: (id: string) => Promise<void>;
    updateMultipleStudents: (updates: any[]) => Promise<any>;
    addTransaction: (data: NewTransaction) => Promise<Transaction>;
    addMultipleTransactions: (data: NewTransaction[]) => Promise<void>;
    addExpense: (data: NewExpense) => Promise<Expense>;
    addStaff: (data: NewStaff) => Promise<Staff>;
    updateStaff: (id: string, data: Partial<Staff>) => Promise<any>;
    savePayrollRun: (data: Payroll[]) => Promise<any>;
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
    addBulkCommunicationLogs: (data: NewCommunicationLog[]) => Promise<void>;
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
    
    // Empty Arrays / Placeholders for legacy compatibility until full migration
    // These ensure components importing from Context but not yet refactored don't crash immediately,
    // though they will show empty data until refactored to useQuery.
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
    
    const handleLogout = useCallback(() => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        setCurrentUser(null);
        queryClient.clear();
        navigate('/login');
    }, [navigate, queryClient]);

    // Initial Auth Check & Global Settings Load
    useEffect(() => {
        const checkSession = async () => {
            const token = localStorage.getItem('authToken');
            const userJson = localStorage.getItem('currentUser');
            
            if (token && userJson) {
                try {
                    const user = JSON.parse(userJson);
                    setCurrentUser(user);
                    
                    try {
                        const [info, daraja] = await Promise.all([
                            api.getSchoolInfo(),
                            api.getDarajaSettings()
                        ]);
                        setSchoolInfo(info);
                        setDarajaSettings(daraja);
                    } catch (e) { console.error("Failed to load settings", e); }

                    // Pre-load role specific lightweight data
                    if (user.role === Role.Teacher) {
                         const classes = await api.getClasses().then((res: any) => Array.isArray(res) ? res : res.data);
                         const myClass = classes.find((c: any) => c.formTeacherId === user.id);
                         setAssignedClass(myClass || null);
                         if(myClass) setActiveView('teacher_dashboard');
                    } else if (user.role === Role.Parent) {
                         const childrenRes = await api.getStudents({ search: user.email, pagination: 'false' });
                         const children = Array.isArray(childrenRes) ? childrenRes : childrenRes.data;
                         setParentChildren(children);
                         setActiveView('parent_dashboard');
                    } else if (user.role === Role.SuperAdmin) {
                         setActiveView('super_admin_dashboard');
                    }

                } catch (error) {
                    handleLogout();
                }
            } else {
                 try {
                     const publicInfo = await api.getPublicSchoolInfo();
                     setSchoolInfo(publicInfo);
                 } catch(e) { console.error(e); }
            }
            setIsLoading(false);
        };
        checkSession();
    }, [handleLogout]);

    const handleLogin = useCallback((user: User, token: string) => {
        localStorage.setItem('authToken', token);
        localStorage.setItem('currentUser', JSON.stringify(user));
        setCurrentUser(user);
        
        api.getSchoolInfo().then(setSchoolInfo).catch(console.error);

        if (user.role === Role.SuperAdmin) navigate('/super-admin');
        else if (user.role === Role.Teacher) navigate('/teacher');
        else if (user.role === Role.Parent) navigate('/parent');
        else navigate('/');
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
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: targetCurrency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    }, [schoolInfo]);

    const convertCurrency = (amount: number, toCurrency: string) => amount; // Placeholder

    const refreshSchoolInfo = async () => {
        const info = await api.getSchoolInfo();
        setSchoolInfo(info);
    };

    const value: IDataContext = {
        isLoading, schoolInfo, currentUser, darajaSettings,
        isSidebarCollapsed, isMobileSidebarOpen, setIsSidebarCollapsed, setIsMobileSidebarOpen,
        notifications, addNotification, handleLogin, handleLogout, getNavigationItems,
        openIdCardModal, formatCurrency, refreshSchoolInfo, convertCurrency,
        
        // API Wrappers
        addStudent: api.createStudent,
        updateStudent: api.updateStudent,
        deleteStudent: api.deleteStudent,
        updateMultipleStudents: api.updateMultipleStudents,
        addTransaction: api.createTransaction,
        addMultipleTransactions: api.createMultipleTransactions,
        addExpense: api.createExpense,
        addStaff: api.createStaff,
        updateStaff: api.updateStaff,
        savePayrollRun: api.savePayrollRun,
        addPayrollItem: api.createPayrollItem,
        updatePayrollItem: api.updatePayrollItem,
        deletePayrollItem: api.deletePayrollItem,
        updateSchoolInfo: async (data) => { const res = await api.updateSchoolInfo(data); setSchoolInfo(res); return res; },
        updateDarajaSettings: async (data) => { const res = await api.updateDarajaSettings(data); setDarajaSettings(res); return res; },
        uploadLogo: async (data) => { const res = await api.uploadLogo(data); refreshSchoolInfo(); return res; },
        addUser: api.createUser,
        updateUser: api.updateUser,
        deleteUser: api.deleteUser,
        updateUserProfile: api.updateUserProfile,
        uploadUserAvatar: api.uploadUserAvatar,
        adminUploadUserPhoto: api.adminUploadUserPhoto,
        addGradingRule: api.createGradingRule,
        updateGradingRule: api.updateGradingRule,
        deleteGradingRule: api.deleteGradingRule,
        addFeeItem: api.createFeeItem,
        updateFeeItem: api.updateFeeItem,
        deleteFeeItem: api.deleteFeeItem,
        addAnnouncement: api.createAnnouncement,
        addCommunicationLog: api.createCommunicationLog,
        addBulkCommunicationLogs: api.createBulkCommunicationLogs,
        updateClasses: (data) => api.updateClasses(data),
        updateSubjects: (data) => api.updateSubjects(data),
        updateAssignments: (data) => api.updateAssignments(data),
        updateTimetable: (data) => api.updateTimetable(data),
        updateExams: (data) => api.updateExams(data),
        updateGrades: (data) => api.updateGrades(data),
        updateAttendance: (data) => api.updateAttendance(data),
        updateEvents: (data) => api.updateEvents(data),
        addBook: api.addBook,
        updateBook: api.updateBook,
        deleteBook: api.deleteBook,
        issueBook: api.issueBook,
        returnBook: api.returnBook,
        markBookLost: api.markBookLost,
        
        // Empty Arrays / Placeholders (Legacy support)
        students: [], classes: [], subjects: [], exams: [], feeStructure: [], expenses: [], 
        staff: [], payrollItems: [], users: [], gradingScale: [], announcements: [],
        communicationLogs: [], attendanceRecords: [], timetableEntries: [], classSubjectAssignments: [],
        events: [], grades: [], transactions: [],
        
        activeView, setActiveView,
        parentChildren, selectedChild, setSelectedChild, assignedClass,
        studentFinancials: {},
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
