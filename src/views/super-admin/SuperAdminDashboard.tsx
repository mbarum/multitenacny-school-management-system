import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useData } from '../../contexts/DataContext';
import { School, SubscriptionStatus, SubscriptionPlan, PlatformPricing } from '../../types';
import * as api from '../../services/api';
import Modal from '../../components/common/Modal';
import StatCard from '../../components/common/StatCard';
import Skeleton from '../../components/common/Skeleton';
// Fix: Added missing Spinner import to resolve "Cannot find name 'Spinner'" error.
import Spinner from '../../components/common/Spinner';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SuperAdminDashboard: React.FC = () => {
    const { addNotification, formatCurrency } = useData();
    const queryClient = useQueryClient();
    
    // UI State
    const [activeTab, setActiveTab] = useState<'overview' | 'revenue' | 'settings'>('overview');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
    const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
    
    // Selection State
    const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
    const [filter, setFilter] = useState<'all' | 'active' | 'trial' | 'issues' | 'new'>('all');

    // Edit Form State
    const [plan, setPlan] = useState<SubscriptionPlan>(SubscriptionPlan.FREE);
    const [status, setStatus] = useState<SubscriptionStatus>(SubscriptionStatus.TRIAL);
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
            addNotification('Subscription updated successfully', 'success');
        },
        onError: () => addNotification('Failed to update subscription', 'error')
    });

    const updatePricingMutation = useMutation({
        mutationFn: api.updatePlatformPricing,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['platform-stats'] });
            setIsPricingModalOpen(false);
            addNotification('Platform settings saved', 'success');
        }
    });

    // --- Computed Data ---
    const filteredSchools = useMemo(() => {
        if (!schools) return [];
        if (filter === 'all') return schools;
        if (filter === 'active') return schools.filter((s: any) => s.subscription?.status === SubscriptionStatus.ACTIVE);
        if (filter === 'trial') return schools.filter((s: any) => s.subscription?.status === SubscriptionStatus.TRIAL);
        if (filter === 'issues') return schools.filter((s: any) => s.subscription?.status === SubscriptionStatus.PAST_DUE || s.subscription?.status === SubscriptionStatus.CANCELLED);
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
        setEndDate(sub?.endDate ? new Date(sub.endDate).toISOString().split('T')[0] : '');
        setIsModalOpen(true);
    };

    const handleSaveSubscription = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSchool) return;
        updateSubscriptionMutation.mutate({
            schoolId: selectedSchool.id,
            payload: { plan, status, endDate: endDate || undefined }
        });
    };

    const handleOpenPricing = () => {
        if (stats?.pricing) {
            setPricingForm(stats.pricing);
        }
        setIsPricingModalOpen(true);
    };

    const handleSavePricing = (e: React.FormEvent) => {
        e.preventDefault();
        updatePricingMutation.mutate(pricingForm);
    };

    const handlePricingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setPricingForm(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value
        }));
    };

    if (statsLoading || schoolsLoading) {
        return <div className="p-8"><Skeleton className="h-64 w-full" /></div>;
    }

    return (
        <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">Saaslink Authority</h2>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">Platform Control Center</p>
                </div>
                <div className="flex space-x-3">
                     <button onClick={() => { setIsHealthModalOpen(true); refetchHealth(); }} className="px-5 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 font-black text-xs uppercase tracking-widest flex items-center transition-all">
                        <svg className="w-4 h-4 mr-2 text-slate-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"/></svg>
                        System Health
                    </button>
                    <button onClick={handleOpenPricing} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl shadow-lg hover:bg-black font-black text-xs uppercase tracking-widest transition-all">
                        Settings & Pricing
                    </button>
                </div>
            </div>
            
            <div className="border-b border-slate-200 mb-8">
                <nav className="-mb-px flex space-x-8">
                    <button onClick={() => setActiveTab('overview')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-black text-xs uppercase tracking-widest ${activeTab === 'overview' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Overview</button>
                    <button onClick={() => setActiveTab('revenue')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-black text-xs uppercase tracking-widest ${activeTab === 'revenue' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Revenue Stream</button>
                </nav>
            </div>
            
            {activeTab === 'overview' && (
                <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard 
                        title="Registered Schools" 
                        value={stats?.totalSchools?.toString() || '0'} 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                        onClick={() => setFilter('all')}
                        isSelected={filter === 'all'}
                    />
                     <StatCard 
                        title="Acquisition (30d)" 
                        value={`+${stats?.newSchoolsLast30Days?.toString() || '0'}`} 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                        colorClass="bg-blue-100 text-blue-600"
                        onClick={() => setFilter('new')}
                        isSelected={filter === 'new'}
                    />
                    <StatCard 
                        title="Active Subs" 
                        value={`${stats?.activeSubs}/${stats?.totalSchools}`} 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        colorClass="bg-green-100 text-green-700"
                        onClick={() => setFilter('active')}
                        isSelected={filter === 'active'}
                    />
                    <StatCard 
                        title="Current MRR" 
                        value={`KES ${stats?.mrr?.toLocaleString() || '0'}`} 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>} 
                        onClick={() => setActiveTab('revenue')}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    <div className="lg:col-span-2 bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden min-h-[400px]">
                        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                                {filter === 'all' && 'Directory: All Schools'}
                                {filter === 'active' && 'Directory: Active Subscriptions'}
                                {filter === 'trial' && 'Directory: Trialing Schools'}
                                {filter === 'new' && 'Directory: New Acquisition'}
                            </h3>
                            <span className="text-[10px] font-black text-slate-400 bg-white px-2 py-1 border rounded-lg uppercase">{filteredSchools.length} Total</span>
                        </div>
                        <div className="overflow-x-auto max-h-[500px]">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 sticky top-0">
                                    <tr>
                                        <th className="px-6 py-4 font-black uppercase text-[10px] text-slate-400 tracking-widest">School Identity</th>
                                        <th className="px-6 py-4 font-black uppercase text-[10px] text-slate-400 tracking-widest">Subscription</th>
                                        <th className="px-6 py-4 font-black uppercase text-[10px] text-slate-400 tracking-widest">Status</th>
                                        <th className="px-6 py-4 font-black uppercase text-[10px] text-slate-400 tracking-widest text-center">Manage</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredSchools.map((school: any) => (
                                        <tr key={school.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-black text-slate-800">{school.name}</div>
                                                <div className="text-[10px] text-slate-400 font-bold mt-0.5">{school.email}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                                    {school.subscription?.plan || 'Free'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                                    school.subscription?.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 
                                                    school.subscription?.status === 'TRIAL' ? 'bg-amber-100 text-amber-700' : 
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                    {school.subscription?.status || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button 
                                                    onClick={() => openEditModal(school)} 
                                                    className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all shadow-md"
                                                >
                                                    Manage
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8 text-center">Plan Distribution</h3>
                        <div className="h-64">
                             <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie 
                                        data={planDistributionData} 
                                        dataKey="value" 
                                        nameKey="name" 
                                        cx="50%" 
                                        cy="50%" 
                                        innerRadius={60}
                                        outerRadius={90} 
                                        paddingAngle={5}
                                        stroke="none"
                                        label={({ name, percent }: any) => (percent || 0) > 0 ? `${name}` : ''}
                                    >
                                        {planDistributionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PLAN_COLORS[index % PLAN_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-8 space-y-3">
                            {planDistributionData.map((d, i) => (
                                <div key={d.name} className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PLAN_COLORS[i] }}></div>
                                        <span className="text-slate-500">{d.name}</span>
                                    </div>
                                    <span className="text-slate-900">{d.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                </>
            )}

            {/* Edit Subscription Modal - FULLY FUNCTIONAL */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Management: ${selectedSchool?.name}`} size="md">
                <form onSubmit={handleSaveSubscription} className="space-y-6 p-2">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Service Package</label>
                        <select 
                            value={plan} 
                            onChange={e => setPlan(e.target.value as SubscriptionPlan)}
                            className="w-full p-3 border-2 border-white bg-white rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500 font-bold"
                        >
                            {Object.values(SubscriptionPlan).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Account Status</label>
                        <select 
                            value={status} 
                            onChange={e => setStatus(e.target.value as SubscriptionStatus)}
                            className="w-full p-3 border-2 border-white bg-white rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500 font-bold"
                        >
                            {Object.values(SubscriptionStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Forced Expiry Override</label>
                        <input 
                            type="date" 
                            value={endDate} 
                            onChange={e => setEndDate(e.target.value)}
                            className="w-full p-3 border-2 border-white bg-white rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500 font-bold"
                        />
                    </div>

                    <div className="flex flex-col gap-3 pt-4">
                        <button type="submit" disabled={updateSubscriptionMutation.isPending} className="w-full py-4 bg-primary-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary-500/30 hover:bg-primary-700 transition-all flex justify-center items-center">
                            {updateSubscriptionMutation.isPending ? <Spinner /> : 'Commit Changes'}
                        </button>
                         <button type="button" onClick={() => setIsModalOpen(false)} className="w-full py-3 bg-white text-slate-400 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:text-slate-600 transition-all">
                            Discard Changes
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Manage Pricing & M-Pesa Modal */}
            <Modal isOpen={isPricingModalOpen} onClose={() => setIsPricingModalOpen(false)} title="Platform Settings & Pricing" size="lg">
                <form onSubmit={handleSavePricing} className="space-y-6">
                    <p className="text-sm text-slate-600">Configure global pricing and integration settings for the SaaS platform.</p>
                    
                    <div className="grid grid-cols-2 gap-6">
                        <div className="p-4 bg-slate-50 rounded-lg border">
                            <h4 className="font-bold text-slate-800 mb-4">Basic Plan</h4>
                             <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500">Monthly (KES)</label>
                                    <input type="number" name="basicMonthlyPrice" value={pricingForm.basicMonthlyPrice || 0} onChange={handlePricingChange} className="w-full p-2 border rounded"/>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500">Annual (KES)</label>
                                    <input type="number" name="basicAnnualPrice" value={pricingForm.basicAnnualPrice || 0} onChange={handlePricingChange} className="w-full p-2 border rounded"/>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg border">
                            <h4 className="font-bold text-slate-800 mb-4">Premium Plan</h4>
                             <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500">Monthly (KES)</label>
                                    <input type="number" name="premiumMonthlyPrice" value={pricingForm.premiumMonthlyPrice || 0} onChange={handlePricingChange} className="w-full p-2 border rounded"/>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500">Annual (KES)</label>
                                    <input type="number" name="premiumAnnualPrice" value={pricingForm.premiumAnnualPrice || 0} onChange={handlePricingChange} className="w-full p-2 border rounded"/>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-white border-2 border-slate-200 rounded-lg">
                        <h4 className="font-bold text-slate-800 mb-4 text-lg">M-Pesa C2B Integration (Receive Payments)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium text-slate-700">Paybill Number</label>
                                <input type="text" name="mpesaPaybill" value={pricingForm.mpesaPaybill || ''} onChange={handlePricingChange} className="w-full p-2 border rounded"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Passkey</label>
                                <input type="password" name="mpesaPasskey" value={pricingForm.mpesaPasskey || ''} onChange={handlePricingChange} className="w-full p-2 border rounded"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Consumer Key</label>
                                <input type="text" name="mpesaConsumerKey" value={pricingForm.mpesaConsumerKey || ''} onChange={handlePricingChange} className="w-full p-2 border rounded"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Consumer Secret</label>
                                <input type="password" name="mpesaConsumerSecret" value={pricingForm.mpesaConsumerSecret || ''} onChange={handlePricingChange} className="w-full p-2 border rounded"/>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-white border-2 border-slate-200 rounded-lg mt-6">
                        <h4 className="font-bold text-slate-800 mb-4 text-lg flex items-center">
                            <svg className="w-6 h-6 mr-2 text-[#635BFF]" fill="currentColor" viewBox="0 0 24 24"><path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.915 0-1.17 1.256-1.936 2.756-1.936 1.704 0 2.946.852 3.655 2.14l2.58-1.572C18.256 2.378 16.036.8 13.376.8c-3.6 0-6.196 2.05-6.196 5.518 0 3.328 2.656 4.796 5.566 5.86 2.17.804 3.018 1.574 3.018 2.964 0 1.288-1.418 2.124-3.056 2.124-2.186 0-3.528-1.074-4.22-2.58L5.6 16.39c1.078 2.376 3.42 3.61 6.55 3.61 3.86 0 6.646-1.996 6.646-5.818 0-3.518-2.616-4.992-4.82-5.832"/></svg>
                            Stripe Integration (Card Payments)
                        </h4>
                        <div className="grid grid-cols-1 gap-4">
                             <div>
                                <label className="block text-sm font-medium text-slate-700">Publishable Key</label>
                                <input type="text" name="stripePublishableKey" value={pricingForm.stripePublishableKey || ''} onChange={handlePricingChange} className="w-full p-2 border rounded" placeholder="pk_live_..."/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Secret Key</label>
                                <input type="password" name="stripeSecretKey" value={pricingForm.stripeSecretKey || ''} onChange={handlePricingChange} className="w-full p-2 border rounded" placeholder="sk_live_..."/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Webhook Secret</label>
                                <input type="password" name="stripeWebhookSecret" value={pricingForm.stripeWebhookSecret || ''} onChange={handlePricingChange} className="w-full p-2 border rounded" placeholder="whsec_..."/>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex justify-end pt-4 border-t">
                        <button type="submit" className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-semibold shadow">
                            Save Configuration
                        </button>
                    </div>
                </form>
            </Modal>

            {/* System Health Modal */}
             <Modal isOpen={isHealthModalOpen} onClose={() => setIsHealthModalOpen(false)} title="System Health Status" size="lg">
                {healthFetching || !healthData ? (
                    <div className="p-8"><Skeleton className="h-40 w-full" /></div>
                ) : (
                    <div className="space-y-6">
                        <div className={`p-4 rounded-lg flex items-center space-x-4 ${healthData.status === 'healthy' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                            <div className={`p-2 rounded-full ${healthData.status === 'healthy' ? 'bg-green-200' : 'bg-red-200'}`}>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">System is {healthData.status === 'healthy' ? 'Healthy' : 'Experiencing Issues'}</h3>
                                <p className="text-sm opacity-80">Last check: {new Date(healthData.timestamp).toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 border rounded-lg bg-white shadow-sm">
                                <h4 className="font-semibold text-slate-700 border-b pb-2 mb-2">Database (MySQL)</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between"><span>Status:</span> <span className={`font-bold ${healthData.database.status === 'up' ? 'text-green-600' : 'text-red-600'}`}>{healthData.database.status.toUpperCase()}</span></div>
                                    <div className="flex justify-between"><span>Latency:</span> <span>{healthData.database.latency}</span></div>
                                </div>
                            </div>
                            <div className="p-4 border rounded-lg bg-white shadow-sm">
                                <h4 className="font-semibold text-slate-700 border-b pb-2 mb-2">Server (Node.js)</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between"><span>Uptime:</span> <span>{(healthData.uptime / 60 / 60).toFixed(2)} hours</span></div>
                                    <div className="flex justify-between"><span>Memory Usage:</span> <span>{healthData.server.memoryUsage}</span></div>
                                    <div className="flex justify-between"><span>System Load:</span> <span>{healthData.server.systemMemoryLoad}</span></div>
                                </div>
                            </div>
                        </div>
                         <div className="flex justify-end">
                            <button onClick={() => refetchHealth()} className="text-primary-600 hover:underline text-sm font-semibold">Refresh Status</button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default SuperAdminDashboard;
