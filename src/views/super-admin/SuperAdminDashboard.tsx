
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useData } from '../../contexts/DataContext';
import { School, SubscriptionStatus, SubscriptionPlan, PlatformPricing } from '../../types';
import * as api from '../../services/api';
import Modal from '../../components/common/Modal';
import StatCard from '../../components/common/StatCard';
import Skeleton from '../../components/common/Skeleton';
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
                    <h2 className="text-3xl font-bold text-slate-800">Platform Overview</h2>
                    <p className="text-slate-500">Manage schools, subscriptions, and revenue.</p>
                </div>
                <div className="flex space-x-3">
                     <button onClick={() => { setIsHealthModalOpen(true); refetchHealth(); }} className="px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 font-semibold flex items-center">
                        <svg className="w-5 h-5 mr-2 text-slate-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"/></svg>
                        System Health
                    </button>
                    <button onClick={handleOpenPricing} className="px-4 py-2 bg-slate-700 text-white rounded-lg shadow hover:bg-slate-800 font-semibold">
                        Settings & Pricing
                    </button>
                </div>
            </div>
            
            <div className="border-b border-slate-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    <button onClick={() => setActiveTab('overview')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'overview' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Dashboard Overview</button>
                    <button onClick={() => setActiveTab('revenue')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'revenue' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Revenue & Receipts</button>
                </nav>
            </div>
            
            {activeTab === 'overview' && (
                <>
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard 
                        title="Total Schools" 
                        value={stats?.totalSchools?.toString() || '0'} 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                        onClick={() => setFilter('all')}
                        isSelected={filter === 'all'}
                    />
                     <StatCard 
                        title="New (30 Days)" 
                        value={`+${stats?.newSchoolsLast30Days?.toString() || '0'}`} 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                        colorClass="bg-blue-100 text-blue-600"
                        onClick={() => setFilter('new')}
                        isSelected={filter === 'new'}
                    />
                    <StatCard 
                        title="Active / Trial" 
                        value={`${stats?.activeSubs}/${stats?.trialSubs}`} 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        colorClass="bg-green-100 text-green-600"
                        onClick={() => setFilter('active')}
                        isSelected={filter === 'active'}
                    />
                    <StatCard 
                        title="Monthly Revenue" 
                        value={`KES ${stats?.mrr?.toLocaleString() || '0'}`} 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>} 
                        onClick={() => setActiveTab('revenue')}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                     {/* Schools Table */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-lg overflow-hidden min-h-[400px]">
                        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-800">
                                {filter === 'all' && 'All Registered Schools'}
                                {filter === 'active' && 'Active Subscriptions'}
                                {filter === 'trial' && 'Schools in Trial'}
                                {filter === 'issues' && 'Past Due / Cancelled'}
                                {filter === 'new' && 'New Schools (Last 30 Days)'}
                            </h3>
                            <span className="text-sm text-slate-500">{filteredSchools.length} record(s)</span>
                        </div>
                        <div className="overflow-x-auto max-h-[500px]">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 sticky top-0">
                                    <tr>
                                        <th className="px-6 py-3 font-semibold text-slate-600">School</th>
                                        <th className="px-6 py-3 font-semibold text-slate-600">Plan</th>
                                        <th className="px-6 py-3 font-semibold text-slate-600">Status</th>
                                        <th className="px-6 py-3 font-semibold text-slate-600">Expiry</th>
                                        <th className="px-6 py-3 font-semibold text-slate-600">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {filteredSchools.map((school: any) => (
                                        <tr key={school.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-900">{school.name}</div>
                                                <div className="text-xs text-slate-500">{school.email}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                                                    {school.subscription?.plan || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                    school.subscription?.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
                                                    school.subscription?.status === 'TRIAL' ? 'bg-yellow-100 text-yellow-800' : 
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                    {school.subscription?.status || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {school.subscription?.endDate ? new Date(school.subscription.endDate).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button onClick={() => openEditModal(school)} className="text-primary-600 hover:text-primary-800 font-medium text-sm">Manage</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredSchools.length === 0 && (
                                        <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">No schools found for this filter.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Charts Area */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Plan Distribution</h3>
                        <div className="h-64">
                             <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie 
                                        data={planDistributionData} 
                                        dataKey="value" 
                                        nameKey="name" 
                                        cx="50%" 
                                        cy="50%" 
                                        outerRadius={80} 
                                        fill="#8884d8" 
                                        label={({ name, percent }) => percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                                    >
                                        {planDistributionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PLAN_COLORS[index % PLAN_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
                </>
            )}

            {activeTab === 'revenue' && (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="p-6 border-b border-slate-200">
                        <h3 className="text-xl font-bold text-slate-800">Subscription Payment History</h3>
                    </div>
                    <div className="overflow-x-auto">
                        {paymentsLoading ? <div className="p-8"><Skeleton className="h-32 w-full"/></div> : 
                         <table className="w-full text-left">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 font-semibold text-slate-600">Date</th>
                                    <th className="px-6 py-3 font-semibold text-slate-600">School</th>
                                    <th className="px-6 py-3 font-semibold text-slate-600">Reference</th>
                                    <th className="px-6 py-3 font-semibold text-slate-600">Method</th>
                                    <th className="px-6 py-3 font-semibold text-slate-600 text-right">Amount (KES)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {payments.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">No payment records found.</td></tr>
                                ) : (
                                    payments.map((payment: any) => (
                                        <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 text-slate-600">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 font-medium text-slate-800">{payment.school?.name || 'Unknown School'}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600 font-mono">{payment.transactionCode}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{payment.paymentMethod}</td>
                                            <td className="px-6 py-4 text-right font-bold text-slate-800">{formatCurrency(payment.amount)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        }
                    </div>
                </div>
            )}

            {/* Edit Subscription Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Manage Subscription`} size="md">
                <form onSubmit={handleSaveSubscription} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Plan</label>
                        <select 
                            value={plan} 
                            onChange={e => setPlan(e.target.value as SubscriptionPlan)}
                            className="w-full p-2 border rounded-md"
                        >
                            {Object.values(SubscriptionPlan).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                        <select 
                            value={status} 
                            onChange={e => setStatus(e.target.value as SubscriptionStatus)}
                            className="w-full p-2 border rounded-md"
                        >
                            {Object.values(SubscriptionStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date</label>
                        <input 
                            type="date" 
                            value={endDate} 
                            onChange={e => setEndDate(e.target.value)}
                            className="w-full p-2 border rounded-md"
                        />
                    </div>
                    <div className="flex justify-end pt-4 border-t">
                        <button type="submit" className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-semibold shadow">
                            Save Changes
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
