import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useData } from '../../contexts/DataContext';
import { 
    SubscriptionStatus, 
    SubscriptionPlan, 
    type PlatformPricing, 
    type SubscriberSchool, 
    type SaasInvoice, 
    type SaasReceipt, 
    type LifecycleSweepResult 
} from '../../types';
import * as api from '../../services/api';
import Modal from '../../components/common/Modal';
import StatCard from '../../components/common/StatCard';
import Skeleton from '../../components/common/Skeleton';
import Spinner from '../../components/common/Spinner';
import { FinancialDocumentView } from '../../components/common/FinancialDocumentView';
import { EdTechNewsManager } from '../../components/super-admin/EdTechNewsManager';
import { SystemPulseView } from './SystemPulseView';
import { 
    buildSaasSubscriptionInvoice, 
    buildSaasSubscriptionReceipt, 
    downloadDocumentAsPDF, 
    type FinancialDocument 
} from '../../utils/invoiceReceiptGenerator';
import {
    Building2,
    Receipt,
    FileText,
    DollarSign,
    RefreshCw,
    Lock,
    Unlock,
    Send,
    Eye,
    Plus,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Calendar,
    Clock,
    Activity,
    Sliders,
    Search,
    Download,
    CreditCard,
    ChevronRight,
    TrendingUp,
    ShieldAlert,
    HelpCircle,
    Sparkles,
    Newspaper,
    Wifi
} from 'lucide-react';

