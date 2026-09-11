import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    Building2, 
    ShieldCheck, 
    CreditCard, 
    GraduationCap, 
    KeyRound, 
    Crown, 
    ArrowLeft, 
    Search, 
    Plus, 
    Edit2, 
    Trash2, 
    Check, 
    ChevronRight, 
    Eye, 
    EyeOff, 
    Upload, 
    HelpCircle, 
    SlidersHorizontal, 
    Settings as SettingsIcon,
    RefreshCw,
    Mail,
    Phone,
    UserCheck,
    Lock,
    ExternalLink,
    AlertCircle,
    HardDriveDownload
} from 'lucide-react';
import Modal from '../components/common/Modal';
import UpgradeModal from '../components/common/UpgradeModal';
import DataExportBackupView from '../components/admin/DataExportBackupView';
import type { SchoolInfo, User, FeeItem, SchoolClass, DarajaSettings, GradingRule } from '../types';
import { GradingSystem, Role, Currency, SubscriptionPlan, CbetScore } from '../types';
import { useData } from '../contexts/DataContext';
import * as api from '../services/api';
import Spinner from '../components/common/Spinner';

// =================================================================================
// Sub-Modals with Expert UI Refinement
// =================================================================================

const FeeItemModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    onSave: (item: any) => void; 
    item: FeeItem | null; 
    classes: SchoolClass[]; 
    feeCategories: string[]; 
    isPending?: boolean;
}> = ({ isOpen, onClose, onSave, item, classes, feeCategories, isPending }) => {
    const { schoolInfo } = useData();
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [frequency, setFrequency] = useState<'Termly' | 'Annually' | 'One-Time'>('Termly');
    const [isOptional, setIsOptional] = useState(false);
    const [classFees, setClassFees] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            if (item) {
                setName(item.name); 
                setCategory(item.category); 
                setFrequency(item.frequency as any); 
                setIsOptional(item.isOptional);
                const fees: Record<string, string> = {};
                item.classSpecificFees?.forEach(fee => { fees[fee.classId] = String(fee.amount); });
                setClassFees(fees);
            } else {
                setName(''); 
                setCategory(feeCategories[0] || 'TUITION'); 
                setFrequency('Termly'); 
                setIsOptional(false); 
                setClassFees({});
            }
        }
    }, [item, isOpen, feeCategories]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const classSpecificFees = Object.entries(classFees)
            .map(([classId, amount]) => ({ classId, amount: parseFloat(amount as string) || 0 }))
            .filter(f => f.amount > 0);
            
        onSave({ 
            id: item?.id, 
            name, 
            category: category.trim().toUpperCase(), 
            frequency, 
            isOptional, 
            classSpecificFees 
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={item ? 'Edit Fee Item' : 'New Tuition / Fee Charge'} size="lg">
             <form onSubmit={handleSubmit} className="space-y-5">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                            Charge Title / Name
                        </label>
                        <input 
                            id="input-fee-modal-name"
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            placeholder="e.g. Term 1 Tuition, Science Lab Fee" 
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-hidden focus:border-primary-500" 
                            required
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                            Billing Interval
                        </label>
                        <select 
                            id="select-fee-modal-frequency"
                            value={frequency} 
                            onChange={e => setFrequency(e.target.value as any)} 
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-hidden focus:border-primary-500"
                        >
                            <option value="Termly">Termly (3x per year)</option>
                            <option value="Annually">Annually (Once per year)</option>
                            <option value="One-Time">One-Time (Registration/Exam)</option>
                        </select>
                     </div>
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                            Ledger Category
                        </label>
                        <input 
                            id="input-fee-modal-category"
                            list="cats" 
                            value={category} 
                            onChange={e => setCategory(e.target.value)} 
                            placeholder="TUITION, TRANSPORT, BOARDING..." 
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-hidden focus:border-primary-500" 
                            required
                        />
                        <datalist id="cats">
                            {feeCategories.map(c => <option key={c} value={c}/>)}
                        </datalist>
                     </div>

                     <div className="flex items-center pt-6">
                        <label className="relative flex items-center cursor-pointer">
                            <input 
                                id="checkbox-fee-modal-optional"
                                type="checkbox" 
                                checked={isOptional} 
                                onChange={e => setIsOptional(e.target.checked)} 
                                className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-primary-600"></div>
                            <span className="ml-3 text-xs font-bold text-slate-700 dark:text-slate-300">
                                Optional / Co-Curricular Charge
                            </span>
                        </label>
                     </div>
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                        Class Pricing Matrix ({schoolInfo?.currency || 'KES'})
                    </label>
                    <p className="text-[11px] text-slate-400 mb-2">Check the classes this fee applies to and specify amounts.</p>
                    <div className="max-h-52 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-2 bg-slate-50/50 dark:bg-slate-800/30 custom-scrollbar">
                        {classes.map(c => (
                            <div key={c.id} className="flex items-center space-x-3 bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs">
                                <input 
                                    id={`checkbox-fee-class-${c.id}`}
                                    type="checkbox" 
                                    checked={classFees[c.id] !== undefined} 
                                    onChange={() => setClassFees(p => { 
                                        const n = { ...p }; 
                                        if (n[c.id] !== undefined) delete n[c.id]; 
                                        else n[c.id] = ''; 
                                        return n; 
                                    })} 
                                    className="h-4 w-4 rounded text-primary-600 focus:ring-0 border-slate-300 dark:border-slate-600"
                                />
                                <span className="flex-1 text-xs font-bold text-slate-700 dark:text-slate-200">{c.name}</span>
                                {classFees[c.id] !== undefined && (
                                    <div className="flex items-center bg-slate-50 dark:bg-slate-900 rounded-lg px-2 py-1 border border-slate-200 dark:border-slate-700">
                                        <span className="text-[10px] font-bold text-slate-400 mr-1.5">{schoolInfo?.currency || 'KES'}</span>
                                        <input 
                                            id={`input-fee-amount-${c.id}`}
                                            type="number" 
                                            value={classFees[c.id]} 
                                            onChange={e => setClassFees(p => ({ ...p, [c.id]: e.target.value }))} 
                                            className="w-24 bg-transparent font-bold text-primary-600 dark:text-primary-400 text-right text-xs outline-hidden" 
                                            placeholder="0" 
                                            autoFocus
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                 </div>

                 <div className="pt-2 flex justify-end space-x-3">
                     <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                     >
                        Cancel
                     </button>
                     <button 
                        id="btn-save-fee-item"
                        type="submit" 
                        disabled={isPending} 
                        className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all flex items-center"
                     >
                        {isPending ? <Spinner /> : 'Save Fee Charge'}
                     </button>
                 </div>
             </form>
        </Modal>
    );
};

const UserModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    onSave: (u: any) => void; 
    user: User | null; 
    isPending?: boolean 
}> = ({ isOpen, onClose, onSave, user, isPending }) => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: Role.Teacher });
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (user) setFormData({ name: user.name, email: user.email, password: '', role: user.role });
        else setFormData({ name: '', email: '', password: '', role: Role.Teacher });
        setShowPassword(false);
    }, [user, isOpen]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={user ? 'Edit User Privileges' : 'Issue New User Credentials'} size="md">
            <form onSubmit={e => { e.preventDefault(); onSave({ ...formData, id: user?.id }); }} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Full Legal Name
                    </label>
                    <input 
                        id="input-user-modal-name"
                        value={formData.name} 
                        onChange={e => setFormData({ ...formData, name: e.target.value })} 
                        placeholder="e.g. John Kamau, Sarah Ochieng" 
                        className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-primary-500" 
                        required
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Official Email Address
                    </label>
                    <input 
                        id="input-user-modal-email"
                        type="email"
                        value={formData.email} 
                        onChange={e => setFormData({ ...formData, email: e.target.value })} 
                        placeholder="e.g. staff@school.ac.ke" 
                        className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-primary-500" 
                        required
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        {user ? "Reset Password (Leave blank to keep current)" : "Access Password"}
                    </label>
                    <div className="relative">
                        <input 
                            id="input-user-modal-password"
                            type={showPassword ? "text" : "password"} 
                            value={formData.password} 
                            onChange={e => setFormData({ ...formData, password: e.target.value })} 
                            placeholder={user ? "••••••••" : "Minimum 6 characters"} 
                            className="w-full pl-3.5 pr-10 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-primary-500" 
                            required={!user}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Assigned System Role
                    </label>
                    <select 
                        id="select-user-modal-role"
                        value={formData.role} 
                        onChange={e => setFormData({ ...formData, role: e.target.value as Role })} 
                        className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-primary-500"
                    >
                        {Object.values(Role).map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>

                <div className="pt-2 flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        id="btn-save-user-identity"
                        type="submit" 
                        disabled={isPending} 
                        className="px-5 py-2.5 bg-slate-900 hover:bg-black dark:bg-primary-600 dark:hover:bg-primary-500 text-white rounded-xl font-bold text-xs shadow-xs transition-all flex items-center"
                    >
                        {isPending ? <Spinner /> : 'Commit Identity'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

// =================================================================================
// Main Settings Component
// =================================================================================

const SettingsView: React.FC = () => {
    const { schoolInfo, updateSchoolInfo, addNotification, uploadLogo, formatCurrency } = useData();
    const queryClient = useQueryClient();
    const [activeSection, setActiveSection] = useState<'hub' | 'info' | 'users' | 'fee_structure' | 'grading' | 'mpesa' | 'backup'>('hub');
    const [hubSearchQuery, setHubSearchQuery] = useState('');
    const logoInputRef = useRef<HTMLInputElement>(null);
    const [localSchoolInfo, setLocalSchoolInfo] = useState<SchoolInfo | null>(null);
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [userRoleFilter, setUserRoleFilter] = useState('ALL');

    // Queries
    const { data: users = [] } = useQuery({ 
        queryKey: ['users'], 
        queryFn: api.getUsers, 
        enabled: activeSection === 'users' || activeSection === 'hub' 
    });
    const { data: feeStructure = [] } = useQuery({ 
        queryKey: ['fee-structure'], 
        queryFn: api.getFeeStructure, 
        enabled: activeSection === 'fee_structure' || activeSection === 'hub' 
    });
    const { data: gradingScale = [] } = useQuery({ 
        queryKey: ['grading-scale'], 
        queryFn: api.getGradingScale, 
        enabled: activeSection === 'grading' || activeSection === 'hub' 
    });
    const { data: classes = [] } = useQuery({ 
        queryKey: ['classes'], 
        queryFn: () => api.getClasses().then((res: any) => Array.isArray(res) ? res : res.data || []) 
    });
    const { data: darajaSettings } = useQuery({ 
        queryKey: ['daraja'], 
        queryFn: api.getDarajaSettings, 
        enabled: activeSection === 'mpesa' || activeSection === 'hub' 
    });

    // Mutations
    const userMutation = useMutation({
        mutationFn: (d: any) => d.id ? api.updateUser(d.id, d) : api.createUser(d),
        onSuccess: () => { 
            queryClient.invalidateQueries({ queryKey: ['users'] }); 
            setIsUserModalOpen(false); 
            addNotification('User privileges synchronized', 'success'); 
        }
    });

    const feeMutation = useMutation({
        mutationFn: (d: any) => d.id ? api.updateFeeItem(d.id, d) : api.createFeeItem(d),
        onSuccess: () => { 
            queryClient.invalidateQueries({ queryKey: ['fee-structure'] }); 
            setIsFeeModalOpen(false); 
            addNotification('Fee schedule synchronized', 'success'); 
        }
    });

    const gradingMutation = useMutation({
        mutationFn: (d: any) => d.id ? api.updateGradingRule(d.id, d) : api.createGradingRule(d),
        onSuccess: () => { 
            queryClient.invalidateQueries({ queryKey: ['grading-scale'] }); 
            addNotification('Academic rubric synchronized', 'success'); 
        }
    });

    const darajaMutation = useMutation({
        mutationFn: api.updateDarajaSettings,
        onSuccess: () => { addNotification('M-Pesa Gateway credentials secured', 'success'); }
    });

    // States
    const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
    const [editingFeeItem, setEditingFeeItem] = useState<FeeItem | null>(null);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [localDaraja, setLocalDaraja] = useState<any>({});
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [showDarajaSecret, setShowDarajaSecret] = useState(false);
    const [isUpdatingGrading, setIsUpdatingGrading] = useState(false);

    const handleSwitchGradingSystem = async (system: GradingSystem) => {
        if (!localSchoolInfo) return;
        if (localSchoolInfo.gradingSystem === system) {
            addNotification(`Active framework is already ${system === GradingSystem.CBC ? 'CBC' : 'Traditional Numerical Scale'}`, 'info');
            return;
        }
        const updated = { ...localSchoolInfo, gradingSystem: system };
        setLocalSchoolInfo(updated);
        setIsUpdatingGrading(true);
        try {
            await updateSchoolInfo(updated);
            queryClient.invalidateQueries({ queryKey: ['school-info'] });
            addNotification(`Evaluation framework switched to ${system === GradingSystem.CBC ? 'Competency-Based Curriculum (CBC)' : 'Traditional Numerical Scale'}`, 'success');
        } catch (err) {
            console.error("Failed to update grading system", err);
            addNotification('Failed to update grading framework', 'error');
            if (schoolInfo) setLocalSchoolInfo(schoolInfo);
        } finally {
            setIsUpdatingGrading(false);
        }
    };

    useEffect(() => { if (schoolInfo) setLocalSchoolInfo(schoolInfo); }, [schoolInfo]);
    useEffect(() => { if (darajaSettings) setLocalDaraja(darajaSettings); }, [darajaSettings]);

    const feeCategories = useMemo(() => {
        const items = Array.isArray(feeStructure) ? feeStructure : [];
        return [...new Set(items.map((i: any) => i.category))];
    }, [feeStructure]);

    const filteredUsers = useMemo(() => {
        return users.filter((u: User) => {
            const matchesSearch = u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) || 
                                  u.email.toLowerCase().includes(userSearchQuery.toLowerCase());
            const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
            return matchesSearch && matchesRole;
        });
    }, [users, userSearchQuery, userRoleFilter]);

    if (!localSchoolInfo) return <div className="p-20 text-center"><Spinner /></div>;

    const handleSaveInfo = (e: React.FormEvent) => {
        e.preventDefault();
        updateSchoolInfo(localSchoolInfo).then(() => {
            addNotification('Institutional Profile updated', 'success');
        });
    };

    // Navigation item definitions
    const SECTIONS = [
        { 
            id: 'info' as const, 
            title: 'Institutional Profile', 
            group: 'Organization & Identity',
            desc: 'Legal entity name, official crest/logo, registration code, operational currency, and official registry contacts.',
            icon: Building2,
            badge: `${localSchoolInfo.currency || 'KES'} • Active`
        },
        { 
            id: 'users' as const, 
            title: 'Identity Vault', 
            group: 'Organization & Identity',
            desc: 'Manage staff credentials, access roles (Admin, Accountant, Teacher), and system privileges.',
            icon: ShieldCheck,
            badge: `${users.length} Users`
        },
        { 
            id: 'fee_structure' as const, 
            title: 'Financial Ledger', 
            group: 'Tuition & Billing',
            desc: 'Configure tuition fee charges, mandatory vs optional billing, and class-specific pricing matrices.',
            icon: CreditCard,
            badge: `${feeStructure.length} Charges`
        },
        { 
            id: 'mpesa' as const, 
            title: 'Secure Gateway', 
            group: 'Tuition & Billing',
            desc: 'Configure Lipa Na M-Pesa Daraja API v2.0 credentials for instant, automated fee reconciliation.',
            icon: KeyRound,
            badge: localDaraja.environment === 'production' ? 'Production' : 'Sandbox'
        },
        { 
            id: 'grading' as const, 
            title: 'Academic Rubrics', 
            group: 'Curriculum & Cloud',
            desc: 'Switch between Traditional percentage marks (A-E) and CBC Competency outcome qualifiers.',
            icon: GraduationCap,
            badge: localSchoolInfo.gradingSystem === GradingSystem.CBC ? 'CBC Active' : 'Traditional'
        },
        { 
            id: 'backup' as const, 
            title: 'Data Export & Local Backup', 
            group: 'Curriculum & Cloud',
            desc: 'Download complete school records (students, fees, and staff) as CSV or PDF archives for local backup and compliance.',
            icon: HardDriveDownload,
            badge: 'CSV & PDF'
        },
        { 
            id: 'subscription' as const, 
            title: 'Platform Subscription', 
            group: 'Curriculum & Cloud',
            desc: 'Review enterprise license entitlements, active storage quotas, and unlock advanced modules.',
            icon: Crown,
            badge: 'Enterprise'
        },
    ];

    const filteredSections = SECTIONS.filter(s => 
        s.title.toLowerCase().includes(hubSearchQuery.toLowerCase()) ||
        s.desc.toLowerCase().includes(hubSearchQuery.toLowerCase()) ||
        s.group.toLowerCase().includes(hubSearchQuery.toLowerCase())
    );

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in-up">
            {/* Header & Sub-Navigation Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
                <div>
                    <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                        <span className="flex items-center">
                            <SettingsIcon className="w-3.5 h-3.5 mr-1 text-primary-600" />
                            Control Center
                        </span>
                        {activeSection !== 'hub' && (
                            <>
                                <span>/</span>
                                <span className="text-primary-600 dark:text-primary-400 font-bold">
                                    {SECTIONS.find(s => s.id === activeSection)?.title}
                                </span>
                            </>
                        )}
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        {activeSection === 'hub' ? 'Institutional Settings' : SECTIONS.find(s => s.id === activeSection)?.title}
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {activeSection === 'hub' 
                            ? 'Configure institutional identity, access privileges, tuition matrix, and automated billing gateways.'
                            : SECTIONS.find(s => s.id === activeSection)?.desc}
                    </p>
                </div>

                <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
                    {activeSection !== 'hub' && (
                        <button 
                            id="btn-back-to-settings-hub"
                            onClick={() => setActiveSection('hub')}
                            className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs"
                        >
                            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                            Settings Hub
                        </button>
                    )}
                    <button 
                        id="btn-upgrade-plan-header"
                        onClick={() => setIsUpgradeModalOpen(true)}
                        className="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-black dark:bg-primary-600 dark:hover:bg-primary-500 rounded-lg shadow-xs transition-all"
                    >
                        <Crown className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                        Plan Entitlements
                    </button>
                </div>
            </div>

            {/* Persistent Tab Bar when inside a sub-section */}
            {activeSection !== 'hub' && (
                <div className="flex items-center space-x-1.5 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto custom-scrollbar shadow-xs">
                    {SECTIONS.filter(s => s.id !== 'subscription').map(s => {
                        const Icon = s.icon;
                        const isActive = activeSection === s.id;
                        return (
                            <button
                                key={s.id}
                                id={`tab-setting-${s.id}`}
                                onClick={() => setActiveSection(s.id as any)}
                                className={`inline-flex items-center px-3.5 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                                    isActive
                                        ? 'bg-primary-600 text-white shadow-xs'
                                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                            >
                                <Icon className="w-3.5 h-3.5 mr-2" />
                                {s.title}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* HUB DIRECTORY VIEW */}
            {activeSection === 'hub' && (
                <div className="space-y-8">
                    {/* Search & Fast Jump */}
                    <div className="relative max-w-md">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            id="input-settings-hub-search"
                            type="text"
                            placeholder="Search settings, fees, staff accounts, grading rules..."
                            value={hubSearchQuery}
                            onChange={e => setHubSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-primary-500 shadow-xs"
                        />
                    </div>

                    {/* Grouped Enterprise Pillars */}
                    {['Organization & Identity', 'Tuition & Billing', 'Curriculum & Cloud'].map(groupName => {
                        const groupItems = filteredSections.filter(s => s.group === groupName);
                        if (groupItems.length === 0) return null;

                        return (
                            <div key={groupName} className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                        {groupName}
                                    </h3>
                                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800"></div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {groupItems.map(item => {
                                        const Icon = item.icon;
                                        const isSubscription = item.id === 'subscription';

                                        return (
                                            <div
                                                key={item.id}
                                                id={`card-setting-hub-${item.id}`}
                                                onClick={() => isSubscription ? setIsUpgradeModalOpen(true) : setActiveSection(item.id as any)}
                                                className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary-500/50 dark:hover:border-primary-500/50 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                                            >
                                                <div>
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="p-3 bg-slate-50 dark:bg-slate-800 text-primary-600 dark:text-primary-400 rounded-xl group-hover:bg-primary-600 group-hover:text-white transition-colors">
                                                            <Icon className="w-5 h-5" />
                                                        </div>
                                                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                                            {item.badge}
                                                        </span>
                                                    </div>

                                                    <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                                        {item.title}
                                                    </h4>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                                                        {item.desc}
                                                    </p>
                                                </div>

                                                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-primary-600 dark:text-primary-400">
                                                    <span>{isSubscription ? 'View License' : 'Configure Module'}</span>
                                                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* 1. INSTITUTIONAL PROFILE SECTION */}
            {activeSection === 'info' && (
                <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs max-w-4xl">
                    <form onSubmit={handleSaveInfo} className="space-y-8">
                        {/* Crest / Logo Uploader */}
                        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
                            <div 
                                id="btn-upload-logo-trigger"
                                className="relative group cursor-pointer" 
                                onClick={() => logoInputRef.current?.click()}
                            >
                                <img 
                                    src={localSchoolInfo.logoUrl || 'https://i.imgur.com/S5o7W44.png'} 
                                    className="h-24 w-24 rounded-2xl object-cover border-2 border-slate-200 dark:border-slate-700 shadow-xs group-hover:opacity-80 transition-all" 
                                    alt="School Crest"
                                />
                                <div className="absolute inset-0 bg-black/40 rounded-2xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-white">
                                    <Upload className="w-5 h-5 mb-1" />
                                    <span className="text-[9px] font-bold uppercase tracking-wider">Change</span>
                                </div>
                                <input 
                                    type="file" 
                                    ref={logoInputRef} 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={e => {
                                        if (e.target.files?.[0]) {
                                            const fd = new FormData(); 
                                            fd.append('logo', e.target.files[0]);
                                            uploadLogo(fd).then(res => setLocalSchoolInfo({ ...localSchoolInfo, logoUrl: res.logoUrl }));
                                        }
                                    }} 
                                />
                            </div>

                            <div className="text-center sm:text-left">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                    {localSchoolInfo.name || "Institutional Identity"}
                                </h3>
                                <p className="text-xs text-slate-400 mt-1">
                                    Institutional Registration Code: <span className="font-mono font-bold text-primary-600">{localSchoolInfo.schoolCode}</span>
                                </p>
                                <p className="text-[11px] text-slate-500 mt-1">
                                    Recommended format: PNG or SVG with transparent background, minimum 300x300px.
                                </p>
                            </div>
                        </div>

                        {/* Form Fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                    Legal Entity Name
                                </label>
                                <input 
                                    id="input-school-name"
                                    value={localSchoolInfo.name} 
                                    onChange={e => setLocalSchoolInfo({ ...localSchoolInfo, name: e.target.value })} 
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:border-primary-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                    Operational Currency
                                </label>
                                <select 
                                    id="select-school-currency"
                                    value={localSchoolInfo.currency || 'KES'} 
                                    onChange={e => setLocalSchoolInfo({ ...localSchoolInfo, currency: e.target.value as any })} 
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:border-primary-500"
                                >
                                    {Object.values(Currency).map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                    Official Email Address
                                </label>
                                <input 
                                    id="input-school-email"
                                    type="email"
                                    value={localSchoolInfo.email} 
                                    onChange={e => setLocalSchoolInfo({ ...localSchoolInfo, email: e.target.value })} 
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:border-primary-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                    Registry Phone
                                </label>
                                <input 
                                    id="input-school-phone"
                                    value={localSchoolInfo.phone} 
                                    onChange={e => setLocalSchoolInfo({ ...localSchoolInfo, phone: e.target.value })} 
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:border-primary-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                    Primary Evaluation Framework
                                </label>
                                <select 
                                    id="select-school-grading-framework"
                                    value={localSchoolInfo.gradingSystem || GradingSystem.Traditional} 
                                    onChange={e => setLocalSchoolInfo({ ...localSchoolInfo, gradingSystem: e.target.value as GradingSystem })} 
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:border-primary-500"
                                >
                                    <option value={GradingSystem.Traditional}>Traditional Numerical Scale (Marks & Grades)</option>
                                    <option value={GradingSystem.CBC}>Competency-Based Curriculum (CBC Rubrics)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                    Official Tax PIN / KRA PIN
                                </label>
                                <input 
                                    id="input-school-tax-pin"
                                    value={localSchoolInfo.taxPin || ''} 
                                    onChange={e => setLocalSchoolInfo({ ...localSchoolInfo, taxPin: e.target.value })} 
                                    placeholder="e.g. P051234567Z"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:border-primary-500 font-mono"
                                />
                            </div>
                        </div>

                        {/* Banking & Settlement Details for Invoices & Receipts */}
                        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
                            <div>
                                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                    Invoice &amp; Receipt Payment Channels (A4 Printouts)
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    These banking details and M-Pesa business numbers appear directly on all generated A4 student fee invoices and official payment receipts.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                        Lipa Na M-Pesa Paybill No
                                    </label>
                                    <input 
                                        id="input-school-mpesa-paybill"
                                        value={localSchoolInfo.mpesaPaybill || ''} 
                                        onChange={e => setLocalSchoolInfo({ ...localSchoolInfo, mpesaPaybill: e.target.value })} 
                                        placeholder="e.g. 522522 or 247247"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:border-primary-500 font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                        M-Pesa Account Prefix (Optional)
                                    </label>
                                    <input 
                                        id="input-school-mpesa-prefix"
                                        value={localSchoolInfo.mpesaAccountPrefix || ''} 
                                        onChange={e => setLocalSchoolInfo({ ...localSchoolInfo, mpesaAccountPrefix: e.target.value })} 
                                        placeholder="e.g. SCH- or leave blank to use Admission No"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:border-primary-500 font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                        Bank Name
                                    </label>
                                    <input 
                                        id="input-school-bank-name"
                                        value={localSchoolInfo.bankName || ''} 
                                        onChange={e => setLocalSchoolInfo({ ...localSchoolInfo, bankName: e.target.value })} 
                                        placeholder="e.g. Equity Bank Kenya / KCB"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:border-primary-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                        Bank Account Name
                                    </label>
                                    <input 
                                        id="input-school-bank-ac-name"
                                        value={localSchoolInfo.bankAccountName || ''} 
                                        onChange={e => setLocalSchoolInfo({ ...localSchoolInfo, bankAccountName: e.target.value })} 
                                        placeholder="e.g. St. Jude Academy Tuition Collection"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:border-primary-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                        Bank Account Number
                                    </label>
                                    <input 
                                        id="input-school-bank-ac-number"
                                        value={localSchoolInfo.bankAccountNumber || ''} 
                                        onChange={e => setLocalSchoolInfo({ ...localSchoolInfo, bankAccountNumber: e.target.value })} 
                                        placeholder="e.g. 0123456789012"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:border-primary-500 font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                        Bank Branch
                                    </label>
                                    <input 
                                        id="input-school-bank-branch"
                                        value={localSchoolInfo.bankBranch || ''} 
                                        onChange={e => setLocalSchoolInfo({ ...localSchoolInfo, bankBranch: e.target.value })} 
                                        placeholder="e.g. Upper Hill Commercial Center"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:border-primary-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button 
                                id="btn-save-school-info"
                                type="submit" 
                                className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-xs tracking-wider shadow-xs transition-all"
                            >
                                Commit Profile Changes
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* 2. IDENTITY VAULT (USERS & ROLES) SECTION */}
            {activeSection === 'users' && (
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Identity & Access Privileges</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Active credential sets for administrators, accountants, and teaching staff.
                            </p>
                        </div>

                        <button 
                            id="btn-new-user-access"
                            onClick={() => { setEditingUser(null); setIsUserModalOpen(true); }} 
                            className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all"
                        >
                            <Plus className="w-4 h-4 mr-1.5" />
                            Issue User Access
                        </button>
                    </div>

                    {/* Filter & Search Bar */}
                    <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                id="input-search-users"
                                type="text"
                                placeholder="Search by name or email..."
                                value={userSearchQuery}
                                onChange={e => setUserSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-primary-500"
                            />
                        </div>
                        <select
                            id="select-user-role-filter"
                            value={userRoleFilter}
                            onChange={e => setUserRoleFilter(e.target.value)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                        >
                            <option value="ALL">All Roles</option>
                            {Object.values(Role).map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>

                    {/* User Table */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-[11px] font-bold uppercase tracking-wider">
                                    <th className="px-5 py-3">Staff Identity</th>
                                    <th className="px-5 py-3">Privilege Role</th>
                                    <th className="px-5 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                                {filteredUsers.map((u: User) => (
                                    <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-950 flex items-center justify-center font-bold text-primary-700 dark:text-primary-300 text-xs border border-primary-100 dark:border-primary-900">
                                                    {u.name.slice(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 dark:text-white">{u.name}</div>
                                                    <div className="text-[11px] text-slate-400">{u.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <button 
                                                id={`btn-edit-user-${u.id}`}
                                                onClick={() => { setEditingUser(u); setIsUserModalOpen(true); }} 
                                                className="inline-flex items-center text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline"
                                            >
                                                <Edit2 className="w-3.5 h-3.5 mr-1" />
                                                Edit Credentials
                                            </button>
                                        </td>
                                    </tr>
                                ))}

                                {filteredUsers.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs font-semibold">
                                            No user accounts match your search filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 3. FINANCIAL LEDGER (FEE STRUCTURE) SECTION */}
            {activeSection === 'fee_structure' && (
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Tuition & Fee Matrix</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Standardized billing items, class-specific rates, and payment frequencies.
                            </p>
                        </div>

                        <button 
                            id="btn-new-fee-charge"
                            onClick={() => { setEditingFeeItem(null); setIsFeeModalOpen(true); }} 
                            className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all"
                        >
                            <Plus className="w-4 h-4 mr-1.5" />
                            New Fee Charge
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {feeStructure.map((item: any) => (
                            <div 
                                key={item.id} 
                                id={`card-fee-item-${item.id}`}
                                className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800 mb-1.5">
                                                {item.category}
                                            </span>
                                            <h4 className="text-base font-bold text-slate-900 dark:text-white">{item.name}</h4>
                                            <p className="text-[11px] text-slate-400 mt-0.5">
                                                {item.frequency} • {item.isOptional ? 'Optional Charge' : 'Mandatory Tuition'}
                                            </p>
                                        </div>

                                        <button 
                                            id={`btn-edit-fee-item-${item.id}`}
                                            onClick={() => { setEditingFeeItem(item); setIsFeeModalOpen(true); }} 
                                            className="p-2 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                            title="Edit Fee Charge"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Class Pricing Breakdown */}
                                    <div className="mt-4 space-y-1.5 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                                        {item.classSpecificFees?.map((cf: any) => (
                                            <div 
                                                key={cf.classId} 
                                                className="flex justify-between items-center text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
                                            >
                                                <span className="font-medium text-slate-600 dark:text-slate-300">
                                                    {classes.find((c: any) => c.id === cf.classId)?.name || cf.classId}
                                                </span>
                                                <span className="font-bold text-slate-900 dark:text-white">
                                                    {formatCurrency(cf.amount)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 4. ACADEMIC RUBRICS SECTION */}
            {activeSection === 'grading' && (
                <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-8 max-w-4xl">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    Active Academic Evaluation Framework
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Select the primary grading system for your institution. Click either card to switch frameworks.
                                </p>
                            </div>
                            {isUpdatingGrading && (
                                <span className="inline-flex items-center text-xs font-semibold text-primary-600 bg-primary-50 dark:bg-primary-950/50 px-2.5 py-1 rounded-md animate-pulse">
                                    <Spinner />
                                    <span className="ml-2">Updating...</span>
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button 
                                type="button"
                                id="btn-grading-traditional"
                                disabled={isUpdatingGrading}
                                onClick={() => handleSwitchGradingSystem(GradingSystem.Traditional)} 
                                className={`p-5 rounded-xl border-2 transition-all text-left relative cursor-pointer focus:outline-none ${
                                    localSchoolInfo.gradingSystem === GradingSystem.Traditional 
                                        ? 'border-primary-600 bg-primary-50/70 dark:bg-primary-950/30 shadow-sm ring-2 ring-primary-500/20' 
                                        : 'border-slate-200 dark:border-slate-800 hover:border-primary-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2.5">
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                                            localSchoolInfo.gradingSystem === GradingSystem.Traditional
                                                ? 'border-primary-600 bg-primary-600'
                                                : 'border-slate-300 dark:border-slate-600'
                                        }`}>
                                            {localSchoolInfo.gradingSystem === GradingSystem.Traditional && (
                                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                            )}
                                        </div>
                                        <h5 className="font-bold text-slate-900 dark:text-white text-sm">Traditional Numerical Scale</h5>
                                    </div>
                                    {localSchoolInfo.gradingSystem === GradingSystem.Traditional ? (
                                        <span className="inline-flex items-center text-xs font-bold text-primary-700 dark:text-primary-400 bg-primary-100/80 dark:bg-primary-950 px-2 py-0.5 rounded-full">
                                            <Check className="w-3.5 h-3.5 mr-1" /> Active
                                        </span>
                                    ) : (
                                        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 hover:text-primary-600">
                                            Click to select
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-6.5">
                                    Classic percentage benchmarks (0–100%) mapped directly to letter performance categories (A, B, C, D, E).
                                </p>
                            </button>

                            <button 
                                type="button"
                                id="btn-grading-cbc"
                                disabled={isUpdatingGrading}
                                onClick={() => handleSwitchGradingSystem(GradingSystem.CBC)} 
                                className={`p-5 rounded-xl border-2 transition-all text-left relative cursor-pointer focus:outline-none ${
                                    localSchoolInfo.gradingSystem === GradingSystem.CBC 
                                        ? 'border-primary-600 bg-primary-50/70 dark:bg-primary-950/30 shadow-sm ring-2 ring-primary-500/20' 
                                        : 'border-slate-200 dark:border-slate-800 hover:border-primary-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2.5">
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                                            localSchoolInfo.gradingSystem === GradingSystem.CBC
                                                ? 'border-primary-600 bg-primary-600'
                                                : 'border-slate-300 dark:border-slate-600'
                                        }`}>
                                            {localSchoolInfo.gradingSystem === GradingSystem.CBC && (
                                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                            )}
                                        </div>
                                        <h5 className="font-bold text-slate-900 dark:text-white text-sm">Competency-Based Curriculum (CBC)</h5>
                                    </div>
                                    {localSchoolInfo.gradingSystem === GradingSystem.CBC ? (
                                        <span className="inline-flex items-center text-xs font-bold text-primary-700 dark:text-primary-400 bg-primary-100/80 dark:bg-primary-950 px-2 py-0.5 rounded-full">
                                            <Check className="w-3.5 h-3.5 mr-1" /> Active
                                        </span>
                                    ) : (
                                        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 hover:text-primary-600">
                                            Click to select
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-6.5">
                                    Qualitative learner assessment rubric (EE, ME, AE, BE) with 1–8 point competency progression.
                                </p>
                            </button>
                        </div>
                    </div>

                    {localSchoolInfo.gradingSystem === GradingSystem.Traditional ? (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Percentage Thresholds</h4>
                                    <p className="text-xs text-slate-400">Map score percentages to letter performance categories.</p>
                                </div>
                                <button 
                                    id="btn-append-grading-rule"
                                    onClick={() => gradingMutation.mutate({ grade: 'New', minScore: 0, maxScore: 10 })} 
                                    className="inline-flex items-center px-3 py-1.5 text-xs font-bold text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-950/50 transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5 mr-1" />
                                    Append Grade Tier
                                </button>
                            </div>

                            <div className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-xl">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-[11px] font-bold uppercase tracking-wider">
                                            <th className="px-5 py-3">Grade Label</th>
                                            <th className="px-5 py-3 text-center">Minimum Floor (%)</th>
                                            <th className="px-5 py-3 text-right">Maximum Ceiling (%)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                                        {gradingScale.map((rule: GradingRule) => (
                                            <tr key={rule.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-5 py-3 font-bold text-primary-600 dark:text-primary-400 text-base">{rule.grade}</td>
                                                <td className="px-5 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">{rule.minScore}%</td>
                                                <td className="px-5 py-3 text-right font-semibold text-slate-700 dark:text-slate-300">{rule.maxScore}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">CBC Standard Descriptors</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {Object.entries(CbetScore).map(([key, val]) => (
                                    <div key={key} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <p className="text-2xl font-black text-primary-600 dark:text-primary-400">{val}</p>
                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">{key}</p>
                                        <p className="text-[11px] text-slate-400 mt-0.5">Competency performance benchmark</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 5. SECURE GATEWAY (M-PESA DARAJA) SECTION */}
            {activeSection === 'mpesa' && (
                <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs max-w-2xl space-y-6">
                    <div className="flex items-center space-x-3 pb-6 border-b border-slate-200 dark:border-slate-800">
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600">
                            <KeyRound className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Lipa Na M-Pesa Gateway</h3>
                            <p className="text-xs text-slate-400">Daraja API v2.0 REST Webhook Integration</p>
                        </div>
                    </div>

                    <div className="space-y-5">
                        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Environment Mode</label>
                                <p className="text-[11px] text-slate-400">Sandbox for testing, Production for live fee deposits</p>
                            </div>
                            <select 
                                id="select-mpesa-environment"
                                value={localDaraja.environment || 'sandbox'} 
                                onChange={e => setLocalDaraja({ ...localDaraja, environment: e.target.value })}
                                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                            >
                                <option value="sandbox">Sandbox (Testing)</option>
                                <option value="production">Production (Live)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                Lipa Na M-Pesa Paybill / Shortcode
                            </label>
                            <input 
                                id="input-mpesa-paybill"
                                value={localDaraja.paybillNumber || ''} 
                                onChange={e => setLocalDaraja({ ...localDaraja, paybillNumber: e.target.value })} 
                                placeholder="e.g. 522522, 247247, 400200" 
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:border-primary-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                Safaricom Consumer Key
                            </label>
                            <input 
                                id="input-mpesa-consumer-key"
                                value={localDaraja.consumerKey || ''} 
                                onChange={e => setLocalDaraja({ ...localDaraja, consumerKey: e.target.value })} 
                                placeholder="Public API consumer credential" 
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:border-primary-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                Safaricom Consumer Secret
                            </label>
                            <div className="relative">
                                <input 
                                    id="input-mpesa-consumer-secret"
                                    type={showDarajaSecret ? "text" : "password"} 
                                    value={localDaraja.consumerSecret || ''} 
                                    onChange={e => setLocalDaraja({ ...localDaraja, consumerSecret: e.target.value })} 
                                    placeholder="••••••••••••••••••••••••" 
                                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:border-primary-500"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowDarajaSecret(!showDarajaSecret)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showDarajaSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button 
                                id="btn-save-mpesa-gateway"
                                onClick={() => darajaMutation.mutate(localDaraja)} 
                                disabled={darajaMutation.isPending} 
                                className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all flex items-center justify-center disabled:opacity-50"
                            >
                                {darajaMutation.isPending ? <Spinner /> : 'Validate & Lock Gateway Credentials'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 7. DATA EXPORT & LOCAL BACKUP SECTION */}
            {activeSection === 'backup' && (
                <div id="section-settings-data-backup" className="space-y-6">
                    <DataExportBackupView />
                </div>
            )}

            {/* Modals */}
            <FeeItemModal 
                isOpen={isFeeModalOpen} 
                onClose={() => setIsFeeModalOpen(false)} 
                onSave={d => feeMutation.mutate(d)} 
                item={editingFeeItem} 
                classes={classes} 
                feeCategories={feeCategories} 
                isPending={feeMutation.isPending} 
            />
            
            <UserModal 
                isOpen={isUserModalOpen} 
                onClose={() => setIsUserModalOpen(false)} 
                onSave={u => userMutation.mutate(u)} 
                user={editingUser} 
                isPending={userMutation.isPending} 
            />
            
            <UpgradeModal 
                isOpen={isUpgradeModalOpen} 
                onClose={() => setIsUpgradeModalOpen(false)} 
            />
        </div>
    );
};

export default SettingsView;
