
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/api';
import { Role, Currency } from '../types';
import { EXCHANGE_RATES } from '../utils/currency';
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
    convertCurrency: (amountInKes: number, targetCurrency: string) => number;
    refreshSchoolInfo: () => Promise<void>;
    activeView: string; 
    setActiveView: (view: string) => void;
    parentChildren: Student[]; 
    selectedChild: Student | null;
    setSelectedChild: (child: Student | null) => void;
    assignedClass: SchoolClass | null;
    
    // API Wrappers
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
    
    // Batch update actions
    updateClasses: (data: SchoolClass[]) => Promise<void>;
    updateSubjects: (data: any[]) => Promise<void>;
    updateAssignments: (data: any[]) => Promise<void>;
    updateTimetable: (data: any[]) => Promise<void>;
    updateExams: (data: any[]) => Promise<void>;
    updateGrades: (data: any[]) => Promise<void>;
    updateAttendance: (data: any[]) => Promise<void>;
    updateEvents: (data: any[]) => Promise<void>;
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
        try { await api.logout(); } catch (error) { console.error("Logout failed:", error); }
        setCurrentUser(null);
        setSchoolInfo(null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        queryClient.clear();
        navigate('/login');
    }, [navigate, queryClient]);

    const loadCoreSettings = async (user: User) => {
        try {
            // Fetch school info (required for all)
            const info = await api.getSchoolInfo();
            setSchoolInfo(info);

            // Conditional fetch for daraja (sensitive settings)
            // Teachers do not have permission for this and do not need it
            if (user.role === Role.Admin || user.role === Role.Accountant || user.role === Role.Parent) {
                try {
                    const daraja = await api.getDarajaSettings();
                    setDarajaSettings(daraja);
                } catch (e) {
                    console.warn("Could not load payment settings for this user role.");
                }
            }

            if (user.role === Role.Teacher) {
                const clsRes = await api.getClasses().then((res: any) => Array.isArray(res) ? res : res.data);
                const myClass = (clsRes || []).find((c: any) => c.formTeacherId === user.id);
                setAssignedClass(myClass || null);
            } else if (user.role === Role.Parent) {
                const childrenRes = await api.getStudents({ search: user.email, pagination: 'false' });
                const list = Array.isArray(childrenRes) ? childrenRes : childrenRes.data || [];
                setParentChildren(list);
            }
        } catch (e) {
            console.error("Context Error: Failed to load institution settings", e);
        }
    };

    useEffect(() => {
        const checkSession = async () => {
            try {
                const user = await api.getAuthenticatedUser();
                if (user && user.id) {
                    setCurrentUser(user);
                    await loadCoreSettings(user);
                } else {
                    const publicInfo = await api.getPublicSchoolInfo();
                    setSchoolInfo(publicInfo);
                }
            } catch (error) {
                 try { const publicInfo = await api.getPublicSchoolInfo(); setSchoolInfo(publicInfo); } catch(e) {}
            } finally {
                setIsLoading(false);
            }
        };
        checkSession();
    }, []);

    const handleLogin = useCallback(async (user: User) => {
        if (user && user.id) {
            setCurrentUser(user);
            setIsLoading(true);
            await loadCoreSettings(user);
            setIsLoading(false);

            if (user.role === Role.SuperAdmin) navigate('/super-admin');
            else if (user.role === Role.Teacher) navigate('/teacher');
            else if (user.role === Role.Parent) navigate('/parent');
            else navigate('/');
        }
    }, [navigate]);

    const formatCurrency = useCallback((amount: number, currency?: string) => {
        const targetCurrency = currency || schoolInfo?.currency || 'KES';
        return new Intl.NumberFormat('en-KE', {
            style: 'currency', currency: targetCurrency,
            minimumFractionDigits: 0, maximumFractionDigits: 0,
        }).format(amount);
    }, [schoolInfo]);

    const convertCurrency = useCallback((amountInKes: number, targetCurrency: string) => {
        if (targetCurrency === Currency.KES) return amountInKes;
        const rate = EXCHANGE_RATES[targetCurrency as Currency] || 1;
        return amountInKes * rate;
    }, []);

    const openIdCardModal = useCallback((person: Student | Staff, type: 'student' | 'staff') => {
        setIdCardData({ type, data: person });
        setIsIdCardModalOpen(true);
    }, []);

    const getNavigationItems = useCallback(() => {
        if (currentUser?.role === Role.SuperAdmin) return SUPER_ADMIN_NAVIGATION_ITEMS;
        if (currentUser?.role === Role.Teacher) return TEACHER_NAVIGATION_ITEMS;
        if (currentUser?.role === Role.Parent) return PARENT_NAVIGATION_ITEMS;
        return NAVIGATION_ITEMS;
    }, [currentUser]);

    const value: IDataContext = {
        isLoading, schoolInfo, currentUser, darajaSettings, isSidebarCollapsed, isMobileSidebarOpen, 
        setIsSidebarCollapsed, setIsMobileSidebarOpen, notifications, addNotification, handleLogin, 
        handleLogout, getNavigationItems, openIdCardModal, formatCurrency, convertCurrency,
        refreshSchoolInfo: async () => { setSchoolInfo(await api.getSchoolInfo()); },
        activeView, setActiveView, parentChildren, selectedChild, setSelectedChild, assignedClass,
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
        updateSchoolInfo: api.updateSchoolInfo,
        updateDarajaSettings: api.updateDarajaSettings,
        uploadLogo: api.uploadLogo,
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
        updateClasses: (d) => api.updateClasses(d),
        updateSubjects: (d) => api.updateSubjects(d),
        updateAssignments: (d) => api.updateAssignments(d),
        updateTimetable: (d) => api.updateTimetable(d),
        updateExams: (d) => api.updateExams(d),
        updateGrades: (d) => api.updateGrades(d),
        updateAttendance: (d) => api.updateAttendance(d),
        updateEvents: (d) => api.updateEvents(d)
    };

    return (
        <DataContext.Provider value={value}>
            {children}
            {schoolInfo && (
                 <IDCardModal isOpen={isIdCardModalOpen} onClose={() => setIsIdCardModalOpen(false)} data={idCardData} schoolInfo={schoolInfo} />
            )}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) throw new Error('useData must be used within a DataProvider');
    return context;
};
