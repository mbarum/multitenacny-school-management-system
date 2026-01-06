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
    const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
    
    // Selection State
    const [selectedSchool, setSelectedSchool] = useState<any>(null);
    const [filter, setFilter] = useState<'all' | 'active' | 'trial' | 'issues' | 'new'>('all');

    // Verification Form State
    const [verifyForm, setVerifyForm] = useState({
        amount: 0,
        transactionCode: '',
        date: new Date().toISOString().split('T')[0],
        method: 'WIRE'
    });

    // Form State
    const [plan, setPlan] = useState<SubscriptionPlan>(SubscriptionPlan.FREE);
    const [status, setStatus] = useState<SubscriptionStatus>(SubscriptionStatus.TRIAL);
    const [endDate, setEndDate] = useState('');

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
            setIsModalOpen(false);
            addNotification('Registry synchronized successfully.', 'success');
        }
    });

    const approvePaymentMutation = useMutation({
        mutationFn: (data: any) => api.recordManualSubscriptionPayment(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['super-schools'] });
            queryClient.invalidateQueries({ queryKey: ['subscription-payments'] });
            setIsVerifyModalOpen(false);
            addNotification('Payment verified. Access credentials dispatched.', 'success');
        },
        onError: (err: any) => addNotification(err.message, 'error')
    });

    // --- Computed Data ---
    const pendingInvoices = useMemo(() => {
        return schools.filter((s: any) => s.subscription?.status === SubscriptionStatus.PENDING_APPROVAL);
    }, [schools]);

    const filteredSchools = useMemo(() => {
        if (!schools) return [];
        if (filter === 'all') return schools;
        if (filter === 'active') return schools.filter((s: any) => s.subscription?.status === SubscriptionStatus.ACTIVE);
        if (filter === 'trial') return schools.filter((s: any) => s.subscription?.status === SubscriptionStatus.TRIAL);
        return schools;
    }, [schools, filter]);

    // --- Handlers ---
    const openVerifyModal = (school: any) => {
        setSelectedSchool(school);
        setVerifyForm({
            amount: 0,
            transactionCode: school.subscription?.invoiceNumber || '',
            date: new Date().toISOString().split('T')[0],
            method: 'WIRE'
        });
        setIsVerifyModalOpen(true);
    };

    const handleApprove = (e: React.FormEvent) => {
        e.preventDefault();
        approvePaymentMutation.mutate({
            schoolId: selectedSchool.id,
            ...verifyForm
        });
    };

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

    return (
        <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Authority</h2>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">Platform Control Center</p>
                </div>
                <div className="flex space-x-3">
                     <button onClick={() => { setIsHealthModalOpen(true); refetchHealth(); }} className="px-5 py-3 bg-white text-slate-700 border-2 border-slate-100 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">Health Status</button>
                    <button onClick={() => setIsPricingModalOpen(true)} className="px-5 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Architecture</button>
                </div>
            </div>
            
            <div className="border-b border-slate-200 mb-8 overflow-x-auto scrollbar-hide">
                <nav className="-mb-px flex space-x-8">
                    <button onClick={() => setActiveTab('overview')} className={`whitespace-nowrap py-4 px-1 border-b-4 font-black text-[10px] uppercase tracking-[0.2em] ${activeTab === 'overview' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-400'}`}>Directory</button>
                    <button onClick={() => setActiveTab('invoices')} className={`whitespace-nowrap py-4 px-1 border-b-4 font-black text-[10px] uppercase tracking-[0.2em] ${activeTab === 'invoices' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-400'}`}>
                        Verification Queues
                        {pendingInvoices.length > 0 && <span className="ml-2 px-2 py-0.5 bg-red-500 text-white rounded-full text-[9px]">{pendingInvoices.length}</span>}
                    </button>
                    <button onClick={() => setActiveTab('revenue')} className={`whitespace-nowrap py-4 px-1 border-b-4 font-black text-[10px] uppercase tracking-[0.2em] ${activeTab === 'revenue' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-400'}`}>Revenue Stream</button>
                </nav>
            </div>
            
            {activeTab === 'overview' && (
                <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
                    <div className="p-8 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Global Institution Directory</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr>
                                    <th className="px-8 py-5 font-black uppercase text-[10px] text-slate-400 tracking-widest">School Identity</th>
                                    <th className="px-8 py-5 font-black uppercase text-[10px] text-slate-400 tracking-widest">Ref Code</th>
                                    <th className="px-8 py-5 font-black uppercase text-[10px] text-slate-400 tracking-widest">Status</th>
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
                                        <td className="px-8 py-5 font-mono text-xs font-black text-primary-600">{school.subscription?.invoiceNumber || '---'}</td>
                                        <td className="px-8 py-5">
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                                school.subscription?.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                                {school.subscription?.status || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <button onClick={() => openEditModal(school)} className="px-6 py-2 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase shadow-lg hover:bg-black transition-colors">Audit</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'invoices' && (
                <div className="space-y-6">
                    <div className="bg-amber-50 border-2 border-amber-100 p-8 rounded-[2.5rem]">
                        <h4 className="text-xl font-black text-amber-900 uppercase tracking-tight">Manual Verification Queue</h4>
                        <p className="text-amber-700 font-bold text-sm mt-2">Institutions listed here have requested wire activation. Verify your bank ledger for the corresponding reference code before clearing.</p>
                    </div>
                    
                    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-8 py-5 font-black uppercase text-[10px] text-slate-400 tracking-widest">Institution</th>
                                    <th className="px-8 py-5 font-black uppercase text-[10px] text-slate-400 tracking-widest">Reference #</th>
                                    <th className="px-8 py-5 font-black uppercase text-[10px] text-slate-400 tracking-widest">Submission Date</th>
                                    <th className="px-8 py-5 font-black uppercase text-[10px] text-slate-400 tracking-widest text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {pendingInvoices.length === 0 ? (
                                    <tr><td colSpan={4} className="text-center py-20 font-black text-slate-300 uppercase tracking-[0.2em]">Verification queue is empty</td></tr>
                                ) : pendingInvoices.map((school: any) => (
                                    <tr key={school.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="font-black text-slate-800 uppercase">{school.name}</div>
                                            <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Admin: {school.email}</div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="font-mono text-sm font-black text-primary-600 bg-primary-50 px-3 py-1 rounded-lg">
                                                {school.subscription?.invoiceNumber}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 font-bold text-slate-500">
                                            {new Date(school.subscription?.updatedAt || school.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <button onClick={() => openVerifyModal(school)} className="px-8 py-3 bg-green-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-green-500/20 hover:bg-green-700 transition-all">
                                                Verify & Activate
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'revenue' && (
                <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
                    <div className="p-8 border-b border-slate-200">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Licensing Revenue Stream</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-8 py-5 font-black uppercase text-[10px] text-slate-400 tracking-widest">Settlement Date</th>
                                    <th className="px-8 py-5 font-black uppercase text-[10px] text-slate-400 tracking-widest">Institution</th>
                                    <th className="px-8 py-5 font-black uppercase text-[10px] text-slate-400 tracking-widest">Ref Code</th>
                                    <th className="px-8 py-5 font-black uppercase text-[10px] text-slate-400 tracking-widest text-right">Realized Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {payments.map((p: any) => (
                                    <tr key={p.id}>
                                        <td className="px-8 py-5 font-bold text-slate-500">{new Date(p.paymentDate).toLocaleDateString()}</td>
                                        <td className="px-8 py-5 font-black text-slate-800 uppercase">{p.school?.name}</td>
                                        <td className="px-8 py-5 font-mono text-xs font-black text-primary-700 uppercase">{p.transactionCode}</td>
                                        <td className="px-8 py-5 text-right font-black text-primary-600">{formatCurrency(p.amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Manual Verification Modal */}
            <Modal isOpen={isVerifyModalOpen} onClose={() => setIsVerifyModalOpen(false)} title="Confirm Bank Transfer">
                <form onSubmit={handleApprove} className="space-y-6">
                    <div className="p-6 bg-slate-900 rounded-3xl text-white">
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary-400 mb-2">School Entity</p>
                        <h4 className="text-2xl font-black uppercase">{selectedSchool?.name}</h4>
                        <div className="mt-4 flex justify-between text-xs font-bold text-slate-400">
                            <span>Reference: {selectedSchool?.subscription?.invoiceNumber}</span>
                            <span>Requested Plan: {selectedSchool?.subscription?.plan}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Actual Amount Received</label>
                            <input 
                                type="number" 
                                value={verifyForm.amount || ''} 
                                onChange={e => setVerifyForm({...verifyForm, amount: parseFloat(e.target.value)})} 
                                className="w-full p-4 border-2 border-slate-100 rounded-2xl font-black text-xl outline-none focus:border-primary-500 transition-all"
                                placeholder="0.00"
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Clearing Date</label>
                            <input 
                                type="date" 
                                value={verifyForm.date} 
                                onChange={e => setVerifyForm({...verifyForm, date: e.target.value})} 
                                className="w-full p-4 border-2 border-slate-100 rounded-2xl font-bold outline-none"
                                required
                            />
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-start gap-3">
                         <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" /></svg>
                         <p className="text-[10px] font-bold text-blue-800 leading-relaxed uppercase">
                            Activation will instantly grant portal access and dispatch login credentials to {selectedSchool?.email}.
                         </p>
                    </div>

                    <div className="flex flex-col gap-3 pt-4">
                        <button type="submit" disabled={approvePaymentMutation.isPending} className="w-full py-5 bg-primary-600 text-white rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-primary-500/40 hover:bg-primary-700 transition-all flex justify-center items-center">
                            {approvePaymentMutation.isPending ? <Spinner /> : 'Verify Payment & Activate'}
                        </button>
                        <button type="button" onClick={() => setIsVerifyModalOpen(false)} className="w-full py-3 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600">Cancel Verification</button>
                    </div>
                </form>
            </Modal>

            {/* Standard Audit Modal */}
             <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Audit Institutional License">
                <form onSubmit={handleSaveSubscription} className="space-y-6">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan Designation</label>
                        <select value={plan} onChange={e => setPlan(e.target.value as SubscriptionPlan)} className="w-full p-4 border-2 border-slate-100 rounded-2xl font-black text-xs uppercase outline-none focus:border-primary-500 bg-slate-50">
                            {Object.values(SubscriptionPlan).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lifecycle Status</label>
                        <select value={status} onChange={e => setStatus(e.target.value as SubscriptionStatus)} className="w-full p-4 border-2 border-slate-100 rounded-2xl font-black text-xs uppercase outline-none focus:border-primary-500 bg-slate-50">
                            {Object.values(SubscriptionStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manual Expiry Override</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-4 border-2 border-slate-100 rounded-2xl font-bold text-sm outline-none focus:border-primary-500 bg-slate-50" />
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="submit" disabled={updateSubscriptionMutation.isPending} className="px-12 py-4 bg-primary-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary-500/20 hover:bg-primary-700 transition-all">
                            {updateSubscriptionMutation.isPending ? <Spinner /> : 'Apply Adjustments'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default SuperAdminDashboard;
