import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    Users, 
    GraduationCap, 
    DollarSign, 
    AlertTriangle, 
    CheckCircle2, 
    Search, 
    Filter, 
    Plus, 
    Download, 
    LayoutGrid, 
    List, 
    Phone, 
    Mail, 
    Eye, 
    CreditCard, 
    ArrowUpDown, 
    ChevronRight, 
    SlidersHorizontal,
    Camera,
    Upload,
    UserCheck,
    IdCard,
    ArrowRight,
    MapPin,
    Calendar,
    Sparkles,
    Building,
    FileSpreadsheet,
    FileText,
    ShieldCheck
} from 'lucide-react';
import Modal from '../components/common/Modal';
import WebcamCaptureModal from '../components/common/WebcamCaptureModal';
import type { Student, NewStudent, CommunicationLog, FeeItem, NewTransaction } from '../types';
import { CommunicationType, StudentStatus, TransactionType } from '../types';
import StudentBillingModal from '../components/common/StudentBillingModal';
import PromotionModal from '../components/common/PromotionModal';
import BatchIDCardModal from '../components/common/BatchIDCardModal';
import { useData } from '../contexts/DataContext';
import { generateStudentsPDF } from '../services/exportService';
import Pagination from '../components/common/Pagination';
import Skeleton from '../components/common/Skeleton';
import Spinner from '../components/common/Spinner';
import * as api from '../services/api';
import { sendParentWelcomeEmail } from '../services/emailService';
import { optimizeImage } from '../utils/imageOptimizer';

const DEFAULT_AVATAR = 'https://i.imgur.com/S5o7W44.png';

