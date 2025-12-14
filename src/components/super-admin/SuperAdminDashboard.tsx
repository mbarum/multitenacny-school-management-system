
import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { School, SubscriptionStatus, SubscriptionPlan, PlatformPricing } from '../../types';
import * as api from '../../services/api';
import Modal from '../common/Modal';
import StatCard from '../common/StatCard';
import Skeleton from '../common/Skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const SuperAdminDashboard: React.FC = () => {
    const { addNotification } = useData();
    const [schools, setSchools] = useState<School[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    
    // School Management
    const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Pricing Management
    const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
    const [newPricing, setNewPricing] = useState<Partial<PlatformPricing & { mpesaPaybill?: string, mpesaConsumerKey?: string, mpesaConsumerSecret?: string, mpesaPasskey?: string }>>({});

    // Health Check
    const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
    const [healthData, setHealthData] = useState<any>(null);
    const [loadingHealth, setLoadingHealth] = useState(false);
    
    // Payments
    const [payments, setPayments] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'overview' | 'revenue' | 'settings'>('overview');
    
    // Filtering State
    const [filter, setFilter] = useState<'all' | 'active' | 'trial' | 'issues' | 'new'>('all');
    
    // Edit Form State
    const [plan, setPlan] = useState<SubscriptionPlan>(SubscriptionPlan.FREE);
    const [status, setStatus] = useState<SubscriptionStatus>(SubscriptionStatus.TRIAL);
    const [endDate, setEndDate] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [schoolsData, statsData, paymentsData] = await Promise.all([
                api.getAllSchools(),
                api.getPlatformStats(),
                api.getSubscriptionPayments()
            ]);
            setSchools(schoolsData);
            setStats(statsData);
            setPayments(paymentsData);
            if (statsData.pricing) {
                setNewPricing(statsData.pricing);
            }
        } catch (error) {
            console.error(error);
            addNotification('Failed to load super admin data.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchHealth = async () => {
        setLoadingHealth(true);
        setIsHealthModalOpen(true);
        try {
            const data = await api.getSystemHealth();
            setHealthData(data);
        } catch (error) {
            addNotification('Health check failed.', 'error');
            setHealthData(null);
        } finally {
            setLoadingHealth(false);
        }
    }

    useEffect(() => {
        fetchData();
    }, []);

    const filteredSchools = useMemo(() => {
        if (filter === 'all') return schools;
        if (filter === 'active') return schools.filter(s => s.subscription?.status === SubscriptionStatus.ACTIVE);
        if (filter === 'trial') return schools.filter(s => s.subscription?.status === SubscriptionStatus.TRIAL);
        if (filter === 'issues') return schools.filter(s => s.subscription?.status === SubscriptionStatus.PAST_DUE || s.subscription?.status === SubscriptionStatus.CANCELLED);
        if (filter === 'new') {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return schools.filter(s => s.createdAt && new Date(s.createdAt) > thirtyDaysAgo);
        }
        return schools;
    }, [schools, filter]);

    const openEditModal = (school: School) => {
        setSelectedSchool(school);
        setPlan(school.subscription?.plan || SubscriptionPlan.FREE);
        setStatus(school.subscription?.status || SubscriptionStatus.TRIAL);
        setEndDate(school.subscription?.endDate ? new Date(school.subscription.endDate).toISOString().split('T')[0] : '');
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSchool) return;

        try {
            await api.updateSchoolSubscription(selectedSchool.id, {
                plan,
                status,
                endDate: endDate || undefined
            });
            addNotification('Subscription updated successfully.', 'success');
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            addNotification('Update failed.', 'error');
        }
    };
    
    const handleSavePricing = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.updatePlatformPricing(newPricing);
            addNotification('Platform settings updated successfully.', 'success');
            setIsPricingModalOpen(false);
            fetchData();
        } catch (error) {
            addNotification('Failed to update settings.', 'error');
        }
    };
    
    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
        setNewPricing(prev => ({ ...prev, [e.target.name]: value }));
    };

    const handlePrintReceipt = (payment: any) => {
        const receiptWindow = window.open('', '_blank');
        if (receiptWindow) {
            receiptWindow.document.write(`
                <html>
                <head>
                    <title>Payment Receipt</title>
                    <style>
                        body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #333; }
                        .receipt-box { border: 1px solid #ddd; padding: 30px; max-width: 600px; margin: 0 auto; }
                        .header { text-align: center; border-bottom: 2px solid #346955; padding-bottom: 20px; margin-bottom: 20px; }
                        .logo { font-size: 24px; font-weight: bold; color: #346955; }
                        .details { margin-bottom: 20px; }
                        .row { display: flex; justify-content: space-between; margin-bottom: 10px; }
                        .label { font-weight: bold; color: #555; }
                        .amount { font-size: 18px; font-weight: bold; color: #346955; }
                        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 20px; }
                    </style>
                </head>
                <body>
                    <div class="receipt-box">
                        <div class="header">
                            <div class="logo">Saaslink Platform</div>
                            <div>Subscription Receipt</div>
                        </div>
                        <div class="details">
                            <div class="row">
                                <span class="label">Date:</span>
                                <span>${new Date(payment.paymentDate).toLocaleDateString()}</span>
                            </div>
                            <div class="row">
                                <span class="label">School Name:</span>
                                <span>${payment.school?.name || 'Unknown School'}</span>
                            </div>
                            <div class="row">
                                <span class="label">Reference:</span>
                                <span>${payment.transactionCode}</span>
                            </div>
                            <div class="row">
                                <span class="label">Payment Method:</span>
                                <span>${payment.paymentMethod}</span>
                            </div>
                            <hr style="margin: 20px 0; border: 0; border-top: 1px dashed #ccc;" />
                             <div class="row">
                                <span class="label">Total Paid:</span>
                                <span class="amount">KES ${payment.amount.toLocaleString()}</span>
                            </div>
                        </div>
                        <div class="footer">
                            <p>Thank you for your business.</p>
                            <p>Saaslink Technologies</p>
                        </div>
                    </div>
                    <script>window.print();</script>
                </body>
                </html>
            `);
            receiptWindow.document.close();
        }
    };

    const PLAN_COLORS = ['#3b82f6', '#346955', '#f59e0b']; // Basic, Premium, Free
    const planDistributionData = useMemo(() => {
        if (!stats?.planDistribution) return [];
        return [
            { name: 'Basic', value: stats.planDistribution.basic },
            { name: 'Premium', value: stats.planDistribution.premium },
            { name: 'Free', value: stats.planDistribution.free },
        ];
    }, [stats]);

    if (loading) {
        return <div className="p-8"><Skeleton className="h-64 w-full" /></div>;
    }

    return (
        <div className="p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Platform Overview</h2>
                    <p className="text-slate-500">Manage schools, subscriptions, and revenue.</p>
                </div>
                <div className="flex space-x-3">
                     <button onClick={fetchHealth} className="px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 font-semibold flex items-center">
                        <svg className={`w-5 h-5 mr-2 ${healthData?.status === 'healthy' ? 'text-green-500' : 'text-slate-400'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"/></svg>
                        System Health
                    </button>
                    <button onClick={() => setIsPricingModalOpen(true)} className="px-4 py-2 bg-slate-700 text-white rounded-lg shadow hover:bg-slate-800 font-semibold">
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
                        <div className="overflow-x-auto max-h-[400px]">
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
                                    {filteredSchools.map(school => (
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
                         <table className="w-full text-left">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 font-semibold text-slate-600">Date</th>
                                    <th className="px-6 py-3 font-semibold text-slate-600">School</th>
                                    <th className="px-6 py-3 font-semibold text-slate-600">Reference</th>
                                    <th className="px-6 py-3 font-semibold text-slate-600">Method</th>
                                    <th className="px-6 py-3 font-semibold text-slate-600 text-right">Amount (KES)</th>
                                    <th className="px-6 py-3 font-semibold text-slate-600 text-center">Receipt</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {payments.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">No payment records found.</td></tr>
                                ) : (
                                    payments.map(payment => (
                                        <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 text-slate-600">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 font-medium text-slate-800">{payment.school?.name || 'Unknown School'}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600 font-mono">{payment.transactionCode}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{payment.paymentMethod}</td>
                                            <td className="px-6 py-4 text-right font-bold text-slate-800">{payment.amount.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-center">
                                                <button onClick={() => handlePrintReceipt(payment)} className="text-blue-600 hover:underline text-sm font-semibold flex items-center justify-center mx-auto">
                                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm7-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                                    Receipt
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

            {/* Edit Subscription Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Manage Subscription: ${selectedSchool?.name}`} size="md">
                <form onSubmit={handleSave} className="space-y-4">
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
                                    <input type="number" name="basicMonthlyPrice" value={newPricing.basicMonthlyPrice} onChange={handlePriceChange} className="w-full p-2 border rounded"/>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500">Annual (KES)</label>
                                    <input type="number" name="basicAnnualPrice" value={newPricing.basicAnnualPrice} onChange={handlePriceChange} className="w-full p-2 border rounded"/>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg border">
                            <h4 className="font-bold text-slate-800 mb-4">Premium Plan</h4>
                             <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500">Monthly (KES)</label>
                                    <input type="number" name="premiumMonthlyPrice" value={newPricing.premiumMonthlyPrice} onChange={handlePriceChange} className="w-full p-2 border rounded"/>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500">Annual (KES)</label>
                                    <input type="number" name="premiumAnnualPrice" value={newPricing.premiumAnnualPrice} onChange={handlePriceChange} className="w-full p-2 border rounded"/>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-white border-2 border-slate-200 rounded-lg">
                        <h4 className="font-bold text-slate-800 mb-4 text-lg">M-Pesa C2B Integration (Receive Payments)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium text-slate-700">Paybill Number</label>
                                <input type="text" name="mpesaPaybill" value={newPricing.mpesaPaybill || ''} onChange={handlePriceChange} className="w-full p-2 border rounded"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Passkey</label>
                                <input type="password" name="mpesaPasskey" value={newPricing.mpesaPasskey || ''} onChange={handlePriceChange} className="w-full p-2 border rounded"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Consumer Key</label>
                                <input type="text" name="mpesaConsumerKey" value={newPricing.mpesaConsumerKey || ''} onChange={handlePriceChange} className="w-full p-2 border rounded"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Consumer Secret</label>
                                <input type="password" name="mpesaConsumerSecret" value={newPricing.mpesaConsumerSecret || ''} onChange={handlePriceChange} className="w-full p-2 border rounded"/>
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
                {loadingHealth || !healthData ? (
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
                            <button onClick={fetchHealth} className="text-primary-600 hover:underline text-sm font-semibold">Refresh Status</button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default SuperAdminDashboard;
