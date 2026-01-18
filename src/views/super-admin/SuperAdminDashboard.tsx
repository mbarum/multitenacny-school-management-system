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
    const [activeTab, setActiveTab] = useState<'overview' | 'revenue'>('overview');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
    const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
    const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
    
    // Selection State
    const [selectedSchool, setSelectedSchool] = useState<any>(null);
    const [filter, setFilter] = useState<'all' | 'active' | 'trial' | 'issues' | 'new'>('all');

    // Edit Form State
    const [plan, setPlan] = useState<SubscriptionPlan>(SubscriptionPlan.FREE);
    const [status, setStatus] = useState<SubscriptionStatus>(SubscriptionStatus.TRIAL);
    const [endDate, setEndDate] = useState('');
    const [recoveryEmail, setRecoveryEmail] = useState('');
    const [recoveryPhone, setRecoveryPhone] = useState('');

    // --- Queries ---
    const { data: schools = [], isLoading: schoolsLoading } = useQuery({
        queryKey: ['super-schools'],
        queryFn: api.getAllSchools
    });

    const { data: stats } = useQuery({
        queryKey: ['platform-stats'],
        queryFn: api.getPlatformStats
    });

    const { data: payments = [] } = useQuery({
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
            addNotification('Institutional profile synchronized.', 'success');
        }
    });

    const updateContactMutation = useMutation({
        mutationFn: (data: { schoolId: string, email: string, phone: string }) => 
            Promise.all([
                api.updateSchoolEmail(data.schoolId, data.email),
                api.updateSchoolPhone(data.schoolId, data.phone)
            ]),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['super-schools'] });
            addNotification('Recovery contact details updated.', 'success');
        },
        onError: (err: any) => addNotification(err.message, 'error')
    });

    // --- Handlers ---
    const openEditModal = (school: School) => {
        setSelectedSchool(school);
        const sub = (school as any).subscription;
        setPlan(sub?.plan || SubscriptionPlan.FREE);
        setStatus(sub?.status || SubscriptionStatus.TRIAL);
        setEndDate(sub?.endDate ? new Date(sub.endDate).toISOString().split('T')[0] : '');
        setRecoveryEmail(school.email || '');
        setRecoveryPhone(school.phone || '');
        setIsModalOpen(true);
    };

    const handleSaveAudit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSchool) return;

        // 1. Sync Subscription
        updateSubscriptionMutation.mutate({
            schoolId: selectedSchool.id,
            payload: { plan, status, endDate: endDate || undefined }
        });

        // 2. Sync Contacts (Recovery)
        if (recoveryEmail !== selectedSchool.email || recoveryPhone !== selectedSchool.phone) {
            updateContactMutation.mutate({
                schoolId: selectedSchool.id,
                email: recoveryEmail,
                phone: recoveryPhone
            });
        }
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
                                    <th className="px-8 py-5 font-black uppercase text-[10px] text-slate-400 tracking-widest">Plan</th>
                                    <th className="px-8 py-5 font-black uppercase text-[10px] text-slate-400 tracking-widest">Status</th>
                                    <th className="px-8 py-5 font-black uppercase text-[10px] text-slate-400 tracking-widest text-center">Manage</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {schools.map((school: any) => (
                                    <tr key={school.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="font-black text-slate-800 text-lg uppercase">{school.name}</div>
                                            <div className="text-[10px] text-slate-400 font-bold mt-0.5">{school.email}</div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="px-2 py-1 bg-primary-50 text-primary-700 rounded-lg text-[10px] font-black uppercase">
                                                {school.subscription?.plan || 'N/A'}
                                            </span>
                                        </td>
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
                                    <th className="px-8 py-5 font-black uppercase text-[10px] text-slate-400 tracking-widest text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {payments.map((p: any) => (
                                    <tr key={p.id}>
                                        <td className="px-8 py-5 font-bold text-slate-500">{new Date(p.paymentDate).toLocaleDateString()}</td>
                                        <td className="px-8 py-5 font-black text-slate-800 uppercase">{p.school?.name}</td>
                                        <td className="px-8 py-5 text-right font-black text-primary-600">{formatCurrency(p.amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Recovery & Audit Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Institution Audit & Recovery">
                <form onSubmit={handleSaveAudit} className="space-y-8">
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-primary-600 uppercase tracking-[0.2em] border-b pb-2">Institutional Recovery</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Override Admin Email</label>
                                <input 
                                    type="email" 
                                    value={recoveryEmail} 
                                    onChange={e => setRecoveryEmail(e.target.value)} 
                                    className="w-full p-3 border-2 border-slate-100 rounded-xl font-bold bg-slate-50 focus:border-primary-500 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Override Phone</label>
                                <input 
                                    type="text" 
                                    value={recoveryPhone} 
                                    onChange={e => setRecoveryPhone(e.target.value)} 
                                    className="w-full p-3 border-2 border-slate-100 rounded-xl font-bold bg-slate-50 focus:border-primary-500 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-primary-600 uppercase tracking-[0.2em] border-b pb-2">Subscription Control</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tier Level</label>
                                <select value={plan} onChange={e => setPlan(e.target.value as SubscriptionPlan)} className="w-full p-3 border-2 border-slate-100 rounded-xl font-bold bg-slate-50 outline-none">
                                    {Object.values(SubscriptionPlan).map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                                <select value={status} onChange={e => setStatus(e.target.value as SubscriptionStatus)} className="w-full p-3 border-2 border-slate-100 rounded-xl font-bold bg-slate-50 outline-none">
                                    {Object.values(SubscriptionStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Forced Expiry Override</label>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-3 border-2 border-slate-100 rounded-xl font-bold bg-slate-50" />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t gap-4">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest">Cancel</button>
                        <button type="submit" disabled={updateSubscriptionMutation.isPending || updateContactMutation.isPending} className="px-12 py-4 bg-primary-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary-500/20 hover:bg-primary-700 transition-all flex items-center justify-center">
                            {(updateSubscriptionMutation.isPending || updateContactMutation.isPending) ? <Spinner /> : 'Apply Sync'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default SuperAdminDashboard;