// CSV Export Utility
function downloadStudentsCSV(filename: string, students: any[]) {
    const headers = ['Admission Number', 'Full Legal Name', 'Class / Grade', 'Fee Balance', 'Status', 'Guardian Name', 'Guardian Phone', 'Guardian Email', 'Date of Birth', 'Address'];
    const rows = students.map(s => [
        s.admissionNumber || '',
        s.name || '',
        s.class || '',
        s.balance ?? 0,
        s.status || 'Active',
        s.guardianName || '',
        s.guardianContact || '',
        s.guardianEmail || '',
        s.dateOfBirth || '',
        s.guardianAddress || ''
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// =================================================================================
// Sub-components: Scholar Profile & Revision Modal
// =================================================================================

interface StudentProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: Student | null;
    classes: any[];
    onViewIdCard: () => void;
    onOpenBilling: () => void;
}

const StudentProfileModal: React.FC<StudentProfileModalProps> = ({ 
    isOpen, 
    onClose, 
    student, 
    classes, 
    onViewIdCard,
    onOpenBilling
}) => {
    const { currentUser, addNotification, formatCurrency } = useData();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'profile' | 'guardian' | 'communication'>('profile');
    const [formData, setFormData] = useState<any>({});
    const [isSaving, setIsSaving] = useState(false);
    const [studentLogs, setStudentLogs] = useState<CommunicationLog[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);

    useEffect(() => {
        if (isOpen && student) {
            setActiveTab('profile');
            setFormData({ ...student });
            setLoadingLogs(true);
            api.getCommunicationLogs({ studentId: student.id, limit: 20 })
                .then(res => setStudentLogs(res.data || []))
                .catch(() => setStudentLogs([]))
                .finally(() => setLoadingLogs(false));
        }
    }, [isOpen, student]);

    const handleSaveChanges = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!student) return;
        setIsSaving(true);
        try {
            const payload = {
                name: formData.name,
                classId: formData.classId,
                profileImage: formData.profileImage,
                guardianName: formData.guardianName,
                guardianContact: formData.guardianContact,
                guardianAddress: formData.guardianAddress,
                guardianEmail: formData.guardianEmail,
                emergencyContact: formData.emergencyContact,
                dateOfBirth: formData.dateOfBirth,
                status: formData.status
            };

            await api.updateStudent(student.id, payload as any);
            queryClient.invalidateQueries({ queryKey: ['students'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
            addNotification(`Scholar record for ${formData.name} updated successfully.`, 'success');
            onClose();
        } catch (e: any) {
            addNotification(e.message || 'Revision rejected by server.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen || !student) return null;

    const balance = student.balance ?? 0;
    const isDebtor = balance > 0;

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={`Scholar Record: ${student.name}`} 
            size="xl"
            footer={
                <div className="flex flex-wrap justify-between items-center w-full gap-3">
                    <div className="flex items-center gap-2">
                        <button 
                            id="btn-student-profile-idcard"
                            type="button" 
                            onClick={onViewIdCard} 
                            className="inline-flex items-center px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-semibold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            <IdCard className="w-4 h-4 mr-1.5 text-primary-600" />
                            Official ID Card
                        </button>
                        <button 
                            id="btn-student-profile-billing"
                            type="button" 
                            onClick={() => { onClose(); onOpenBilling(); }} 
                            className="inline-flex items-center px-4 py-2 bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 rounded-xl font-semibold text-xs hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
                        >
                            <CreditCard className="w-4 h-4 mr-1.5 text-primary-600" />
                            Financial Ledger
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            id="btn-student-profile-cancel"
                            type="button" 
                            onClick={onClose} 
                            className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            id="btn-student-profile-save"
                            type="button" 
                            onClick={handleSaveChanges} 
                            disabled={isSaving}
                            className="inline-flex items-center px-6 py-2.5 bg-primary-600 text-white rounded-xl font-semibold text-xs shadow-sm hover:bg-primary-700 transition-colors disabled:opacity-50"
                        >
                            {isSaving ? <Spinner /> : 'Save Changes'}
                        </button>
                    </div>
                </div>
            }
        >
            <div className="space-y-6">
                {/* Scholar Quick Header Banner */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 gap-4">
                    <div className="flex items-center gap-4">
                        <img 
                            src={formData.profileImage || DEFAULT_AVATAR} 
                            alt={formData.name}
                            className="w-16 h-16 rounded-2xl object-cover border-2 border-white dark:border-slate-700 shadow-sm"
                        />
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                                    {formData.name || 'Unnamed Scholar'}
                                </h3>
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                    formData.status === StudentStatus.Active 
                                        ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300' 
                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                }`}>
                                    {formData.status || 'Active'}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                                <span className="font-mono font-semibold text-primary-600 dark:text-primary-400">
                                    #{student.admissionNumber}
                                </span>
                                <span>•</span>
                                <span>Class: {student.class || 'Unassigned'}</span>
                            </p>
                        </div>
                    </div>

                    <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                            Tuition Balance
                        </span>
                        <span className={`text-xl font-black ${isDebtor ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {formatCurrency(balance)}
                        </span>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">
                            {isDebtor ? 'Arrears Pending' : 'Account Cleared'}
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 dark:border-slate-700">
                    <button 
                        id="tab-profile-academic"
                        onClick={() => setActiveTab('profile')} 
                        className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                            activeTab === 'profile' 
                                ? 'border-primary-600 text-primary-600 dark:text-primary-400' 
                                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                        }`}
                    >
                        Academic & Legal
                    </button>
                    <button 
                        id="tab-profile-guardian"
                        onClick={() => setActiveTab('guardian')} 
                        className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                            activeTab === 'guardian' 
                                ? 'border-primary-600 text-primary-600 dark:text-primary-400' 
                                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                        }`}
                    >
                        Guardian & Emergency
                    </button>
                    <button 
                        id="tab-profile-dispatch"
                        onClick={() => setActiveTab('communication')} 
                        className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                            activeTab === 'communication' 
                                ? 'border-primary-600 text-primary-600 dark:text-primary-400' 
                                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                        }`}
                    >
                        Dispatch Log ({studentLogs.length})
                    </button>
                </div>

                {/* Tab Contents */}
                {activeTab === 'profile' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                Full Legal Name
                            </label>
                            <input 
                                id="input-student-profile-name"
                                value={formData.name || ''} 
                                onChange={e => setFormData({ ...formData, name: e.target.value })} 
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-hidden focus:border-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                Assigned Class / Grade
                            </label>
                            <select 
                                id="select-student-profile-class"
                                value={formData.classId || ''} 
                                onChange={e => setFormData({ ...formData, classId: e.target.value })} 
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-hidden focus:border-primary-500"
                            >
                                {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                Date of Birth
                            </label>
                            <input 
                                id="input-student-profile-dob"
                                type="date"
                                value={formData.dateOfBirth ? formData.dateOfBirth.split('T')[0] : ''} 
                                onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })} 
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-hidden focus:border-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                Enrollment Status
                            </label>
                            <select 
                                id="select-student-profile-status"
                                value={formData.status || 'Active'} 
                                onChange={e => setFormData({ ...formData, status: e.target.value })} 
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-hidden focus:border-primary-500"
                            >
                                <option value={StudentStatus.Active}>Active Scholar</option>
                                <option value={StudentStatus.Inactive}>Suspended / Inactive</option>
                                <option value={StudentStatus.Graduated}>Graduated Alum</option>
                            </select>
                        </div>
                        <div className="col-span-1 sm:col-span-2">
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                Residential / Physical Address
                            </label>
                            <input 
                                id="input-student-profile-address"
                                value={formData.guardianAddress || ''} 
                                onChange={e => setFormData({ ...formData, guardianAddress: e.target.value })} 
                                placeholder="Estate, Street, House / Flat number"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-hidden focus:border-primary-500"
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'guardian' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                Primary Guardian Name
                            </label>
                            <input 
                                id="input-student-profile-guardian-name"
                                value={formData.guardianName || ''} 
                                onChange={e => setFormData({ ...formData, guardianName: e.target.value })} 
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-hidden focus:border-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                Guardian Phone Number
                            </label>
                            <div className="relative">
                                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input 
                                    id="input-student-profile-guardian-phone"
                                    value={formData.guardianContact || ''} 
                                    onChange={e => setFormData({ ...formData, guardianContact: e.target.value })} 
                                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-hidden focus:border-primary-500"
                                    placeholder="07XXXXXXXX"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                Guardian Email Address
                            </label>
                            <div className="relative">
                                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input 
                                    id="input-student-profile-guardian-email"
                                    type="email"
                                    value={formData.guardianEmail || ''} 
                                    onChange={e => setFormData({ ...formData, guardianEmail: e.target.value })} 
                                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-hidden focus:border-primary-500"
                                    placeholder="parent@example.com"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                Emergency Alternative Contact
                            </label>
                            <input 
                                id="input-student-profile-emergency"
                                value={formData.emergencyContact || ''} 
                                onChange={e => setFormData({ ...formData, emergencyContact: e.target.value })} 
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-hidden focus:border-primary-500"
                                placeholder="Name / Alternate phone"
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'communication' && (
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                        {loadingLogs ? (
                            <div className="space-y-2">
                                <Skeleton className="h-14 w-full rounded-xl" />
                                <Skeleton className="h-14 w-full rounded-xl" />
                            </div>
                        ) : studentLogs.length === 0 ? (
                            <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                                <Mail className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                    No communication or SMS dispatches logged for this scholar yet.
                                </p>
                            </div>
                        ) : (
                            studentLogs.map(log => (
                                <div key={log.id} className="p-3.5 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
                                            {log.type} • Sent by {log.sentBy}
                                        </span>
                                        <span>{new Date(log.date).toLocaleDateString()} {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <p className="text-xs font-normal text-slate-700 dark:text-slate-200 leading-relaxed bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                                        "{log.message}"
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
};

// =================================================================================
// Main Students View
// =================================================================================

const StudentsView: React.FC = () => {
    const { addNotification, openIdCardModal, formatCurrency, schoolInfo } = useData();
    const queryClient = useQueryClient();
    
    // UI State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClass, setSelectedClass] = useState('all');
    const [balanceFilter, setBalanceFilter] = useState<'all' | 'debtors' | 'cleared'>('all');
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
    const [page, setPage] = useState(1);
    
    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
    const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);
    const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
    const [isBatchIdModalOpen, setIsBatchIdModalOpen] = useState(false);
    const [selectedStudentIdsForBatch, setSelectedStudentIdsForBatch] = useState<string[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    const initialStudentState: any = {
        name: '', 
        classId: '', 
        profileImage: DEFAULT_AVATAR,
        guardianName: '', 
        guardianContact: '', 
        guardianAddress: '', 
        guardianEmail: '', 
        emergencyContact: '', 
        dateOfBirth: '',
        notifyGuardianEmail: true
    };
    const [newStudent, setNewStudent] = useState<any>(initialStudentState);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Queries
    const { data: classes = [] } = useQuery({ 
        queryKey: ['classes'], 
        queryFn: () => api.getClasses().then((res: any) => Array.isArray(res) ? res : res.data || []) 
    });

    // Query for paginated table
    const { data: registry, isLoading: registryLoading } = useQuery({
        queryKey: ['students', page, searchTerm, selectedClass],
        queryFn: () => api.getStudents({ 
            page, 
            limit: viewMode === 'cards' ? 12 : 15, 
            search: searchTerm || undefined, 
            classId: selectedClass !== 'all' ? selectedClass : undefined 
        }),
        placeholderData: (prev) => prev
    });

    // Full unpaginated dataset for institutional MIS summaries & CSV exports
    const { data: allStudentsData } = useQuery({
        queryKey: ['students-all-summary'],
        queryFn: () => api.getStudents({ pagination: 'false', limit: 3000 }).then(res => res.data || res || [])
    });

    const allStudents: Student[] = useMemo(() => {
        if (Array.isArray(allStudentsData)) return allStudentsData;
        if (allStudentsData?.data && Array.isArray(allStudentsData.data)) return allStudentsData.data;
        return [];
    }, [allStudentsData]);

    const rawStudents: Student[] = useMemo(() => {
        if (!registry) return [];
        if (Array.isArray(registry?.data)) return registry.data;
        if (Array.isArray(registry)) return registry;
        return [];
    }, [registry]);
    const totalPages = registry?.last_page || Math.max(1, Math.ceil((registry?.total || rawStudents.length) / (viewMode === 'cards' ? 12 : 15))) || 1;

    // Client-side filter for debtors/cleared if active
    const students = useMemo(() => {
        let list = rawStudents;
        if (balanceFilter === 'debtors') {
            return list.filter((s: any) => (s.balance || 0) > 0);
        }
        if (balanceFilter === 'cleared') {
            return list.filter((s: any) => (s.balance || 0) <= 0);
        }
        return list;
    }, [rawStudents, balanceFilter]);

    // Strategic Executive Metrics
    const metrics = useMemo(() => {
        const pool = allStudents.length > 0 ? allStudents : rawStudents;
        const total = pool.length;
        const activeCount = pool.filter(s => s.status !== StudentStatus.Inactive).length;
        const debtors = pool.filter(s => (s.balance || 0) > 0);
        const totalArrears = debtors.reduce((sum, s) => sum + (s.balance || 0), 0);
        const clearedCount = pool.filter(s => (s.balance || 0) <= 0).length;
        const collectionRate = total > 0 ? Math.round((clearedCount / total) * 100) : 100;
        
        return {
            total,
            activeCount,
            debtorsCount: debtors.length,
            totalArrears,
            clearedCount,
            collectionRate,
            classesCount: classes.length
        };
    }, [allStudents, rawStudents, classes]);

    // Enrollment Mutation with automated parent notification and portal account provisioning
    const enrollMutation = useMutation({
        mutationFn: async (studentPayload: any) => {
            const shouldNotify = studentPayload.notifyGuardianEmail !== false;
            const created = await api.createStudent(studentPayload);
            return { student: created, shouldNotify, guardianEmail: studentPayload.guardianEmail, guardianName: studentPayload.guardianName };
        },
        onSuccess: async ({ student, shouldNotify, guardianEmail, guardianName }) => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
            queryClient.invalidateQueries({ queryKey: ['students-all-summary'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
            queryClient.invalidateQueries({ queryKey: ['communication-logs'] });
            queryClient.invalidateQueries({ queryKey: ['users'] });

            if (shouldNotify && (student.guardianEmail || guardianEmail)) {
                const targetEmail = student.guardianEmail || guardianEmail;
                const targetName = student.guardianName || guardianName || 'Parent / Guardian';
                try {
                    await sendParentWelcomeEmail(targetName, targetEmail, 'Parent@2026', student.name);
                    addNotification(`Scholar ${student.name} enrolled. Portal credentials emailed to ${targetEmail}.`, 'success');
                } catch {
                    addNotification(`Scholar ${student.name} enrolled. Guardian account provisioned for ${targetEmail}.`, 'success');
                }
            } else {
                addNotification(`Scholar ${student.name} enrolled successfully.`, 'success');
            }
            setIsAddModalOpen(false);
            setNewStudent(initialStudentState);
        },
        onError: (e: any) => addNotification(e.message || 'Enrollment rejected.', 'error')
    });

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                // Resize and compress portrait to 400x400 WebP for minimal VPS disk space
                const optimized = await optimizeImage(file, { preset: 'avatar', maxWidth: 400, maxHeight: 400 });
                const formData = new FormData();
                formData.append('file', optimized.file);
                formData.append('dataUrl', optimized.dataUrl);

                api.uploadStudentPhoto(formData)
                    .then(res => {
                        const photoUrl = res?.url && !res.url.includes('undefined') ? res.url : optimized.dataUrl;
                        setNewStudent((prev: any) => ({ ...prev, profileImage: photoUrl }));
                        addNotification(`Portrait optimized for VPS storage (${optimized.formattedStats}) and uploaded!`, 'success');
                    })
                    .catch(() => {
                        // Fallback to optimized dataUrl if upload fails
                        setNewStudent((prev: any) => ({ ...prev, profileImage: optimized.dataUrl }));
                        addNotification(`Portrait resized (${optimized.formattedStats}) and saved locally.`, 'info');
                    });
            } catch (err: any) {
                addNotification('Error optimizing portrait: ' + (err?.message || 'Please choose another photo'), 'error');
            }
        }
    };

    const handleExport = () => {
        const dataToExport = allStudents.length > 0 ? allStudents : rawStudents;
        downloadStudentsCSV(`Scholar_Nominal_Roll_${new Date().toISOString().split('T')[0]}`, dataToExport);
        addNotification(`Exported ${dataToExport.length} scholar records as CSV.`, 'success');
    };

    const handleExportPDF = () => {
        try {
            const dataToExport = allStudents.length > 0 ? allStudents : rawStudents;
            const doc = generateStudentsPDF(dataToExport, schoolInfo);
            const filename = `${schoolInfo?.schoolCode || 'School'}_Nominal_Roll_${new Date().toISOString().slice(0, 10)}.pdf`;
            doc.save(filename);
            addNotification(`Exported ${dataToExport.length} scholar records as PDF document.`, 'success');
        } catch (err) {
            console.error('Failed to generate PDF:', err);
            addNotification('Failed to generate PDF export.', 'error');
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-fade-in-up">
            {/* Top Header Hub */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
                <div>
                    <div className="flex items-center space-x-2">
                        <span className="p-2 bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 rounded-xl border border-primary-200 dark:border-primary-800">
                            <Users className="w-5 h-5" />
                        </span>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                            Scholar Directory & Registry
                        </h1>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
                        Institutional enrollment records, academic placement, guardian directories, and individual ledgers.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                    <button 
                        id="btn-export-students-csv"
                        onClick={handleExport}
                        className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        title="Export Nominal Roll to CSV"
                    >
                        <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                        Export CSV
                    </button>

                    <button 
                        id="btn-export-students-pdf"
                        onClick={handleExportPDF}
                        className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        title="Export Nominal Roll to PDF"
                    >
                        <FileText className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                        Export PDF
                    </button>

                    <button 
                        id="btn-open-batch-ids-modal"
                        onClick={() => {
                            setSelectedStudentIdsForBatch([]);
                            setIsBatchIdModalOpen(true);
                        }}
                        className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60 rounded-xl shadow-xs hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
                        title="Batch generate, download, and print student ID cards"
                    >
                        <CreditCard className="w-3.5 h-3.5 mr-1.5 text-indigo-600 dark:text-indigo-400" />
                        Batch ID Cards
                    </button>

                    <button 
                        id="btn-open-promotion-modal"
                        onClick={() => setIsPromotionModalOpen(true)}
                        className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                        <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                        Grade Promotion
                    </button>

                    <button 
                        id="btn-open-enroll-modal"
                        onClick={() => setIsAddModalOpen(true)}
                        className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-primary-600 rounded-xl shadow-sm hover:bg-primary-700 active:scale-98 transition-all"
                    >
                        <Plus className="w-4 h-4 mr-1.5" />
                        Enroll Scholar
                    </button>
                </div>
            </div>

            {/* Strategic KPI Metric Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white dark:bg-slate-800/80 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Total Enrolled</span>
                        <GraduationCap className="w-4 h-4 text-primary-600" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                        {metrics.total}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                        <span>{metrics.activeCount} actively attending</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800/80 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Fee Debtors</span>
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-red-600 dark:text-red-400">
                        {metrics.debtorsCount}
                    </div>
                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 truncate">
                        Arrears: {formatCurrency(metrics.totalArrears)}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800/80 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Cleared Scholars</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                        {metrics.clearedCount}
                    </div>
                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                        {metrics.collectionRate}% account compliance
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800/80 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Class Streams</span>
                        <Building className="w-4 h-4 text-primary-500" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                        {metrics.classesCount}
                    </div>
                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                        Registered academic cohorts
                    </div>
                </div>
            </div>

            {/* Smart Filter & View Controls */}
            <div className="bg-white dark:bg-slate-800/90 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                <div className="flex flex-col sm:flex-row items-center gap-3 flex-1">
                    {/* Live Search */}
                    <div className="relative w-full sm:w-80">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input 
                            id="input-search-scholars"
                            type="text" 
                            placeholder="Search by scholar name or admission #..." 
                            value={searchTerm} 
                            onChange={e => { setSearchTerm(e.target.value); setPage(1); }} 
                            className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-primary-500 transition-colors"
                        />
                    </div>

                    {/* Class Filter */}
                    <div className="w-full sm:w-48">
                        <select 
                            id="select-filter-class"
                            value={selectedClass} 
                            onChange={e => { setSelectedClass(e.target.value); setPage(1); }} 
                            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-hidden focus:border-primary-500"
                        >
                            <option value="all">All Academic Grades</option>
                            {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    {/* Balance Status Filter */}
                    <div className="w-full sm:w-44">
                        <select 
                            id="select-filter-balance"
                            value={balanceFilter} 
                            onChange={e => setBalanceFilter(e.target.value as any)} 
                            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-hidden focus:border-primary-500"
                        >
                            <option value="all">All Balance Statuses</option>
                            <option value="debtors">Debtors Only (Arrears &gt; 0)</option>
                            <option value="cleared">Cleared Only (Zero Balance)</option>
                        </select>
                    </div>
                </div>

                {/* View Toggle (Table vs Cards) */}
                <div className="flex items-center justify-end space-x-1.5 border-t lg:border-t-0 pt-3 lg:pt-0">
                    <button 
                        id="btn-view-mode-table"
                        onClick={() => setViewMode('table')}
                        className={`p-2 rounded-xl transition-colors ${
                            viewMode === 'table' 
                                ? 'bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800' 
                                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                        title="Tabular Ledger View"
                    >
                        <List className="w-4 h-4" />
                    </button>
                    <button 
                        id="btn-view-mode-cards"
                        onClick={() => setViewMode('cards')}
                        className={`p-2 rounded-xl transition-colors ${
                            viewMode === 'cards' 
                                ? 'bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800' 
                                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                        title="Scholar Cards View"
                    >
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Results Counter */}
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1 font-medium">
                <span>
                    Showing {students.length} scholars {selectedClass !== 'all' ? `in selected grade` : `across all grades`}
                </span>
                <span>Page {page} of {totalPages}</span>
            </div>

            {/* ========================================================= */}
            {/* View Mode: TABLE */}
            {/* ========================================================= */}
            {viewMode === 'table' && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    <th className="px-5 py-3.5">Scholar Identity</th>
                                    <th className="px-5 py-3.5">Admission #</th>
                                    <th className="px-5 py-3.5">Current Grade</th>
                                    <th className="px-5 py-3.5">Guardian Contact</th>
                                    <th className="px-5 py-3.5 text-right">Fee Balance</th>
                                    <th className="px-5 py-3.5 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
                                {registryLoading ? (
                                    Array.from({ length: 6 }).map((_, i) => (
                                        <tr key={i}>
                                            <td colSpan={6} className="px-5 py-3.5">
                                                <Skeleton className="h-9 w-full rounded-xl" />
                                            </td>
                                        </tr>
                                    ))
                                ) : students.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-16 text-slate-400 dark:text-slate-500 font-medium">
                                            No matching scholar records found.
                                        </td>
                                    </tr>
                                ) : (
                                    students.map((s: any) => {
                                        const bal = s.balance ?? 0;
                                        const hasDebt = bal > 0;
                                        return (
                                            <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                                                <td className="px-5 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <img 
                                                            src={s.profileImage || DEFAULT_AVATAR} 
                                                            alt={s.name}
                                                            className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                                                        />
                                                        <div>
                                                            <span className="font-bold text-slate-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer block leading-snug"
                                                                  onClick={() => { setSelectedStudent(s); setIsProfileModalOpen(true); }}>
                                                                {s.name}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-medium">
                                                                {s.guardianName ? `Parent: ${s.guardianName}` : 'Parent not listed'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                                        {s.admissionNumber}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300">
                                                        {s.class || classes.find((c: any) => c.id === s.classId)?.name || 'General'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                                                    <div className="flex items-center gap-1.5 font-medium">
                                                        <Phone className="w-3 h-3 text-slate-400" />
                                                        <span>{s.guardianContact || 'No contact phone'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3 text-right">
                                                    <span className={`font-bold text-sm ${hasDebt ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                        {formatCurrency(bal)}
                                                    </span>
                                                    <span className={`block text-[10px] font-semibold ${hasDebt ? 'text-red-500' : 'text-emerald-500'}`}>
                                                        {hasDebt ? 'Arrears' : 'Cleared'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 text-center">
                                                    <div className="inline-flex items-center gap-1.5">
                                                        <button 
                                                            id={`btn-id-card-student-${s.id}`}
                                                            onClick={() => openIdCardModal(s, 'student')}
                                                            className="px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-lg transition-colors inline-flex items-center gap-1"
                                                            title="Generate, Download & Print Student ID Card"
                                                        >
                                                            <IdCard className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                                                            ID Card
                                                        </button>
                                                        <button 
                                                            id={`btn-audit-student-${s.id}`}
                                                            onClick={() => { setSelectedStudent(s); setIsProfileModalOpen(true); }}
                                                            className="px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                                                            title="Profile & Academic Audit"
                                                        >
                                                            Profile
                                                        </button>
                                                        <button 
                                                            id={`btn-ledger-student-${s.id}`}
                                                            onClick={() => { setSelectedStudent(s); setIsBillingModalOpen(true); }}
                                                            className="px-2.5 py-1 text-xs font-semibold text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-950/40 hover:bg-primary-100 dark:hover:bg-primary-900/60 rounded-lg transition-colors"
                                                            title="Financial Ledger & Statement"
                                                        >
                                                            Ledger
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* View Mode: CARDS GRID */}
            {/* ========================================================= */}
            {viewMode === 'cards' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {registryLoading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <Skeleton key={i} className="h-44 w-full rounded-2xl" />
                        ))
                    ) : students.length === 0 ? (
                        <div className="col-span-full text-center py-16 text-slate-400 dark:text-slate-500 font-medium">
                            No matching scholar records found.
                        </div>
                    ) : (
                        students.map((s: any) => {
                            const bal = s.balance ?? 0;
                            const hasDebt = bal > 0;
                            return (
                                <div 
                                    key={s.id} 
                                    className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs hover:border-primary-400 dark:hover:border-primary-600 transition-all flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <img 
                                                    src={s.profileImage || DEFAULT_AVATAR} 
                                                    alt={s.name}
                                                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                                                />
                                                <div>
                                                    <h3 className="font-bold text-slate-900 dark:text-white leading-tight">
                                                        {s.name}
                                                    </h3>
                                                    <span className="text-[11px] font-mono font-semibold text-primary-600 dark:text-primary-400">
                                                        #{s.admissionNumber}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300">
                                                {s.class || classes.find((c: any) => c.id === s.classId)?.name || 'General'}
                                            </span>
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 space-y-1.5 text-xs">
                                            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                                                <span>Guardian:</span>
                                                <span className="font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[150px]">
                                                    {s.guardianName || 'None'}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                                                <span>Contact:</span>
                                                <span className="font-semibold text-slate-700 dark:text-slate-200">
                                                    {s.guardianContact || '-'}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700/60">
                                                <span className="text-slate-500 dark:text-slate-400 font-medium">Balance:</span>
                                                <span className={`font-black text-sm ${hasDebt ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                    {formatCurrency(bal)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
                                        <button 
                                            onClick={() => openIdCardModal(s, 'student')}
                                            className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                            title="View Scholar ID"
                                        >
                                            <IdCard className="w-4 h-4" />
                                        </button>
                                        <div className="flex items-center gap-1.5">
                                            <button 
                                                onClick={() => { setSelectedStudent(s); setIsProfileModalOpen(true); }}
                                                className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
                                            >
                                                Audit
                                            </button>
                                            <button 
                                                onClick={() => { setSelectedStudent(s); setIsBillingModalOpen(true); }}
                                                className="px-3 py-1.5 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                                            >
                                                Ledger
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* Pagination Controls */}
            <div className="pt-2">
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>

            {/* ========================================================= */}
            {/* SCHOLAR ENROLLMENT MODAL */}
            {/* ========================================================= */}
            <Modal 
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)} 
                title="Enroll New Scholar" 
                size="xl"
                footer={
                    <div className="flex justify-end gap-2.5 w-full">
                        <button 
                            id="btn-enroll-discard"
                            type="button" 
                            onClick={() => setIsAddModalOpen(false)} 
                            className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                        >
                            Discard
                        </button>
                        <button 
                            id="btn-enroll-submit"
                            type="button" 
                            onClick={() => enrollMutation.mutate(newStudent)} 
                            disabled={enrollMutation.isPending || !newStudent.name || !newStudent.classId} 
                            className="inline-flex items-center px-6 py-2.5 bg-primary-600 text-white rounded-xl font-semibold text-xs shadow-sm hover:bg-primary-700 transition-colors disabled:opacity-50"
                        >
                            {enrollMutation.isPending ? <Spinner /> : 'Finalize Enrollment'}
                        </button>
                    </div>
                }
            >
                <div className="space-y-5">
                    {/* Scholar Photo Selection */}
                    <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <img 
                            src={newStudent.profileImage || DEFAULT_AVATAR} 
                            alt="Scholar Preview" 
                            className="w-16 h-16 rounded-2xl object-cover border-2 border-white dark:border-slate-700 shadow-xs"
                        />
                        <div className="space-y-1">
                            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                                Scholar Passport Photo
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                Attach official ID portrait via file upload or live camera.
                            </p>
                            <div className="flex items-center gap-2 pt-1">
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    ref={fileInputRef} 
                                    onChange={handlePhotoUpload} 
                                    className="hidden" 
                                />
                                <button 
                                    type="button" 
                                    onClick={() => fileInputRef.current?.click()} 
                                    className="px-3 py-1 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-100 transition-colors"
                                >
                                    <Upload className="w-3 h-3 mr-1 inline" />
                                    Upload Photo
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setIsCaptureModalOpen(true)} 
                                    className="px-3 py-1 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-100 transition-colors"
                                >
                                    <Camera className="w-3 h-3 mr-1 inline" />
                                    Take Webcam Photo
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                Full Legal Name *
                            </label>
                            <input 
                                id="input-enroll-name"
                                value={newStudent.name} 
                                onChange={e => setNewStudent({ ...newStudent, name: e.target.value })} 
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-hidden focus:border-primary-500" 
                                placeholder="Firstname Middlename Surname"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                Admitted Grade / Class *
                            </label>
                            <select 
                                id="select-enroll-class"
                                value={newStudent.classId} 
                                onChange={e => setNewStudent({ ...newStudent, classId: e.target.value })} 
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-hidden focus:border-primary-500"
                                required
                            >
                                <option value="">Select Target Class...</option>
                                {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                Legal Guardian / Parent Name
                            </label>
                            <input 
                                id="input-enroll-guardian"
                                value={newStudent.guardianName} 
                                onChange={e => setNewStudent({ ...newStudent, guardianName: e.target.value })} 
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-hidden focus:border-primary-500" 
                                placeholder="Full guardian identity"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                Primary Phone Number
                            </label>
                            <input 
                                id="input-enroll-phone"
                                value={newStudent.guardianContact} 
                                onChange={e => setNewStudent({ ...newStudent, guardianContact: e.target.value })} 
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-hidden focus:border-primary-500" 
                                placeholder="07XXXXXXXX"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                Notification Email Address
                            </label>
                            <input 
                                id="input-enroll-email"
                                type="email" 
                                value={newStudent.guardianEmail} 
                                onChange={e => setNewStudent({ ...newStudent, guardianEmail: e.target.value })} 
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-hidden focus:border-primary-500" 
                                placeholder="guardian@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                Date of Birth
                            </label>
                            <input 
                                id="input-enroll-dob"
                                type="date" 
                                value={newStudent.dateOfBirth} 
                                onChange={e => setNewStudent({ ...newStudent, dateOfBirth: e.target.value })} 
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-hidden focus:border-primary-500"
                            />
                        </div>
                        <div className="col-span-1 sm:col-span-2">
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                Residential / Home Address
                            </label>
                            <input 
                                id="input-enroll-address"
                                value={newStudent.guardianAddress} 
                                onChange={e => setNewStudent({ ...newStudent, guardianAddress: e.target.value })} 
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-hidden focus:border-primary-500" 
                                placeholder="Estate, town, residential landmarks"
                            />
                        </div>

                        {/* Automated Parent Notification & Portal Credential Toggle */}
                        <div className="col-span-1 sm:col-span-2 mt-1 p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex items-start gap-3">
                            <input 
                                id="input-enroll-notify-email"
                                type="checkbox" 
                                checked={newStudent.notifyGuardianEmail ?? true} 
                                onChange={e => setNewStudent({ ...newStudent, notifyGuardianEmail: e.target.checked })} 
                                className="mt-1 h-4 w-4 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                            <div className="flex-1">
                                <label htmlFor="input-enroll-notify-email" className="block text-xs font-bold text-indigo-950 dark:text-indigo-200 cursor-pointer">
                                    Immediately Email Parent/Guardian Portal Login Credentials
                                </label>
                                <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80 mt-0.5 leading-relaxed">
                                    When enabled, an active Parent Portal user account is automatically provisioned and an official welcome email containing the portal web link, username, and temporary password will be dispatched to <span className="font-semibold text-indigo-900 dark:text-indigo-100">{newStudent.guardianEmail || 'the guardian email'}</span>.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Sub-Modals */}
            <StudentProfileModal 
                isOpen={isProfileModalOpen} 
                onClose={() => setIsProfileModalOpen(false)} 
                student={selectedStudent} 
                classes={classes}
                onViewIdCard={() => selectedStudent && openIdCardModal(selectedStudent, 'student')}
                onOpenBilling={() => setIsBillingModalOpen(true)}
            />
            
            <StudentBillingModal 
                isOpen={isBillingModalOpen} 
                onClose={() => setIsBillingModalOpen(false)} 
                student={selectedStudent} 
            />
            
            <PromotionModal 
                isOpen={isPromotionModalOpen} 
                onClose={() => setIsPromotionModalOpen(false)} 
            />
            
            <WebcamCaptureModal 
                isOpen={isCaptureModalOpen} 
                onClose={() => setIsCaptureModalOpen(false)} 
                onCapture={url => setNewStudent((prev: any) => ({ ...prev, profileImage: url }))} 
            />

            <BatchIDCardModal
                isOpen={isBatchIdModalOpen}
                onClose={() => setIsBatchIdModalOpen(false)}
                students={allStudents.length > 0 ? allStudents : (registry?.data || [])}
                classes={classes}
                schoolInfo={schoolInfo}
                initialClassId={selectedClass !== 'all' ? selectedClass : undefined}
                preSelectedStudentIds={selectedStudentIdsForBatch}
            />
        </div>
    );
};

export default StudentsView;