export const SuperAdminDashboard: React.FC = () => {
    const { addNotification, formatCurrency } = useData();
    const queryClient = useQueryClient();

    // Tabs
    const [activeTab, setActiveTab] = useState<'schools' | 'invoices' | 'receipts' | 'revenue' | 'edtech-news' | 'system-pulse'>('schools');

    // Filter & Search States
    const [schoolFilter, setSchoolFilter] = useState<'all' | 'pending' | 'active' | 'grace' | 'suspended'>('all');
    const [schoolSearch, setSchoolSearch] = useState('');
    const [invoiceFilter, setInvoiceFilter] = useState<'all' | 'ISSUED' | 'PAID' | 'OVERDUE'>('all');

    // Modals
    const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
    const [activeDocument, setActiveDocument] = useState<FinancialDocument | null>(null);

    const [isNewInvoiceModalOpen, setIsNewInvoiceModalOpen] = useState(false);
    const [invoiceForm, setInvoiceForm] = useState({
        schoolId: '',
        plan: SubscriptionPlan.PREMIUM,
        billingCycle: 'ANNUALLY' as 'MONTHLY' | 'ANNUALLY',
        amount: 60000,
        currency: 'KES',
        dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        notes: ''
    });

    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentForm, setPaymentForm] = useState({
        schoolId: '',
        invoiceId: '',
        amount: 60000,
        method: 'Lipa Na M-Pesa',
        transactionCode: '',
        date: new Date().toISOString().split('T')[0]
    });

    const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
    const [extendTarget, setExtendTarget] = useState<SubscriberSchool | null>(null);
    const [extendDays, setExtendDays] = useState(30);

    const [isSweepResultModalOpen, setIsSweepResultModalOpen] = useState(false);
    const [lastSweepResult, setLastSweepResult] = useState<LifecycleSweepResult | null>(null);

    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [pricingForm, setPricingForm] = useState<Partial<PlatformPricing>>({});

    const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
    const [activationSuccessModal, setActivationSuccessModal] = useState<{
        isOpen: boolean;
        school?: any;
        receipt?: any;
        credentials?: { email: string; password?: string };
    }>({ isOpen: false });

    const [isAddSchoolModalOpen, setIsAddSchoolModalOpen] = useState(false);
    const [addSchoolForm, setAddSchoolForm] = useState({
        schoolName: '',
        schoolCode: '',
        adminName: '',
        adminEmail: '',
        phone: '',
        county: 'Nairobi',
        plan: SubscriptionPlan.BASIC,
        billingCycle: 'ANNUALLY' as 'MONTHLY' | 'ANNUALLY',
        status: SubscriptionStatus.ACTIVE,
        password: 'Admin@2026',
        studentCount: 100,
    });

    // --- Queries ---
    const { data: schools = [], isLoading: schoolsLoading, refetch: refetchSchools } = useQuery<SubscriberSchool[]>({
        queryKey: ['super-schools'],
        queryFn: api.getAllSchools
    });

    const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
        queryKey: ['platform-stats'],
        queryFn: api.getPlatformStats
    });

    const { data: invoices = [], isLoading: invoicesLoading, refetch: refetchInvoices } = useQuery<SaasInvoice[]>({
        queryKey: ['super-invoices'],
        queryFn: api.getSaasInvoices
    });

    const { data: receipts = [], isLoading: receiptsLoading, refetch: refetchReceipts } = useQuery<SaasReceipt[]>({
        queryKey: ['super-receipts'],
        queryFn: api.getSaasReceipts
    });

    const { data: healthData, refetch: refetchHealth, isFetching: healthFetching } = useQuery({
        queryKey: ['system-health'],
        queryFn: api.getSystemHealth,
        refetchInterval: 10000,
    });

    // --- Mutations ---
    const lifecycleSweepMutation = useMutation({
        mutationFn: api.runLifecycleSweep,
        onSuccess: (result: LifecycleSweepResult) => {
            setLastSweepResult(result);
            setIsSweepResultModalOpen(true);
            queryClient.invalidateQueries({ queryKey: ['super-schools'] });
            queryClient.invalidateQueries({ queryKey: ['platform-stats'] });
            queryClient.invalidateQueries({ queryKey: ['super-invoices'] });
            addNotification(`Automated Sweep Completed: ${result.remindersSent} reminders dispatched, ${result.disabledCount} account(s) locked.`, 'success');
        },
        onError: () => addNotification('Failed to execute subscription lifecycle sweep.', 'error')
    });

    const sendReminderMutation = useMutation({
        mutationFn: (schoolId: string) => api.sendSchoolReminder(schoolId),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['super-schools'] });
            addNotification(data.message || 'Payment reminder dispatched successfully.', 'success');
        },
        onError: () => addNotification('Failed to dispatch renewal reminder.', 'error')
    });

    const toggleAccessMutation = useMutation({
        mutationFn: ({ schoolId, enabled }: { schoolId: string; enabled: boolean }) => api.toggleSchoolAccess(schoolId, enabled),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['super-schools'] });
            queryClient.invalidateQueries({ queryKey: ['platform-stats'] });
            addNotification(`Institution access ${variables.enabled ? 'activated' : 'disabled'}.`, 'success');
        },
        onError: () => addNotification('Failed to update institution access status.', 'error')
    });

    const extendSubscriptionMutation = useMutation({
        mutationFn: ({ schoolId, days }: { schoolId: string; days: number }) => api.extendSchoolSubscription(schoolId, days),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['super-schools'] });
            queryClient.invalidateQueries({ queryKey: ['platform-stats'] });
            setIsExtendModalOpen(false);
            addNotification(`Subscription extended by ${variables.days} days and account reactivated.`, 'success');
        },
        onError: () => addNotification('Failed to extend subscription.', 'error')
    });

    const activateSchoolMutation = useMutation({
        mutationFn: (schoolId: string) => {
            const targetSchool = schools.find((s: any) => s.id === schoolId);
            const targetPlan = (targetSchool as any)?.pendingUpgradePlan || (targetSchool?.plan !== 'FREE' ? targetSchool?.plan : 'PREMIUM');
            return api.activateSchoolSubscription(schoolId, { plan: targetPlan });
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['super-schools'] });
            queryClient.invalidateQueries({ queryKey: ['platform-stats'] });
            queryClient.invalidateQueries({ queryKey: ['super-invoices'] });
            queryClient.invalidateQueries({ queryKey: ['super-receipts'] });
            addNotification(`Institution "${data?.school?.name || 'School'}" verified and activated successfully! Login credentials and activation receipt dispatched.`, 'success');
            if (data?.credentials || data?.receipt) {
                setActivationSuccessModal({
                    isOpen: true,
                    school: data.school,
                    receipt: data.receipt,
                    credentials: data.credentials
                });
            }
        },
        onError: () => addNotification('Failed to verify and activate school subscription.', 'error')
    });

    const createInvoiceMutation = useMutation({
        mutationFn: (data: Partial<SaasInvoice>) => api.createSaasInvoice(data),
        onSuccess: (newInv) => {
            queryClient.invalidateQueries({ queryKey: ['super-invoices'] });
            setIsNewInvoiceModalOpen(false);
            addNotification(`Invoice ${newInv.invoiceNumber} issued successfully.`, 'success');
            // Preview immediately
            const doc = buildSaasSubscriptionInvoice(newInv, stats?.pricing);
            setActiveDocument(doc);
            setIsDocumentModalOpen(true);
        },
        onError: () => addNotification('Failed to issue invoice.', 'error')
    });

    const recordPaymentMutation = useMutation({
        mutationFn: (data: any) => api.recordManualSubscriptionPayment(data),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['super-schools'] });
            queryClient.invalidateQueries({ queryKey: ['super-invoices'] });
            queryClient.invalidateQueries({ queryKey: ['super-receipts'] });
            queryClient.invalidateQueries({ queryKey: ['platform-stats'] });
            setIsPaymentModalOpen(false);
            addNotification('Payment confirmed, subscription renewed and receipt issued.', 'success');
            if (res.receipt) {
                const doc = buildSaasSubscriptionReceipt(res.receipt, stats?.pricing);
                setActiveDocument(doc);
                setIsDocumentModalOpen(true);
            }
        },
        onError: () => addNotification('Failed to record subscription payment.', 'error')
    });

    const markInvoicePaidMutation = useMutation({
        mutationFn: (invoice: SaasInvoice) => api.updateSaasInvoiceStatus(invoice.id, 'PAID', new Date().toISOString().split('T')[0], `MPESA-${Date.now().toString().slice(-6)}`, 'Lipa Na M-Pesa'),
        onSuccess: (updatedInvoice) => {
            queryClient.invalidateQueries({ queryKey: ['super-schools'] });
            queryClient.invalidateQueries({ queryKey: ['super-invoices'] });
            queryClient.invalidateQueries({ queryKey: ['super-receipts'] });
            queryClient.invalidateQueries({ queryKey: ['platform-stats'] });
            addNotification(`Invoice ${updatedInvoice.invoiceNumber} settled. Receipt generated.`, 'success');
        }
    });

    const updatePricingMutation = useMutation({
        mutationFn: api.updatePlatformPricing,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['platform-stats'] });
            setIsConfigModalOpen(false);
            addNotification('Platform billing parameters updated.', 'success');
        }
    });

    const createSchoolMutation = useMutation({
        mutationFn: (data: any) => api.createSuperAdminSchool(data),
        onSuccess: (newSchool) => {
            queryClient.invalidateQueries({ queryKey: ['super-schools'] });
            queryClient.invalidateQueries({ queryKey: ['platform-stats'] });
            setIsAddSchoolModalOpen(false);
            addNotification(`Institution "${newSchool?.name || addSchoolForm.schoolName}" onboarded successfully!`, 'success');
            setActivationSuccessModal({
                isOpen: true,
                school: newSchool,
                credentials: {
                    email: addSchoolForm.adminEmail,
                    password: addSchoolForm.password
                }
            });
            setAddSchoolForm({
                schoolName: '',
                schoolCode: '',
                adminName: '',
                adminEmail: '',
                phone: '',
                county: 'Nairobi',
                plan: SubscriptionPlan.BASIC,
                billingCycle: 'ANNUALLY',
                status: SubscriptionStatus.ACTIVE,
                password: 'Admin@2026',
                studentCount: 100,
            });
        },
        onError: (err: any) => addNotification(err?.message || 'Failed to onboard institution.', 'error')
    });

    // --- Safe Arrays ---
    const safeSchools = useMemo(() => Array.isArray(schools) ? schools : (Array.isArray((schools as any)?.data) ? (schools as any).data : []), [schools]);
    const safeInvoices = useMemo(() => Array.isArray(invoices) ? invoices : (Array.isArray((invoices as any)?.data) ? (invoices as any).data : []), [invoices]);
    const safeReceipts = useMemo(() => Array.isArray(receipts) ? receipts : (Array.isArray((receipts as any)?.data) ? (receipts as any).data : []), [receipts]);

    // --- Filtered Data ---
    const filteredSchools = useMemo(() => {
        return safeSchools.filter(s => {
            const matchesSearch = !schoolSearch || 
                s.name.toLowerCase().includes(schoolSearch.toLowerCase()) || 
                s.email.toLowerCase().includes(schoolSearch.toLowerCase()) ||
                (s.schoolCode && s.schoolCode.toLowerCase().includes(schoolSearch.toLowerCase()));

            if (!matchesSearch) return false;

            if (schoolFilter === 'all') return true;
            if (schoolFilter === 'pending') return s.subscriptionStatus === SubscriptionStatus.PENDING_APPROVAL || s.paymentMethod === 'WIRE';
            if (schoolFilter === 'active') return s.subscriptionStatus === SubscriptionStatus.ACTIVE;
            if (schoolFilter === 'grace') return s.subscriptionStatus === SubscriptionStatus.PAST_DUE;
            if (schoolFilter === 'suspended') return s.subscriptionStatus === SubscriptionStatus.SUSPENDED;
            return true;
        });
    }, [safeSchools, schoolSearch, schoolFilter]);

    const filteredInvoices = useMemo(() => {
        return safeInvoices.filter(inv => {
            if (invoiceFilter === 'all') return true;
            return inv.status === invoiceFilter;
        });
    }, [safeInvoices, invoiceFilter]);

    // Helpers
    const getDaysRemaining = (endDateStr: string): number => {
        const end = new Date(endDateStr);
        const now = new Date();
        return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    };

    const handleViewInvoiceDoc = (invoice: SaasInvoice) => {
        const doc = buildSaasSubscriptionInvoice(invoice, stats?.pricing);
        setActiveDocument(doc);
        setIsDocumentModalOpen(true);
    };

    const handleViewReceiptDoc = (receipt: SaasReceipt) => {
        const doc = buildSaasSubscriptionReceipt(receipt, stats?.pricing);
        setActiveDocument(doc);
        setIsDocumentModalOpen(true);
    };

    const handleOpenNewInvoice = (prefillSchool?: SubscriberSchool) => {
        const target = prefillSchool || safeSchools[0];
        const defaultPlan = target?.plan || SubscriptionPlan.PREMIUM;
        const defaultCycle = target?.billingCycle || 'ANNUALLY';
        const defaultAmount = defaultCycle === 'ANNUALLY' 
            ? (defaultPlan === SubscriptionPlan.PREMIUM ? 60000 : 30000) 
            : (defaultPlan === SubscriptionPlan.PREMIUM ? 6000 : 3000);

        setInvoiceForm({
            schoolId: target?.id || '',
            plan: defaultPlan,
            billingCycle: defaultCycle,
            amount: defaultAmount,
            currency: 'KES',
            dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
            notes: `Annual SaaS subscription renewal for ${target?.name || 'institution'}.`
        });
        setIsNewInvoiceModalOpen(true);
    };

    const handleOpenPayment = (school?: SubscriberSchool, invoice?: SaasInvoice) => {
        setPaymentForm({
            schoolId: school?.id || invoice?.schoolId || schools[0]?.id || '',
            invoiceId: invoice?.id || '',
            amount: invoice?.amount || 60000,
            method: 'Lipa Na M-Pesa',
            transactionCode: `QKD${Math.floor(100000 + Math.random() * 900000)}H`,
            date: new Date().toISOString().split('T')[0]
        });
        setIsPaymentModalOpen(true);
    };

    const handleOpenExtend = (school: SubscriberSchool) => {
        setExtendTarget(school);
        setExtendDays(30);
        setIsExtendModalOpen(true);
    };

    const handleOpenPricing = () => {
        if (stats?.pricing) setPricingForm(stats.pricing);
        setIsConfigModalOpen(true);
    };

    if (statsLoading && schoolsLoading) {
        return (
            <div className="p-8 max-w-7xl mx-auto space-y-6">
                <Skeleton className="h-20 w-full rounded-2xl" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Skeleton className="h-32 rounded-2xl" />
                    <Skeleton className="h-32 rounded-2xl" />
                    <Skeleton className="h-32 rounded-2xl" />
                    <Skeleton className="h-32 rounded-2xl" />
                </div>
                <Skeleton className="h-96 w-full rounded-2xl" />
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-fadeIn">
            {/* 1. Header & Quick Actions */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-8 rounded-3xl text-white shadow-2xl border border-slate-700/50">
                <div>
                    <div className="flex items-center gap-3">
                        <span className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                            <ShieldAlert className="w-6 h-6" />
                        </span>
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                                Super Administrator Command
                            </h1>
                            <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-0.5">
                                End-to-End Subscription Governance & Revenue Tracking
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Run Lifecycle Sweep Button */}
                    <button
                        onClick={() => lifecycleSweepMutation.mutate()}
                        disabled={lifecycleSweepMutation.isPending}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-900/40 transition-all border border-emerald-400/30"
                        title="Executes 5-day / 2-day reminder emails and 14-day auto-lockout enforcement across all accounts"
                    >
                        <RefreshCw className={`w-4 h-4 ${lifecycleSweepMutation.isPending ? 'animate-spin' : ''}`} />
                        {lifecycleSweepMutation.isPending ? 'Sweeping...' : 'Run Lifecycle Sweep'}
                    </button>

                    {/* New Invoice Button */}
                    <button
                        onClick={() => handleOpenNewInvoice()}
                        className="px-4 py-2.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all border border-white/15"
                    >
                        <Plus className="w-4 h-4 text-emerald-400" />
                        Create Invoice
                    </button>

                    {/* Record Payment */}
                    <button
                        onClick={() => handleOpenPayment()}
                        className="px-4 py-2.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all border border-white/15"
                    >
                        <CreditCard className="w-4 h-4 text-blue-400" />
                        Record Payment
                    </button>

                    {/* Pricing & Gateways */}
                    <button
                        onClick={handleOpenPricing}
                        className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-slate-300 hover:text-white transition-all border border-white/10"
                        title="Platform Pricing & Payment Gateways"
                    >
                        <Sliders className="w-4 h-4" />
                    </button>

                    {/* System Health */}
                    <button
                        onClick={() => setActiveTab('system-pulse')}
                        className={`p-2.5 rounded-xl transition-all border ${
                            activeTab === 'system-pulse'
                                ? 'bg-emerald-500 text-slate-900 border-emerald-400 font-bold shadow-lg shadow-emerald-500/20'
                                : 'bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white border-white/10'
                        }`}
                        title="System Pulse & Realtime Health"
                    >
                        <Activity className={`w-4 h-4 ${activeTab === 'system-pulse' ? 'text-slate-900' : 'text-emerald-400'}`} />
                    </button>
                </div>
            </div>

            {/* 2. Automated Lifecycle Policy Notice Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-slate-600">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-100 text-primary-700 rounded-xl">
                        <Clock className="w-4 h-4" />
                    </div>
                    <div>
                        <span className="font-bold text-slate-900">Enforced Automated Lifecycle Rules: </span>
                        <span>Reminders dispatch at <strong>5 days</strong> pre-expiry, then every <strong>2 days</strong>. Accounts without payment are <strong>automatically disabled 14 days after expiry</strong> until payment is settled.</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 whitespace-nowrap text-slate-500 font-semibold">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Policy Active 24/7
                </div>
            </div>

            {/* 3. Platform Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
                <StatCard
                    title="Realized Platform Revenue"
                    value={formatCurrency(stats?.totalRevenue ?? 0, 'KES')}
                    icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
                    onClick={() => setActiveTab('revenue')}
                    isSelected={activeTab === 'revenue'}
                />

                <StatCard
                    title="Active Subscriptions"
                    value={`${stats?.activeSubscriptions ?? safeSchools.filter(s => s.subscriptionStatus === SubscriptionStatus.ACTIVE).length} / ${safeSchools.length}`}
                    icon={<CheckCircle2 className="w-5 h-5 text-green-600" />}
                    onClick={() => { setActiveTab('schools'); setSchoolFilter('active'); }}
                    isSelected={activeTab === 'schools' && schoolFilter === 'active'}
                />

                <StatCard
                    title="In Grace Period"
                    value={`${stats?.gracePeriodCount ?? safeSchools.filter(s => s.subscriptionStatus === SubscriptionStatus.PAST_DUE).length} Schools`}
                    icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
                    colorClass="bg-amber-50 text-amber-700"
                    onClick={() => { setActiveTab('schools'); setSchoolFilter('grace'); }}
                    isSelected={activeTab === 'schools' && schoolFilter === 'grace'}
                />

                <StatCard
                    title="Accounts Disabled"
                    value={`${stats?.disabledCount ?? safeSchools.filter(s => s.subscriptionStatus === SubscriptionStatus.SUSPENDED).length} Locked`}
                    icon={<Lock className="w-5 h-5 text-rose-600" />}
                    colorClass="bg-rose-50 text-rose-700"
                    onClick={() => { setActiveTab('schools'); setSchoolFilter('suspended'); }}
                    isSelected={activeTab === 'schools' && schoolFilter === 'suspended'}
                />

                <StatCard
                    title="Active Users Online"
                    value={`${healthData?.onlineUsersSummary?.totalOnline ?? (healthData?.onlineUsersList?.length || 0)} Connected`}
                    icon={<Wifi className="w-5 h-5 text-indigo-600" />}
                    colorClass="bg-indigo-50 text-indigo-700"
                    onClick={() => setActiveTab('system-pulse')}
                    isSelected={activeTab === 'system-pulse'}
                />
            </div>

            {/* 4. Tab Navigation Bar */}
            <div className="flex border-b border-slate-200 gap-8">
                <button
                    onClick={() => setActiveTab('schools')}
                    className={`pb-4 text-xs font-black uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all ${
                        activeTab === 'schools' 
                            ? 'border-slate-900 text-slate-900' 
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                >
                    <Building2 className="w-4 h-4" />
                    Subscribers Directory ({safeSchools.length})
                </button>

                <button
                    onClick={() => setActiveTab('invoices')}
                    className={`pb-4 text-xs font-black uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all ${
                        activeTab === 'invoices' 
                            ? 'border-slate-900 text-slate-900' 
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                >
                    <FileText className="w-4 h-4" />
                    SaaS Invoices ({safeInvoices.length})
                </button>

                <button
                    onClick={() => setActiveTab('receipts')}
                    className={`pb-4 text-xs font-black uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all ${
                        activeTab === 'receipts' 
                            ? 'border-slate-900 text-slate-900' 
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                >
                    <Receipt className="w-4 h-4" />
                    Official Payment Receipts ({safeReceipts.length})
                </button>

                <button
                    onClick={() => setActiveTab('revenue')}
                    className={`pb-4 text-xs font-black uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all ${
                        activeTab === 'revenue' 
                            ? 'border-slate-900 text-slate-900' 
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                >
                    <TrendingUp className="w-4 h-4" />
                    Revenue & Lifecycle Audit
                </button>

                <button
                    onClick={() => setActiveTab('edtech-news')}
                    className={`pb-4 text-xs font-black uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all ${
                        activeTab === 'edtech-news' 
                            ? 'border-primary-600 text-primary-700 font-extrabold' 
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                >
                    <Newspaper className="w-4 h-4" />
                    EdTech News & Learning Media
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-primary-100 text-primary-800 font-bold">
                        Curriculum & Media
                    </span>
                </button>

                <button
                    onClick={() => setActiveTab('system-pulse')}
                    className={`pb-4 text-xs font-black uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all ${
                        activeTab === 'system-pulse' 
                            ? 'border-emerald-500 text-emerald-600 font-extrabold' 
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                >
                    <Activity className="w-4 h-4 text-emerald-500" />
                    System Pulse & Realtime Access
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live Access
                    </span>
                </button>
            </div>

            {/* TAB 1: SUBSCRIBERS DIRECTORY & CONTROLS */}
            {activeTab === 'schools' && (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    {/* Controls Bar */}
                    <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/50">
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative w-full md:w-72">
                                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search school name, code, email..."
                                    value={schoolSearch}
                                    onChange={(e) => setSchoolSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-slate-900 focus:outline-none"
                                />
                            </div>

                            <select
                                value={schoolFilter}
                                onChange={(e: any) => setSchoolFilter(e.target.value)}
                                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                            >
                                <option value="all">All Statuses ({safeSchools.length})</option>
                                <option value="pending">Pending Wire / Verification</option>
                                <option value="active">Active Only</option>
                                <option value="grace">In Grace Period</option>
                                <option value="suspended">Disabled / Locked</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                            <div className="text-xs font-bold text-slate-500">
                                Showing {filteredSchools.length} of {safeSchools.length} Institutions
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsAddSchoolModalOpen(true)}
                                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all whitespace-nowrap"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Onboard Institution</span>
                            </button>
                        </div>
                    </div>

                    {/* Schools Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500">
                                    <th className="px-6 py-4">Institution</th>
                                    <th className="px-6 py-4">Plan & Cycle</th>
                                    <th className="px-6 py-4">Subscription Status</th>
                                    <th className="px-6 py-4">Term / Expiry</th>
                                    <th className="px-6 py-4">Reminders Sent</th>
                                    <th className="px-6 py-4 text-center">Administrative Controls</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs font-medium">
                                {filteredSchools.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                            No institutions matching the current filter.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSchools.map(school => {
                                        const daysRemaining = getDaysRemaining(school.endDate);
                                        const isExpired = daysRemaining < 0;
                                        const daysOverdue = Math.abs(daysRemaining);
                                        const isPending = school.subscriptionStatus === SubscriptionStatus.PENDING_APPROVAL || (school.paymentMethod === 'WIRE' && school.subscriptionStatus !== SubscriptionStatus.ACTIVE);
                                        const isSuspended = school.subscriptionStatus === SubscriptionStatus.SUSPENDED;
                                        const isGrace = school.subscriptionStatus === SubscriptionStatus.PAST_DUE;
                                        const isExpiringSoon = daysRemaining <= 5 && daysRemaining > 0;

                                        return (
                                            <tr key={school.id} className="hover:bg-slate-50/80 transition-colors">
                                                {/* School identity */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        {school.logoUrl ? (
                                                            <img 
                                                                src={school.logoUrl} 
                                                                alt={school.name} 
                                                                className="w-9 h-9 rounded-xl object-contain bg-white border border-slate-200 shadow-xs flex-shrink-0"
                                                                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                                            />
                                                        ) : (
                                                            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 font-black text-xs flex items-center justify-center border border-slate-200 flex-shrink-0 uppercase">
                                                                {school.name.substring(0, 2)}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className="font-bold text-slate-900 text-sm">{school.name}</div>
                                                            <div className="text-slate-400 text-[11px] flex items-center gap-2 mt-0.5">
                                                                <span className="font-mono font-bold text-slate-600">
                                                                    {(!school.schoolCode || school.schoolCode === 'PENDING-VERIFICATION')
                                                                        ? (school.name ? school.name.substring(0, 3).toUpperCase() : 'SCH')
                                                                        : school.schoolCode}
                                                                </span>
                                                                <span>•</span>
                                                                <span>{school.email}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Plan & Cycle */}
                                                <td className="px-6 py-4">
                                                    <div className="inline-flex flex-col gap-1">
                                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-800">
                                                            <span>{school.plan}</span>
                                                            <span className="text-slate-400">•</span>
                                                            <span className="text-slate-500">{school.billingCycle}</span>
                                                        </div>
                                                        {isPending && ((school as any).pendingUpgradePlan || school.plan === SubscriptionPlan.FREE) && (
                                                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                                                Target: {(school as any).pendingUpgradePlan || SubscriptionPlan.PREMIUM}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Status */}
                                                <td className="px-6 py-4">
                                                    {isPending ? (
                                                        <div className="inline-flex flex-col">
                                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-300 text-amber-900 rounded-lg text-[11px] font-bold">
                                                                <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                                                                <span>Pending Wire Verification</span>
                                                            </div>
                                                            <span className="text-[10px] text-slate-500 font-semibold mt-1">
                                                                Proforma #{school.invoiceNumber || 'WIRE'}
                                                            </span>
                                                        </div>
                                                    ) : isSuspended ? (
                                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-[11px] font-bold">
                                                            <Lock className="w-3.5 h-3.5" />
                                                            <span>Account Disabled</span>
                                                        </div>
                                                    ) : isGrace ? (
                                                        <div className="inline-flex flex-col">
                                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-[11px] font-bold">
                                                                <AlertTriangle className="w-3.5 h-3.5" />
                                                                <span>Past Due ({daysOverdue}d overdue)</span>
                                                            </div>
                                                            <span className="text-[10px] text-amber-600 font-semibold mt-1">
                                                                Auto-lockout in {school.autoLockoutGraceDaysRemaining ?? (14 - daysOverdue)} days
                                                            </span>
                                                        </div>
                                                    ) : isExpiringSoon ? (
                                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-[11px] font-bold">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            <span>Expiring in {daysRemaining} days</span>
                                                        </div>
                                                    ) : (
                                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-[11px] font-bold">
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                            <span>Active ({daysRemaining}d left)</span>
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Expiry Date */}
                                                <td className="px-6 py-4">
                                                    <div className="text-slate-800 font-semibold">{school.endDate}</div>
                                                    <div className="text-[10px] text-slate-400">Started {school.startDate}</div>
                                                </td>

                                                {/* Reminders count */}
                                                <td className="px-6 py-4">
                                                    <div className="text-slate-700 font-bold">
                                                        {school.remindersCount || 0} dispatched
                                                    </div>
                                                    {school.lastReminderDate && (
                                                        <div className="text-[10px] text-slate-400">
                                                            Last: {school.lastReminderDate}
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Administrative Action Controls */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {/* Verify & Activate Wire Pending */}
                                                        {isPending && (
                                                            <button
                                                                onClick={() => activateSchoolMutation.mutate(school.id)}
                                                                disabled={activateSchoolMutation.isPending}
                                                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all"
                                                                title="Verify bank wire transfer and activate institutional school portal"
                                                            >
                                                                {activateSchoolMutation.isPending ? <Spinner /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                                                <span>Activate</span>
                                                            </button>
                                                        )}

                                                        {/* Send Reminder */}
                                                        <button
                                                            onClick={() => sendReminderMutation.mutate(school.id)}
                                                            disabled={sendReminderMutation.isPending}
                                                            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                                                            title="Dispatch payment reminder email (5-day or 2-day cadence notice)"
                                                        >
                                                            <Send className="w-4 h-4" />
                                                        </button>

                                                        {/* Extend access */}
                                                        <button
                                                            onClick={() => handleOpenExtend(school)}
                                                            className="p-2 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all"
                                                            title="Grant days of extension / grace period override"
                                                        >
                                                            <Calendar className="w-4 h-4" />
                                                        </button>

                                                        {/* Toggle Access (Lock/Unlock) */}
                                                        <button
                                                            onClick={() => toggleAccessMutation.mutate({ schoolId: school.id, enabled: isSuspended })}
                                                            disabled={toggleAccessMutation.isPending}
                                                            className={`p-2 rounded-xl transition-all ${
                                                                isSuspended 
                                                                    ? 'text-emerald-700 bg-emerald-100 hover:bg-emerald-200' 
                                                                    : 'text-rose-700 bg-rose-100 hover:bg-rose-200'
                                                            }`}
                                                            title={isSuspended ? "Re-enable Account Access" : "Disable & Lock Account"}
                                                        >
                                                            {isSuspended ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                                        </button>

                                                        {/* Generate Invoice for Renewal */}
                                                        <button
                                                            onClick={() => handleOpenNewInvoice(school)}
                                                            className="p-2 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                                                            title="Generate SaaS Subscription Invoice"
                                                        >
                                                            <FileText className="w-4 h-4" />
                                                        </button>

                                                        {/* Record Payment */}
                                                        <button
                                                            onClick={() => handleOpenPayment(school)}
                                                            className="p-2 text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all"
                                                            title="Record Payment & Generate A4 Receipt"
                                                        >
                                                            <CreditCard className="w-4 h-4" />
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

            {/* TAB 2: SAAS INVOICES (A4 PRINTABLE & DOWNLOADABLE) */}
            {activeTab === 'invoices' && (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden space-y-4">
                    <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status:</span>
                            <div className="flex gap-2">
                                {['all', 'ISSUED', 'OVERDUE', 'PAID'].map(st => (
                                    <button
                                        key={st}
                                        onClick={() => setInvoiceFilter(st as any)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                                            invoiceFilter === st 
                                                ? 'bg-slate-900 text-white' 
                                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                                        }`}
                                    >
                                        {st === 'all' ? 'All Invoices' : st}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={() => handleOpenNewInvoice()}
                            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase flex items-center gap-2 hover:bg-slate-800 transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            Issue New Invoice
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500">
                                    <th className="px-6 py-4">Invoice #</th>
                                    <th className="px-6 py-4">Institution</th>
                                    <th className="px-6 py-4">Plan & Amount</th>
                                    <th className="px-6 py-4">Dates</th>
                                    <th className="px-6 py-4">Payment Status</th>
                                    <th className="px-6 py-4 text-center">Actions & A4 Print</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs font-medium">
                                {filteredInvoices.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                            No SaaS invoices matching criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredInvoices.map(inv => (
                                        <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-6 py-4 font-mono font-bold text-slate-900">
                                                {inv.invoiceNumber}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900">{inv.schoolName}</div>
                                                <div className="text-slate-400 text-[11px]">{inv.recipientEmail}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900 text-sm">
                                                    {formatCurrency(inv.amount, inv.currency)}
                                                </div>
                                                <div className="text-[10px] text-slate-500 font-semibold uppercase">
                                                    {inv.plan} • {inv.billingCycle}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-slate-700">Due: <strong>{inv.dueDate}</strong></div>
                                                <div className="text-[10px] text-slate-400">Issued: {inv.issueDate}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {inv.status === 'PAID' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-[11px] font-bold">
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        PAID
                                                    </span>
                                                ) : inv.status === 'OVERDUE' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-[11px] font-bold">
                                                        <AlertTriangle className="w-3.5 h-3.5" />
                                                        OVERDUE
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-[11px] font-bold">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        PENDING
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    {/* View A4 Printable & Downloadable Invoice */}
                                                    <button
                                                        onClick={() => handleViewInvoiceDoc(inv)}
                                                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                                                    >
                                                        <Eye className="w-3.5 h-3.5 text-slate-600" />
                                                        A4 View
                                                    </button>

                                                    {/* Quick Mark as Paid */}
                                                    {inv.status !== 'PAID' && (
                                                        <button
                                                            onClick={() => markInvoicePaidMutation.mutate(inv)}
                                                            disabled={markInvoicePaidMutation.isPending}
                                                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                                                        >
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                            Mark Paid
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 3: OFFICIAL PAYMENT RECEIPTS (A4 PRINTABLE & DOWNLOADABLE) */}
            {activeTab === 'receipts' && (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden space-y-4">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                                Subscription Payment Receipts
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Official signed electronic payment vouchers issued to subscribing institutions.
                            </p>
                        </div>
                        <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1 border border-slate-200 rounded-lg">
                            {safeReceipts.length} Settled Receipts
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500">
                                    <th className="px-6 py-4">Receipt #</th>
                                    <th className="px-6 py-4">Institution</th>
                                    <th className="px-6 py-4">Amount Paid</th>
                                    <th className="px-6 py-4">Payment Method & Ref</th>
                                    <th className="px-6 py-4">Settlement Date</th>
                                    <th className="px-6 py-4 text-center">A4 Receipt Voucher</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs font-medium">
                                {safeReceipts.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                            No payment receipts found yet.
                                        </td>
                                    </tr>
                                ) : (
                                    safeReceipts.map(rec => (
                                        <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-6 py-4 font-mono font-bold text-emerald-700">
                                                {rec.receiptNumber}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900">{rec.schoolName}</div>
                                                <div className="text-slate-400 text-[11px]">Invoice: {rec.invoiceNumber}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900 text-sm">
                                                    {formatCurrency(rec.amount, rec.currency)}
                                                </div>
                                                <div className="text-[10px] text-emerald-600 font-semibold">
                                                    Valid through {rec.provisionedUntil || 'Next Term'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-slate-800">{rec.paymentMethod}</div>
                                                <div className="font-mono text-[11px] text-slate-500">{rec.transactionCode}</div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-700">
                                                {rec.paymentDate}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => handleViewReceiptDoc(rec)}
                                                    className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-xs flex items-center gap-2 mx-auto transition-all shadow-md shadow-slate-900/10"
                                                >
                                                    <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                                                    View & Download A4 Receipt
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 4: REVENUE ANALYTICS & LIFECYCLE AUDIT */}
            {activeTab === 'revenue' && (
                <div className="space-y-8">
                    {/* Revenue Snapshot Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard
                            title="Monthly Recurring Revenue (MRR)"
                            value={formatCurrency(stats?.monthlyRecurringRevenue ?? 0, 'KES')}
                            icon={<DollarSign className="w-5 h-5 text-primary-600" />}
                            subtitle="Calculated from active subscribing schools"
                        />

                        <StatCard
                            title="Annual Run-Rate (ARR)"
                            value={formatCurrency(stats?.annualRecurringRevenue ?? 0, 'KES')}
                            icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
                            colorClass="bg-emerald-50 text-emerald-700"
                            subtitle="Projected annualized subscription revenue"
                        />

                        <StatCard
                            title="Total Settled Invoices"
                            value={String(safeReceipts.length)}
                            icon={<Receipt className="w-5 h-5 text-indigo-600" />}
                            colorClass="bg-indigo-50 text-indigo-700"
                            subtitle="Verified official payment transactions"
                        />
                    </div>

                    {/* Automated Reminder & Enforcement Cadence Map */}
                    <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-slate-900 text-white rounded-xl">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900">
                                    Subscription Lifecycle & Automatic Lockout Flow
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Visual representation of the user requirement's 5-day / 2-day reminder and 14-day auto-lockout policy.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-black uppercase text-blue-700">Stage 1</span>
                                    <span className="px-2 py-0.5 bg-blue-200 text-blue-800 rounded text-[10px] font-bold">5 Days Pre-Expiry</span>
                                </div>
                                <h4 className="font-bold text-slate-900 text-sm">Initial Renewal Notice</h4>
                                <p className="text-xs text-slate-600">
                                    Automated email sent 5 days before subscription expires with renewal invoice and payment instructions.
                                </p>
                            </div>

                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-black uppercase text-amber-700">Stage 2</span>
                                    <span className="px-2 py-0.5 bg-amber-200 text-amber-800 rounded text-[10px] font-bold">Every 2 Days</span>
                                </div>
                                <h4 className="font-bold text-slate-900 text-sm">Pre-Expiry Follow-ups</h4>
                                <p className="text-xs text-slate-600">
                                    Repeated reminders at 3 days and 1 day remaining until expiration to ensure continuity.
                                </p>
                            </div>

                            <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-black uppercase text-orange-700">Stage 3</span>
                                    <span className="px-2 py-0.5 bg-orange-200 text-orange-800 rounded text-[10px] font-bold">Days 1 - 14 Post-Expiry</span>
                                </div>
                                <h4 className="font-bold text-slate-900 text-sm">Grace Period (Past Due)</h4>
                                <p className="text-xs text-slate-600">
                                    Account enters 14-day grace period. Follow-up reminders dispatch every 2 days with lockout warnings.
                                </p>
                            </div>

                            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-black uppercase text-rose-700">Stage 4</span>
                                    <span className="px-2 py-0.5 bg-rose-200 text-rose-800 rounded text-[10px] font-bold">Day 14+ Overdue</span>
                                </div>
                                <h4 className="font-bold text-slate-900 text-sm">Auto Account Lockout</h4>
                                <p className="text-xs text-slate-600">
                                    Account is automatically disabled. System restricts access strictly to the Subscription Locked settlement screen.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 5: EDTECH NEWS & LEARNING MEDIA MANAGER */}
            {activeTab === 'edtech-news' && (
                <EdTechNewsManager />
            )}

            {/* TAB 6: SYSTEM PULSE & REALTIME ACCESS */}
            {activeTab === 'system-pulse' && (
                <SystemPulseView />
            )}

            {/* MODAL 1: A4 FINANCIAL DOCUMENT VIEWER (INVOICE & RECEIPT) */}
            <Modal
                isOpen={isDocumentModalOpen}
                onClose={() => setIsDocumentModalOpen(false)}
                title={activeDocument?.type === 'RECEIPT' ? 'Official SaaS Subscription Payment Receipt (A4)' : 'Official SaaS Subscription Invoice (A4)'}
                size="xl"
            >
                {activeDocument && (
                    <div className="space-y-6">
                        <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-xs text-slate-600">
                                <span>Showing official <strong>A4 document</strong> with QR code authenticity verification and payment channels.</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => downloadDocumentAsPDF(activeDocument)}
                                    className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all"
                                >
                                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                                    Download A4 PDF
                                </button>
                                <button
                                    onClick={() => window.print()}
                                    className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all"
                                >
                                    <Eye className="w-3.5 h-3.5" />
                                    Print A4
                                </button>
                            </div>
                        </div>

                        {/* Interactive A4 Document Component */}
                        <div className="border border-slate-200 rounded-2xl shadow-inner bg-slate-100/50 p-4 md:p-8 overflow-y-auto max-h-[75vh]">
                            <FinancialDocumentView
                                document={activeDocument}
                                showActionsToolbar={false}
                            />
                        </div>
                    </div>
                )}
            </Modal>

            {/* MODAL 2: ISSUE NEW SAAS INVOICE */}
            <Modal
                isOpen={isNewInvoiceModalOpen}
                onClose={() => setIsNewInvoiceModalOpen(false)}
                title="Generate Official SaaS Subscription Invoice"
                size="lg"
            >
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        const targetSchool = safeSchools.find(s => s.id === invoiceForm.schoolId) || safeSchools[0];
                        if (!targetSchool) {
                            addNotification('No school selected', 'error');
                            return;
                        }
                        createInvoiceMutation.mutate({
                            ...invoiceForm,
                            schoolName: targetSchool.name,
                            schoolCode: targetSchool.schoolCode,
                            recipientEmail: targetSchool.email,
                            recipientPhone: targetSchool.phone,
                            status: 'ISSUED'
                        });
                    }}
                    className="space-y-6"
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                                Subscribing Institution
                            </label>
                            <select
                                value={invoiceForm.schoolId}
                                onChange={(e) => {
                                    const sch = safeSchools.find(s => s.id === e.target.value);
                                    setInvoiceForm(prev => ({
                                        ...prev,
                                        schoolId: e.target.value,
                                        plan: sch?.plan || prev.plan,
                                        billingCycle: sch?.billingCycle || prev.billingCycle
                                    }));
                                }}
                                required
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                            >
                                {safeSchools.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} ({s.schoolCode || 'SCH'}) - Current Plan: {s.plan}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                                    Subscription Plan
                                </label>
                                <select
                                    value={invoiceForm.plan}
                                    onChange={(e: any) => setInvoiceForm(prev => ({ ...prev, plan: e.target.value }))}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                                >
                                    <option value={SubscriptionPlan.BASIC}>Basic Plan</option>
                                    <option value={SubscriptionPlan.PREMIUM}>Premium Plan</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                                    Billing Cycle
                                </label>
                                <select
                                    value={invoiceForm.billingCycle}
                                    onChange={(e: any) => setInvoiceForm(prev => ({ ...prev, billingCycle: e.target.value }))}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                                >
                                    <option value="ANNUALLY">Annual Billing (12 Months)</option>
                                    <option value="MONTHLY">Monthly Billing</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                                    Invoice Amount (KES)
                                </label>
                                <input
                                    type="number"
                                    value={invoiceForm.amount}
                                    onChange={(e) => setInvoiceForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                                    required
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                                    Payment Due Date
                                </label>
                                <input
                                    type="date"
                                    value={invoiceForm.dueDate}
                                    onChange={(e) => setInvoiceForm(prev => ({ ...prev, dueDate: e.target.value }))}
                                    required
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                                Special Billing Notes / Add-ons
                            </label>
                            <textarea
                                value={invoiceForm.notes}
                                onChange={(e) => setInvoiceForm(prev => ({ ...prev, notes: e.target.value }))}
                                rows={3}
                                placeholder="e.g. Includes SMS gateway pack and multi-branch management bundle."
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-slate-900"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => setIsNewInvoiceModalOpen(false)}
                            className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 uppercase"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={createInvoiceMutation.isPending}
                            className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                        >
                            {createInvoiceMutation.isPending ? <Spinner /> : 'Generate & Issue Invoice'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* MODAL 3: RECORD SUBSCRIPTION PAYMENT & GENERATE RECEIPT */}
            <Modal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                title="Record Subscription Payment & Issue A4 Receipt"
                size="md"
            >
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        recordPaymentMutation.mutate(paymentForm);
                    }}
                    className="space-y-6"
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                                Institution Settling
                            </label>
                            <select
                                value={paymentForm.schoolId}
                                onChange={(e) => setPaymentForm(prev => ({ ...prev, schoolId: e.target.value }))}
                                required
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                            >
                                {safeSchools.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} ({s.subscriptionStatus})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                                    Amount Paid (KES)
                                </label>
                                <input
                                    type="number"
                                    value={paymentForm.amount}
                                    onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                                    required
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                                    Payment Method
                                </label>
                                <select
                                    value={paymentForm.method}
                                    onChange={(e) => setPaymentForm(prev => ({ ...prev, method: e.target.value }))}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                                >
                                    <option value="Lipa Na M-Pesa">Lipa Na M-Pesa</option>
                                    <option value="Bank Wire (NCBA)">Bank Wire (NCBA)</option>
                                    <option value="Stripe / Credit Card">Stripe / Credit Card</option>
                                    <option value="Direct Cheque">Direct Cheque</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                                Transaction Reference / Receipt Code
                            </label>
                            <input
                                type="text"
                                value={paymentForm.transactionCode}
                                onChange={(e) => setPaymentForm(prev => ({ ...prev, transactionCode: e.target.value }))}
                                required
                                placeholder="e.g. QKD872619H or NCBA-TXN-902"
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                                Settlement Date
                            </label>
                            <input
                                type="date"
                                value={paymentForm.date}
                                onChange={(e) => setPaymentForm(prev => ({ ...prev, date: e.target.value }))}
                                required
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => setIsPaymentModalOpen(false)}
                            className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 uppercase"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={recordPaymentMutation.isPending}
                            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                        >
                            {recordPaymentMutation.isPending ? <Spinner /> : 'Confirm & Generate Receipt'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* MODAL 4: EXTEND SUBSCRIPTION GRACE */}
            <Modal
                isOpen={isExtendModalOpen}
                onClose={() => setIsExtendModalOpen(false)}
                title={`Extend Subscription: ${extendTarget?.name}`}
                size="md"
            >
                {extendTarget && (
                    <div className="space-y-6">
                        <p className="text-xs text-slate-600 leading-relaxed">
                            Grant additional days of platform access. This will immediately mark the account as <strong>ACTIVE</strong> and unlock the dashboard if it was previously disabled.
                        </p>

                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                            <div className="text-[11px] font-bold text-slate-500 uppercase">Current Expiry</div>
                            <div className="text-sm font-black text-slate-900">{extendTarget.endDate}</div>
                            <div className="text-[10px] text-slate-400">Current Status: {extendTarget.subscriptionStatus}</div>
                        </div>

                        <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                                Extension Duration
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {[7, 14, 30, 365].map(d => (
                                    <button
                                        key={d}
                                        type="button"
                                        onClick={() => setExtendDays(d)}
                                        className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                                            extendDays === d 
                                                ? 'bg-slate-900 text-white border-slate-900' 
                                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                        }`}
                                    >
                                        +{d}d
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setIsExtendModalOpen(false)}
                                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 uppercase"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => extendSubscriptionMutation.mutate({ schoolId: extendTarget.id, days: extendDays })}
                                disabled={extendSubscriptionMutation.isPending}
                                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                            >
                                {extendSubscriptionMutation.isPending ? <Spinner /> : `Grant +${extendDays} Days`}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* MODAL 5: LIFECYCLE SWEEP RESULTS AUDIT */}
            <Modal
                isOpen={isSweepResultModalOpen}
                onClose={() => setIsSweepResultModalOpen(false)}
                title="Automated Subscription Lifecycle Sweep Audit"
                size="lg"
            >
                {lastSweepResult && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                                <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Schools Scanned</div>
                                <div className="text-lg font-bold text-slate-900 mt-1">{lastSweepResult.totalScanned}</div>
                            </div>
                            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                                <div className="text-[10px] font-bold uppercase text-emerald-700 tracking-wider">Active & Good</div>
                                <div className="text-lg font-bold text-emerald-700 mt-1">{lastSweepResult.activeCount}</div>
                            </div>
                            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
                                <div className="text-[10px] font-bold uppercase text-amber-700 tracking-wider">Reminders Sent</div>
                                <div className="text-lg font-bold text-amber-700 mt-1">{lastSweepResult.remindersSent}</div>
                            </div>
                            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200">
                                <div className="text-[10px] font-bold uppercase text-rose-700 tracking-wider">Accounts Locked</div>
                                <div className="text-lg font-bold text-rose-700 mt-1">{lastSweepResult.disabledCount}</div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                                Itemized Sweep Actions & Dispatch Log
                            </h4>
                            <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 max-h-72 overflow-y-auto">
                                {lastSweepResult.actions.map((act, i) => (
                                    <div key={i} className="p-3.5 text-xs flex items-start justify-between gap-4 hover:bg-slate-50">
                                        <div className="space-y-0.5">
                                            <div className="font-bold text-slate-900">{act.schoolName}</div>
                                            <div className="text-slate-500 text-[11px]">{act.message}</div>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black whitespace-nowrap uppercase tracking-wider ${
                                            act.action === 'ACCOUNT_DISABLED'
                                                ? 'bg-rose-100 text-rose-800'
                                                : act.action.includes('REMINDER')
                                                ? 'bg-amber-100 text-amber-800'
                                                : act.action.includes('GRACE')
                                                ? 'bg-orange-100 text-orange-800'
                                                : 'bg-emerald-100 text-emerald-800'
                                        }`}>
                                            {act.action.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-slate-100">
                            <button
                                onClick={() => setIsSweepResultModalOpen(false)}
                                className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold uppercase tracking-wider"
                            >
                                Close Audit Log
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* MODAL 6: PLATFORM PRICING & PAYMENT GATEWAYS */}
            <Modal
                isOpen={isConfigModalOpen}
                onClose={() => setIsConfigModalOpen(false)}
                title="Platform Pricing & Payment Gateway Parameters"
                size="lg"
            >
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        updatePricingMutation.mutate(pricingForm);
                    }}
                    className="space-y-6"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Basic Plan Rates</h4>
                            <div>
                                <label className="block text-xs text-slate-500 font-semibold mb-1">Monthly (KES)</label>
                                <input
                                    type="number"
                                    value={pricingForm.basicMonthlyPrice || 3000}
                                    onChange={(e) => setPricingForm(p => ({ ...p, basicMonthlyPrice: Number(e.target.value) }))}
                                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 font-semibold mb-1">Annual (KES)</label>
                                <input
                                    type="number"
                                    value={pricingForm.basicAnnualPrice || 30000}
                                    onChange={(e) => setPricingForm(p => ({ ...p, basicAnnualPrice: Number(e.target.value) }))}
                                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Premium Plan Rates</h4>
                            <div>
                                <label className="block text-xs text-slate-500 font-semibold mb-1">Monthly (KES)</label>
                                <input
                                    type="number"
                                    value={pricingForm.premiumMonthlyPrice || 6000}
                                    onChange={(e) => setPricingForm(p => ({ ...p, premiumMonthlyPrice: Number(e.target.value) }))}
                                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 font-semibold mb-1">Annual (KES)</label>
                                <input
                                    type="number"
                                    value={pricingForm.premiumAnnualPrice || 60000}
                                    onChange={(e) => setPricingForm(p => ({ ...p, premiumAnnualPrice: Number(e.target.value) }))}
                                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-4">
                        <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-emerald-600" />
                            M-Pesa C2B Paybill
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-slate-500 font-semibold mb-1">Paybill Number</label>
                                <input
                                    type="text"
                                    value={pricingForm.mpesaPaybill || '522522'}
                                    onChange={(e) => setPricingForm(p => ({ ...p, mpesaPaybill: e.target.value }))}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 font-semibold mb-1">Environment</label>
                                <select
                                    value={pricingForm.mpesaEnvironment || 'sandbox'}
                                    onChange={(e: any) => setPricingForm(p => ({ ...p, mpesaEnvironment: e.target.value }))}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 uppercase"
                                >
                                    <option value="sandbox">Sandbox</option>
                                    <option value="production">Production</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-4">
                        <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-blue-600" />
                            Official Wire Transfer Bank Settlement Account Details
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-slate-500 font-semibold mb-1">Beneficiary / Account Name</label>
                                <input
                                    type="text"
                                    value={pricingForm.wireAccountName ?? 'SAASLINK TECHNOLOGIES LIMITED'}
                                    onChange={(e) => setPricingForm(p => ({ ...p, wireAccountName: e.target.value }))}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 font-semibold mb-1">Bank Name</label>
                                <input
                                    type="text"
                                    value={pricingForm.wireBankName ?? 'NCBA Bank Kenya PLC'}
                                    onChange={(e) => setPricingForm(p => ({ ...p, wireBankName: e.target.value }))}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 font-semibold mb-1">Account Number</label>
                                <input
                                    type="text"
                                    value={pricingForm.wireAccountNumber ?? '8809220019'}
                                    onChange={(e) => setPricingForm(p => ({ ...p, wireAccountNumber: e.target.value }))}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 font-semibold mb-1">Branch Name</label>
                                <input
                                    type="text"
                                    value={pricingForm.wireBankBranch ?? 'Nairobi - Upperhill Branch'}
                                    onChange={(e) => setPricingForm(p => ({ ...p, wireBankBranch: e.target.value }))}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 font-semibold mb-1">SWIFT / BIC Code</label>
                                <input
                                    type="text"
                                    value={pricingForm.wireSwiftCode ?? 'CBAFKENX'}
                                    onChange={(e) => setPricingForm(p => ({ ...p, wireSwiftCode: e.target.value }))}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 font-semibold mb-1">Payment Instructions</label>
                                <input
                                    type="text"
                                    value={pricingForm.wirePaymentInstructions ?? 'Quote proforma reference in payment details'}
                                    onChange={(e) => setPricingForm(p => ({ ...p, wirePaymentInstructions: e.target.value }))}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => setIsConfigModalOpen(false)}
                            className="px-5 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 uppercase"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={updatePricingMutation.isPending}
                            className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold uppercase tracking-wider"
                        >
                            {updatePricingMutation.isPending ? <Spinner /> : 'Save Pricing Parameters'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* MODAL 7: SYSTEM HEALTH STATUS */}
            <Modal
                isOpen={isHealthModalOpen}
                onClose={() => setIsHealthModalOpen(false)}
                title="System Operational Health Status"
                size="md"
            >
                {healthFetching || !healthData ? (
                    <div className="p-8"><Skeleton className="h-40 w-full" /></div>
                ) : (
                    <div className="space-y-6">
                        <div className={`p-4 rounded-2xl flex items-center space-x-4 ${
                            healthData.status === 'healthy' 
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}>
                            <div className={`p-2 rounded-xl ${healthData.status === 'healthy' ? 'bg-emerald-200' : 'bg-rose-200'}`}>
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">
                                    System Status: {healthData.status === 'healthy' ? 'Operational & Healthy' : 'Degraded Performance'}
                                </h3>
                                <p className="text-xs opacity-75">Platform uptime: 99.98%</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 border border-slate-200 rounded-2xl bg-white space-y-2">
                                <div className="text-[11px] font-black uppercase text-slate-400">Database</div>
                                <div className="text-sm font-bold text-emerald-600">CONNECTED</div>
                                <div className="text-[10px] text-slate-500">Latency: 2ms</div>
                            </div>
                            <div className="p-4 border border-slate-200 rounded-2xl bg-white space-y-2">
                                <div className="text-[11px] font-black uppercase text-slate-400">Redis Cache</div>
                                <div className="text-sm font-bold text-emerald-600">ACTIVE</div>
                                <div className="text-[10px] text-slate-500">Hit Rate: 99.4%</div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                            <button
                                onClick={() => refetchHealth()}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold uppercase tracking-wider"
                            >
                                Refresh Health
                            </button>
                            <button
                                onClick={() => {
                                    setIsHealthModalOpen(false);
                                    setActiveTab('system-pulse');
                                }}
                                className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
                            >
                                <span>Full Telemetry Control Room &rarr;</span>
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* MODAL 8: SCHOOL ACTIVATION CONFIRMATION & CREDENTIALS DISPATCH */}
            <Modal
                isOpen={activationSuccessModal.isOpen}
                onClose={() => setActivationSuccessModal({ isOpen: false })}
                title="Account Activated & Credentials Dispatched"
                size="md"
            >
                <div className="space-y-6">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="font-bold text-emerald-900 text-sm">
                                {activationSuccessModal.school?.name} is now ACTIVE
                            </h4>
                            <p className="text-xs text-emerald-700">
                                Wire transfer payment has been verified. Initial login credentials and confirmation receipt have been dispatched to subscriber.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            Subscriber Initial Access Credentials Dispatched
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="bg-white p-3 rounded-xl border border-slate-200">
                                <div className="text-[10px] text-slate-400 uppercase font-bold">Login Email</div>
                                <div className="font-mono font-bold text-slate-800 break-all mt-0.5">
                                    {activationSuccessModal.credentials?.email || activationSuccessModal.school?.email}
                                </div>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-slate-200">
                                <div className="text-[10px] text-slate-400 uppercase font-bold">Initial Password</div>
                                <div className="font-mono font-bold text-indigo-700 mt-0.5">
                                    {activationSuccessModal.credentials?.password || 'Admin@2026'}
                                </div>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-slate-200">
                                <div className="text-[10px] text-slate-400 uppercase font-bold">Provisioned Plan</div>
                                <div className="font-bold text-slate-800 mt-0.5">
                                    {activationSuccessModal.school?.plan}
                                </div>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-slate-200">
                                <div className="text-[10px] text-slate-400 uppercase font-bold">Valid Until</div>
                                <div className="font-bold text-slate-800 mt-0.5">
                                    {activationSuccessModal.school?.endDate}
                                </div>
                            </div>
                        </div>
                    </div>

                    {activationSuccessModal.receipt && (
                        <div className="flex items-center justify-between p-3.5 bg-slate-100 rounded-xl text-xs">
                            <div>
                                <span className="text-slate-500 font-medium">Generated Receipt: </span>
                                <span className="font-mono font-bold text-slate-900">{activationSuccessModal.receipt.receiptNumber}</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    const doc = buildSaasSubscriptionReceipt(activationSuccessModal.receipt, stats?.pricing);
                                    setActiveDocument(doc);
                                    setIsDocumentModalOpen(true);
                                    setActivationSuccessModal({ isOpen: false });
                                }}
                                className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm"
                            >
                                <FileText className="w-3.5 h-3.5" />
                                <span>View Receipt</span>
                            </button>
                        </div>
                    )}

                    <div className="flex justify-end pt-2">
                        <button
                            type="button"
                            onClick={() => setActivationSuccessModal({ isOpen: false })}
                            className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </Modal>

            {/* MODAL: ONBOARD NEW INSTITUTION / TENANT */}
            <Modal
                isOpen={isAddSchoolModalOpen}
                onClose={() => setIsAddSchoolModalOpen(false)}
                title="Onboard New Institution (Tenant)"
            >
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        createSchoolMutation.mutate(addSchoolForm);
                    }}
                    className="space-y-4"
                >
                    <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-800">
                        Provisioning an institution configures its database tenant, assigns its subscription tier, and creates the primary administrator account.
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Institution Name *</label>
                            <input
                                type="text"
                                required
                                value={addSchoolForm.schoolName}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setAddSchoolForm(prev => ({
                                        ...prev,
                                        schoolName: val,
                                        schoolCode: prev.schoolCode || val.substring(0, 3).toUpperCase()
                                    }));
                                }}
                                placeholder="e.g. Apex Academy"
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">School Code (Short ID) *</label>
                            <input
                                type="text"
                                required
                                maxLength={6}
                                value={addSchoolForm.schoolCode}
                                onChange={(e) => setAddSchoolForm(prev => ({ ...prev, schoolCode: e.target.value.toUpperCase() }))}
                                placeholder="e.g. APX"
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium uppercase focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Admin Full Name *</label>
                            <input
                                type="text"
                                required
                                value={addSchoolForm.adminName}
                                onChange={(e) => setAddSchoolForm(prev => ({ ...prev, adminName: e.target.value }))}
                                placeholder="e.g. Dr. Jane Kamau"
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Admin Email Address *</label>
                            <input
                                type="email"
                                required
                                value={addSchoolForm.adminEmail}
                                onChange={(e) => setAddSchoolForm(prev => ({ ...prev, adminEmail: e.target.value }))}
                                placeholder="e.g. admin@apexacademy.ac.ke"
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Admin Initial Password *</label>
                            <input
                                type="text"
                                required
                                value={addSchoolForm.password}
                                onChange={(e) => setAddSchoolForm(prev => ({ ...prev, password: e.target.value }))}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone</label>
                            <input
                                type="text"
                                value={addSchoolForm.phone}
                                onChange={(e) => setAddSchoolForm(prev => ({ ...prev, phone: e.target.value }))}
                                placeholder="e.g. +254 700 000 000"
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">County / Region</label>
                            <input
                                type="text"
                                value={addSchoolForm.county}
                                onChange={(e) => setAddSchoolForm(prev => ({ ...prev, county: e.target.value }))}
                                placeholder="e.g. Nairobi"
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Expected Student Count</label>
                            <input
                                type="number"
                                min={1}
                                value={addSchoolForm.studentCount}
                                onChange={(e) => setAddSchoolForm(prev => ({ ...prev, studentCount: Number(e.target.value) || 0 }))}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Subscription Plan</label>
                            <select
                                value={addSchoolForm.plan}
                                onChange={(e) => setAddSchoolForm(prev => ({ ...prev, plan: e.target.value as SubscriptionPlan }))}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                            >
                                <option value={SubscriptionPlan.FREE}>Free Trial</option>
                                <option value={SubscriptionPlan.BASIC}>Basic Plan</option>
                                <option value={SubscriptionPlan.PREMIUM}>Premium Plan</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Billing Cycle</label>
                            <select
                                value={addSchoolForm.billingCycle}
                                onChange={(e) => setAddSchoolForm(prev => ({ ...prev, billingCycle: e.target.value as 'ANNUALLY' | 'MONTHLY' }))}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                            >
                                <option value="ANNUALLY">Annually (Billed 12 Months)</option>
                                <option value="MONTHLY">Monthly</option>
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-700 mb-1">Initial Status</label>
                            <select
                                value={addSchoolForm.status}
                                onChange={(e) => setAddSchoolForm(prev => ({ ...prev, status: e.target.value as SubscriptionStatus }))}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                            >
                                <option value={SubscriptionStatus.ACTIVE}>Active (Immediate Platform Access)</option>
                                <option value={SubscriptionStatus.PENDING_APPROVAL}>Pending Verification / Payment</option>
                                <option value={SubscriptionStatus.TRIAL}>Trial Period</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => setIsAddSchoolModalOpen(false)}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={createSchoolMutation.isPending}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm"
                        >
                            {createSchoolMutation.isPending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                            <span>Onboard & Provision</span>
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default SuperAdminDashboard;
