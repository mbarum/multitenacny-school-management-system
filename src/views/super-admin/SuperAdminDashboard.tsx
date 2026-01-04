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
import { jsPDF } from 'jspdf';

const SuperAdminDashboard: React.FC = () => {
    const { addNotification, formatCurrency } = useData();
    const queryClient = useQueryClient();
    
    const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'revenue'>('overview');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
    const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
    
    const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
    const [filter, setFilter] = useState<'all' | 'active' | 'pending'>('all');

    const [plan, setPlan] = useState<SubscriptionPlan>(SubscriptionPlan.FREE);
    const [status, setStatus] = useState<SubscriptionStatus>(SubscriptionStatus.TRIAL);
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [endDate, setEndDate] = useState('');
    const [pricingForm, setPricingForm] = useState<Partial<PlatformPricing>>({});

    const { data: schools = [], isLoading: schoolsLoading } = useQuery({ queryKey: ['super-schools'], queryFn: api.getAllSchools });
    const { data: stats, isLoading: statsLoading } = useQuery({ queryKey: ['platform-stats'], queryFn: api.getPlatformStats });
    const { data: payments = [], isLoading: paymentsLoading } = useQuery({ queryKey: ['subscription-payments'], queryFn: api.getSubscriptionPayments });
    const { data: healthData, refetch: refetchHealth, isFetching: healthFetching } = useQuery({ queryKey: ['system-health'], queryFn: api.getSystemHealth, enabled: isHealthModalOpen });

    const updateSubscriptionMutation = useMutation({
        mutationFn: (data: { schoolId: string, payload: any }) => api.updateSchoolSubscription(data.schoolId, data.payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['super-schools'] });
            setIsModalOpen(false);
            addNotification('Registry synchronized successfully.', 'success');
        }
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
        mutationFn: (data: { schoolId: string, amount: number, transactionCode: string, date: string, method: string }) => api.recordManualSubscriptionPayment(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['super-schools'] });
            queryClient.invalidateQueries({ queryKey: ['subscription-payments'] });
            addNotification('Payment verified. Access credentials dispatched.', 'success');
        }
    });

    const pendingPayments = useMemo(() => {
        return payments.filter((p: any) => p.status === 'PENDING' && p.paymentMethod === 'WIRE');
    }, [payments]);

    const filteredSchools = useMemo(() => {
        if (!schools) return [];
        if (filter === 'all') return schools;
        if (filter === 'active') return schools.filter((s: any) => s.subscription?.status === SubscriptionStatus.ACTIVE);
        if (filter === 'pending') return schools.filter((s: any) => s.subscription?.status === SubscriptionStatus.PENDING_APPROVAL);
        return schools;
    }, [schools, filter]);

    const handleOpenPricing = () => { if (stats?.pricing) setPricingForm(stats.pricing); setIsPricingModalOpen(true); };
    const handleSavePricing = (e: React.FormEvent) => { e.preventDefault(); updatePricingMutation.mutate(pricingForm); };
    const handlePricingChange = (e: React.ChangeEvent<HTMLInputElement>) => { const { name, value, type } = e.target; setPricingForm(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value })); };

    const openEditModal = (school: School) => {
        setSelectedSchool(school);
        const sub = (school as any).subscription;
        setPlan(sub?.plan || SubscriptionPlan.FREE);
        setStatus(sub?.status || SubscriptionStatus.TRIAL);
        setEmail(school.email || '');
        setPhone(school.phone || '');
        setEndDate(sub?.endDate ? new Date(sub.endDate).toISOString().split('T')[0] : '');
        setIsModalOpen(true);
    };

    const handleSaveSubscription = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSchool) return;
        if (email !== selectedSchool.email) await api.updateSchoolEmail(selectedSchool.id, email);
        if (phone !== selectedSchool.phone) await api.updateSchoolPhone(selectedSchool.id, phone);
        updateSubscriptionMutation.mutate({ schoolId: selectedSchool.id, payload: { plan, status, endDate: endDate || undefined } });
    };

    return (
        <div className="p-6 md:p-8 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div><h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Authority</h2><p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">Platform Control Center</p></div>
                <div className="flex space-x-3">
                     <button onClick={() => { setIsHealthModalOpen(true); refetchHealth(); }} className="px-5 py-3 bg-white text-slate-700 border-2 border-slate-100 rounded-2xl font-black text-xs uppercase tracking-widest">Health Status</button>
                    <button onClick={handleOpenPricing} className="px-5 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest">Architecture</button>
                </div>
            </div>
            
            <div className="border-b border-slate-200 overflow-x-auto scrollbar-hide">
                <nav className="-mb-px flex space-x-8">
                    <button onClick={() => setActiveTab('overview')} className={`whitespace-nowrap py-4 px-1 border-b-4 font-black text-[10px] uppercase tracking-[0.2em] ${activeTab === 'overview' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-400'}`}>Directory</button>
                    <button onClick={() => setActiveTab('invoices')} className={`whitespace-nowrap py-4 px-1 border-b-4 font-black text-[10px] uppercase tracking-[0.2em] ${activeTab === 'invoices' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-400'}`}>Verification Queues</button>
                    <button onClick={() => setActiveTab('revenue')} className={`whitespace-nowrap py-4 px-1 border-b-4 font-black text-[10px] uppercase tracking-[0.2em] ${activeTab === 'revenue' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-400'}`}>Revenue Stream</button>
                </nav>
            </div>
            
            {activeTab === 'overview' && (
                <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
                    <div className="p-8 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Global Institution Directory</h3>
                        <div className="flex gap-2">
                             {['all', 'active', 'pending'].map(f => (
                                 <button key={f} onClick={() => setFilter(f as any)} className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${filter === f ? 'bg-slate-900 text-white' : 'bg-white text-slate-400 border'}`}>{f}</button>
                             ))}
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead><tr><th className="px-8 py-5 font-black uppercase text-[10px] text-slate-400">School Identity</th><th className="px-8 py-5 font-black uppercase text-[10px] text-slate-400">Ref Code</th><th className="px-8 py-5 font-black uppercase text-[10px] text-slate-400">Status</th><th className="px-8 py-5 font-black uppercase text-[10px] text-slate-400 text-center">Manage</th></tr></thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredSchools.map((school: any) => (
                                    <tr key={school.id} className="hover:bg-slate-50">
                                        <td className="px-8 py-5"><div className="font-black text-slate-800 text-lg uppercase">{school.name}</div><div className="text-[10px] text-slate-400 font-bold mt-0.5">{school.email}</div></td>
                                        <td className="px-8 py-5 font-mono text-xs font-black text-primary-600">{school.subscription?.invoiceNumber || '---'}</td>
                                        <td className="px-8 py-5"><span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${school.subscription?.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{school.subscription?.plan} - {school.subscription?.status}</span></td>
                                        <td className="px-8 py-5 text-center"><button onClick={() => openEditModal(school)} className="px-6 py-2 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase">Configure</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'invoices' && (
                <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
                    <div className="p-8 border-b border-slate-200"><h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Awaiting Verification (Wire Transfer)</h3></div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50"><tr><th className="px-8 py-5 font-black uppercase text-[10px] text-slate-400">Date</th><th className="px-8 py-5 font-black uppercase text-[10px] text-slate-400">School</th><th className="px-8 py-5 font-black uppercase text-[10px] text-slate-400">Target</th><th className="px-8 py-5 font-black uppercase text-[10px] text-slate-400 text-right">Amount</th><th className="px-8 py-5 font-black uppercase text-[10px] text-slate-400 text-center">Reference</th><th className="px-8 py-5 font-black uppercase text-[10px] text-slate-400 text-center">Action</th></tr></thead>
                            <tbody className="divide-y divide-slate-100">
                                {pendingPayments.map((p: any) => (
                                    <tr key={p.id} className="hover:bg-slate-50">
                                        <td className="px-8 py-5 font-bold text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                                        <td className="px-8 py-5 font-black uppercase text-slate-800">{p.school?.name}</td>
                                        <td className="px-8 py-5"><span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-lg text-[9px] font-black uppercase">{p.targetPlan} Upgrade</span></td>
                                        <td className="px-8 py-5 text-right font-black">{formatCurrency(p.amount)}</td>
                                        <td className="px-8 py-5 text-center font-mono font-black text-xs text-primary-600">{p.transactionCode}</td>
                                        <td className="px-8 py-5 text-center">
                                            <button 
                                                onClick={() => { if (confirm(`Approve ${p.targetPlan} migration for ${p.school?.name}?`)) approvePaymentMutation.mutate({ schoolId: p.schoolId, amount: p.amount, transactionCode: p.transactionCode, date: new Date().toISOString().split('T')[0], method: 'WIRE' }); }} 
                                                className="px-6 py-2 bg-green-600 text-white rounded-xl font-black text-[10px] uppercase shadow-lg shadow-green-500/20"
                                            >
                                                Verify & Activate
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {pendingPayments.length === 0 && <tr><td colSpan={6} className="text-center py-20 text-slate-400 font-black uppercase tracking-widest">Queue Clear.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'revenue' && (
                <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
                    <div className="p-8 border-b border-slate-200"><h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Realized Platform Revenue</h3></div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50"><tr><th className="px-8 py-5 font-black uppercase text-[10px] text-slate-400">Date</th><th className="px-8 py-5 font-black uppercase text-[10px] text-slate-400">Client</th><th className="px-8 py-5 font-black uppercase text-[10px] text-slate-400">Amount</th><th className="px-8 py-5 font-black uppercase text-[10px] text-slate-400">Ref</th></tr></thead>
                            <tbody className="divide-y divide-slate-100 font-bold uppercase text-xs">
                                {payments.filter((p:any)=>p.status === 'APPLIED').map((payment: any) => (
                                    <tr key={payment.id} className="hover:bg-slate-50">
                                        <td className="px-8 py-5 text-slate-500">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                                        <td className="px-8 py-5">{payment.school?.name}</td>
                                        <td className="px-8 py-5 text-primary-600">{formatCurrency(payment.amount)}</td>
                                        <td className="px-8 py-5 font-mono text-slate-400">{payment.transactionCode}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Management Dossier: ${selectedSchool?.name}`} size="md">
                <form onSubmit={handleSaveSubscription} className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                        <h4 className="text-[10px] font-black text-primary-600 uppercase tracking-widest">Subscription Logic</h4>
                        <div className="grid grid-cols-2 gap-4">
                             <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Plan</label><select value={plan} onChange={e => setPlan(e.target.value as SubscriptionPlan)} className="w-full p-3 border rounded-xl font-bold">{Object.values(SubscriptionPlan).map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                            <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Status</label><select value={status} onChange={e => setStatus(e.target.value as SubscriptionStatus)} className="w-full p-3 border rounded-xl font-bold">{Object.values(SubscriptionStatus).map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                        </div>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                        <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Contact Info</h4>
                        <div><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 border rounded-xl font-bold" placeholder="Email"/></div>
                        <div><input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-3 border rounded-xl font-bold" placeholder="Phone"/></div>
                    </div>
                    <button type="submit" disabled={updateSubscriptionMutation.isPending} className="w-full py-4 bg-primary-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">{updateSubscriptionMutation.isPending ? <Spinner /> : 'Save Changes'}</button>
                </form>
            </Modal>
        </div>
    );
};

export default SuperAdminDashboard;