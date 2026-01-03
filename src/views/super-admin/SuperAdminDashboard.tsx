
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useData } from '../../contexts/DataContext';
import { School, SubscriptionStatus, SubscriptionPlan, PlatformPricing } from '../../types';
import * as api from '../../services/api';
import Modal from '../../components/common/Modal';
import StatCard from '../../components/common/StatCard';
import Skeleton from '../../components/common/Skeleton';
import Spinner from '../../components/common/Spinner';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SuperAdminDashboard: React.FC = () => {
    const { addNotification, formatCurrency } = useData();
    const queryClient = useQueryClient();
    
    // UI State
    const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'revenue'>('overview');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
    const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
    
    // Selection State
    const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
    const [filter, setFilter] = useState<'all' | 'active' | 'trial' | 'pending' | 'new'>('all');

    // Edit Form State
    const [plan, setPlan] = useState<SubscriptionPlan>(SubscriptionPlan.FREE);
    const [status, setStatus] = useState<SubscriptionStatus>(SubscriptionStatus.TRIAL);
    const [email, setEmail] = useState('');
    const [endDate, setEndDate] = useState('');
    const [pricingForm, setPricingForm] = useState<Partial<PlatformPricing>>({});

    // --- Queries ---
    const { data: schools = [], isLoading: schoolsLoading } = useQuery({
        queryKey: ['super-schools'],
        queryFn: api.getAllSchools
    });

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['platform-stats'],
        queryFn: api.getPlatformStats
    });

    const { data: payments = [], isLoading: paymentsLoading } = useQuery({
        queryKey: ['subscription-payments'],
        queryFn: api.getSubscriptionPayments
    });

    const { data: healthData, refetch: refetchHealth, isFetching: healthFetching } = useQuery({
        queryKey: ['system-health'],
        queryFn: api.getSystemHealth,
        enabled: isHealthModalOpen
    });

    // --- Mutations ---
    const updateSubscriptionMutation = useMutation({
        mutationFn: (data: { schoolId: string, payload: any }) => api.updateSchoolSubscription(data.schoolId, data.payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['super-schools'] });
            queryClient.invalidateQueries({ queryKey: ['platform-stats'] });
            setIsModalOpen(false);
            addNotification('Account synchronized successfully.', 'success');
        },
        onError: () => addNotification('Synchronization failed.', 'error')
    });

    const updatePricingMutation = useMutation({
        mutationFn: api.updatePlatformPricing,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['platform-stats'] });
            setIsPricingModalOpen(false);
            addNotification('Platform architecture updated.', 'success');
        }
    });

    const approvePaymentMutation = useMutation({
        mutationFn: (data: { schoolId: string, amount: number, transactionCode: string, date: string, method: string }) => 
            api.recordManualSubscriptionPayment(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['super-schools'] });
            queryClient.invalidateQueries({ queryKey: ['platform-stats'] });
            queryClient.invalidateQueries({ queryKey: ['subscription-payments'] });
            addNotification('Payment verified. Access credentials dispatched.', 'success');
        }
    });

    // --- Computed Data ---
    const pendingApprovalCount = useMemo(() => {
        return schools.filter((s: any) => 
            s.subscription?.status === SubscriptionStatus.PENDING_APPROVAL || 
            s.subscription?.status === SubscriptionStatus.PENDING_PAYMENT
        ).length;
    }, [schools]);

    const pendingInvoices = useMemo(() => {
        return schools.filter((s: any) => 
            s.subscription?.status === SubscriptionStatus.PENDING_APPROVAL && 
            s.subscription?.invoiceNumber
        );
    }, [schools]);

    const filteredSchools = useMemo(() => {
        if (!schools) return [];
        if (filter === 'all') return schools;
        if (filter === 'active') return schools.filter((s: any) => s.subscription?.status === SubscriptionStatus.ACTIVE);
        if (filter === 'trial') return schools.filter((s: any) => s.subscription?.status === SubscriptionStatus.TRIAL);
        if (filter === 'pending') return schools.filter((s: any) => s.subscription?.status === SubscriptionStatus.PENDING_APPROVAL || s.subscription?.status === SubscriptionStatus.PENDING_PAYMENT);
        if (filter === 'new') {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return schools.filter((s: any) => s.createdAt && new Date(s.createdAt) > thirtyDaysAgo);
        }
        return schools;
    }, [schools, filter]);

    const planDistributionData = useMemo(() => {
        if (!stats?.planDistribution) return [];
        return [
            { name: 'Basic', value: stats.planDistribution.basic },
            { name: 'Premium', value: stats.planDistribution.premium },
            { name: 'Free', value: stats.planDistribution.free },
        ];
    }, [stats]);

    const PLAN_COLORS = ['#3b82f6', '#346955', '#f59e0b'];

    // --- Handlers ---
    const openEditModal = (school: School) => {
        setSelectedSchool(school);
        const sub = (school as any).subscription;
        setPlan(sub?.plan || SubscriptionPlan.FREE);
        setStatus(sub?.status || SubscriptionStatus.TRIAL);
        setEmail(school.email || '');
        setEndDate(sub?.endDate ? new Date(sub.endDate).toISOString().split('T')[0] : '');
        setIsModalOpen(true);
    };

    const handleSaveSubscription = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSchool) return;
        
        if (email !== selectedSchool.email) {
            await api.updateSchoolEmail(selectedSchool.id, email);
        }

        updateSubscriptionMutation.mutate({
            schoolId: selectedSchool.id,
            payload: { plan, status, endDate: endDate || undefined }
        });
    };

    const handleConfirmInvoice = (school: any) => {
        const sub = school.subscription;
        let amount = 0;
        if (sub.plan === SubscriptionPlan.BASIC) amount = stats?.pricing?.basicMonthlyPrice || 3000;
        else if (sub.plan === SubscriptionPlan.PREMIUM) amount = stats?.pricing?.premiumMonthlyPrice || 5000;

        const totalWithVat = amount * 1.16;

        if (!window.confirm(`Confirm payment of ${formatCurrency(totalWithVat)} for ${school.name}? This will mark invoice ${sub.invoiceNumber} as PAID and email credentials.`)) return;

        approvePaymentMutation.mutate({
            schoolId: school.id,
            amount: totalWithVat,
            transactionCode: sub.invoiceNumber,
            date: new Date().toISOString().split('T')[0],
            method: 'WIRE'
        });
    };

    const handleOpenPricing = () => {
        if (stats?.pricing) setPricingForm(stats.pricing);
        setIsPricingModalOpen(true);
    };

    const handleSavePricing = (e: React.FormEvent) => {
        e.preventDefault();
        updatePricingMutation.mutate(pricingForm);
    };

    const handlePricingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setPricingForm(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
    };

    if (statsLoading || schoolsLoading) {
        return <div className="p-8 text-center py-20"><Spinner /></div>;
    }

    return (
        <div className="p-6 md:p-8 space-y-8">
            {pendingApprovalCount > 0 && (
                <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-3xl flex items-center justify-between animate-fade-in-up shadow-xl shadow-amber-500/5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white animate-pulse">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <div>
                            <h4 className="font-black text-amber-900 uppercase text-xs tracking-widest">Verification Queue</h4>
                            <p className="text-amber-700 font-bold text-sm">{pendingApprovalCount} institutions are awaiting bank transfer verification.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setActiveTab('invoices')} 
                        className="px-6 py-2.5 bg-amber-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-700 transition-all shadow-lg"
                    >
                        Review Invoices
                    </button>
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Saaslink Authority</h2>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">Platform Control Center</p>
                </div>
                <div className="flex space-x-3">
                     <button onClick={() => { setIsHealthModalOpen(true); refetchHealth(); }} className="px-5 py-3 bg-white text-slate-700 border-2 border-slate-100 rounded-2xl shadow-sm hover:bg-slate-50 font-black text-xs uppercase tracking-widest flex items-center transition-all">
                        <svg className="w-4 h-4 mr-2 text-slate-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"/></svg>
                        Health Status
                    </button>
                    <button onClick={handleOpenPricing} className="px-5 py-3 bg-slate-900 text-white rounded-2xl shadow-xl hover:bg-black font-black text-xs uppercase tracking-widest transition-all">
                        System Logic
                    </button>
                </div>
            </div>
            
            <div className="border-b border-slate-200 overflow-x-auto scrollbar-hide">
                <nav className="-mb-px flex space-x-8">
                    <button onClick={() => setActiveTab('overview')} className={`whitespace-nowrap py-4 px-1 border-b-4 font-black text-[10px] uppercase tracking-[0.2em] ${activeTab === 'overview' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Directory</button>
                    <button onClick={() => setActiveTab('invoices')} className={`whitespace-nowrap py-4 px-1 border-b-4 font-black text-[10px] uppercase tracking-[0.2em] ${activeTab === 'invoices' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Wire Invoices</button>
                    <button onClick={() => setActiveTab('revenue')} className={`whitespace-nowrap py-4 px-1 border-b-4 font-black text-[10px] uppercase tracking-[0.2em] ${activeTab === 'revenue' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Income Ledger</button>
                </nav>
            </div>
            
            {activeTab === 'overview' && (
                <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <StatCard 
                        title="Total Schools" 
                        value={stats?.totalSchools?.toString() || '0'} 
                        icon={<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                        onClick={() => setFilter('all')}
                        isSelected={filter === 'all'}
                    />
                    <StatCard 
                        title="Live Subs" 
                        value={stats?.activeSubs?.toString() || '0'} 
                        icon={<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        colorClass="bg-green-100 text-green-700"
                        onClick={() => setFilter('active')}
                        isSelected={filter === 'active'}
                    />
                     <StatCard 
                        title="Pending" 
                        value={pendingApprovalCount.toString()} 
                        icon={<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        colorClass="bg-amber-100 text-amber-700"
                        onClick={() => setFilter('pending')}
                        isSelected={filter === 'pending'}
                    />
                    <StatCard 
                        title="MRR" 
                        value={formatCurrency(stats?.mrr || 0)} 
                        icon={<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>} 
                        onClick={() => setActiveTab('revenue')}
                    />
                </div>

                <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
                    <div className="p-8 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Directory Audit</h3>
                        <div className="flex gap-2">
                             {['all', 'active', 'pending'].map(f => (
                                 <button key={f} onClick={() => setFilter(f as any)} className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${filter === f ? 'bg-slate-900 text-white' : 'bg-white text-slate-400 border'}`}>{f}</button>
                             ))}
                        </div>
                    </div>
                    <div className="overflow-x-auto max-h-[600px]">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 sticky top-0">
                                <tr>
                                    <th className="px-8 py-5 font-black uppercase text-[10px] text-slate-400 tracking-widest">School Identity</th>
                                    <th className="px-8 py-5 font-black uppercase text-[10px] text-slate-400 tracking-widest">Ref #</th>
                                    <th className="px-8 py-5 font-black uppercase text-[10px] text-slate-400 tracking-widest">Tier</th>
                                    <th className="px-8 py-5 font-black uppercase text-[10px] text-slate-400 tracking-widest text-center">Manage</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredSchools.map((school: any) => (
                                    <tr key={school.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="font-black text-slate-800 text-lg uppercase">{school.name}</div>
                                            <div className="text-[10px] text-slate-400 font-bold mt-0.5">{school.email}</div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="font-mono text-xs font-black text-primary-600">{school.subscription?.invoiceNumber || '---'}</div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                                school.subscription?.status === SubscriptionStatus.ACTIVE ? 'bg-green-100 text-green-700' : 
                                                school.subscription?.status === SubscriptionStatus.PENDING_APPROVAL ? 'bg-amber-100 text-amber-700 animate-pulse' : 
                                                'bg-red-100 text-red-700'
                                            }`}>
                                                {school.subscription?.plan || 'FREE'} - {school.subscription?.status || 'OFFLINE'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <button 
                                                onClick={() => openEditModal(school)} 
                                                className="px-6 py-2 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-md"
                                            >
                                                Configure
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                </>
            )}

            {activeTab === 'invoices' && (
                <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
                    <div className="p-8 border-b border-slate-200">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Pending Wire Invoices</h3>
                        <p className="text-xs text-slate-400 font-bold mt-1">Verify bank statements against these reference codes.</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-8 py-5 font-black uppercase text-[10px] text-slate-400">Invoice Ref #</th>
                                    <th className="px-8 py-5 font-black uppercase text-[10px] text-slate-400">Institution</th>
                                    <th className="px-8 py-5 font-black uppercase text-[10px] text-slate-400">Plan</th>
                                    <th className="px-8 py-5 font-black uppercase text-[10px] text-slate-400 text-right">Amount (KES)</th>
                                    <th className="px-8 py-5 font-black uppercase text-[10px] text-slate-400 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {pendingInvoices.length === 0 ? (
                                    <tr><td colSpan={5} className="px-8 py-12 text-center text-slate-400 font-bold uppercase">No pending wire invoices.</td></tr>
                                ) : (
                                    pendingInvoices.map((school: any) => (
                                        <tr key={school.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-8 py-5 font-mono text-xs font-black text-primary-600">{school.subscription.invoiceNumber}</td>
                                            <td className="px-8 py-5">
                                                <div className="font-bold text-slate-800 uppercase">{school.name}</div>
                                                <div className="text-[9px] text-slate-400">{school.email}</div>
                                            </td>
                                            <td className="px-8 py-5 font-black text-[10px] text-slate-500 uppercase">{school.subscription.plan}</td>
                                            <td className="px-8 py-5 text-right font-black text-slate-900">
                                                {formatCurrency((school.subscription.plan === 'BASIC' ? stats?.pricing?.basicMonthlyPrice : stats?.pricing?.premiumMonthlyPrice) * 1.16)}
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <button 
                                                    onClick={() => handleConfirmInvoice(school)}
                                                    className="px-6 py-2 bg-green-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg"
                                                >
                                                    Verify & Activate
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

            {activeTab === 'revenue' && (
                <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
                    <div className="p-8 border-b border-slate-200">
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Platform collections</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-8 py-5 font-black uppercase text-[10px] text-slate-400">Date</th>
                                    <th className="px-8 py-5 font-black uppercase text-[10px] text-slate-400">Client</th>
                                    <th className="px-8 py-5 font-black uppercase text-[10px] text-slate-400">Reference</th>
                                    <th className="px-8 py-5 font-black uppercase text-[10px] text-slate-400 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-bold uppercase text-xs">
                                {payments.length === 0 ? (
                                    <tr><td colSpan={4} className="px-8 py-12 text-center text-slate-400">No records found.</td></tr>
                                ) : (
                                    payments.map((payment: any) => (
                                        <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-8 py-5 text-slate-500">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                                            <td className="px-8 py-5 text-slate-800">{payment.school?.name || '---'}</td>
                                            <td className="px-8 py-5 font-mono text-primary-600">{payment.transactionCode}</td>
                                            <td className="px-8 py-5 text-right font-black text-slate-900 text-lg">{formatCurrency(payment.amount)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modals remain same ... */}
        </div>
    );
};

export default SuperAdminDashboard;
