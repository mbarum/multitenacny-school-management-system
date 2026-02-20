import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useData } from '../../contexts/DataContext';
import { School, SubscriptionStatus, SubscriptionPlan, PlatformPricing } from '../../types';
import * as api from '../../services/api';
import Modal from '../../components/common/Modal';
import StatCard from '../../components/common/StatCard';
import Skeleton from '../../components/common/Skeleton';
import Spinner from '../../components/common/Spinner';

const SuperAdminDashboard: React.FC = () => {
    const { addNotification, formatCurrency } = useData();
    const queryClient = useQueryClient();
    
    // UI State
    const [activeTab, setActiveTab] = useState<'overview' | 'revenue'>('overview');
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [configSection, setConfigSection] = useState<'pricing' | 'gateways'>('pricing');
    const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
    const [isEditSubModalOpen, setIsEditSubModalOpen] = useState(false);
    
    // Selection State
    const [selectedSchool, setSelectedSchool] = useState<any>(null);

    // Form States
    const [pricingForm, setPricingForm] = useState<Partial<PlatformPricing>>({});
    const [recoveryForm, setRecoveryForm] = useState({ email: '', phone: '' });
    const [subEditForm, setSubEditForm] = useState({ plan: SubscriptionPlan.FREE, status: SubscriptionStatus.TRIAL, endDate: '' });

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

    // --- Mutations ---
    const updateConfigMutation = useMutation({
        mutationFn: api.updatePlatformPricing,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['platform-stats'] });
            setIsConfigModalOpen(false);
            addNotification('Platform configuration locked successfully.', 'success');
        }
    });

    const updateIdentityMutation = useMutation({
        mutationFn: async (data: any) => {
            await api.updateSchoolEmail(data.id, data.email);
            await api.updateSchoolPhone(data.id, data.phone);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['super-schools'] });
            setIsRecoveryModalOpen(false);
            addNotification('Institutional identity successfully overwritten.', 'success');
        }
    });

    const updateSubMutation = useMutation({
        mutationFn: (data: any) => api.updateSchoolSubscription(data.schoolId, data.payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['super-schools'] });
            setIsEditSubModalOpen(false);
            addNotification('License provisioned successfully.', 'success');
        }
    });

    // --- Handlers ---
    const openConfig = () => {
        if (stats?.pricing) setPricingForm(stats.pricing);
        setIsConfigModalOpen(true);
    };

    const openRecovery = (school: any) => {
        setSelectedSchool(school);
        setRecoveryForm({ email: school.email || '', phone: school.phone || '' });
        setIsRecoveryModalOpen(true);
    };

    const openEditSub = (school: any) => {
        setSelectedSchool(school);
        setSubEditForm({
            plan: school.subscription?.plan || SubscriptionPlan.FREE,
            status: school.subscription?.status || SubscriptionStatus.TRIAL,
            endDate: school.subscription?.endDate ? new Date(school.subscription.endDate).toISOString().split('T')[0] : ''
        });
        setIsEditSubModalOpen(true);
    };

    const handlePricingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setPricingForm(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value
        }));
    };

    // Fix: Added handleSavePricing handler to fix line 214 error.
    const handleSavePricing = (e: React.FormEvent) => {
        e.preventDefault();
        updateConfigMutation.mutate(pricingForm);
    };

    // Fix: Added handleSaveSubscription handler to fix line 280 error.
    const handleSaveSubscription = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSchool) return;
        updateSubMutation.mutate({
            schoolId: selectedSchool.id,
            payload: subEditForm
        });
    };

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase">Platform Authority</h2>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">Super-Admin Global Governance</p>
                </div>
                <button 
                    onClick={openConfig} 
                    className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    Master Configuration
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <StatCard 
                    title="Realized Platform Revenue" value={formatCurrency(stats?.totalRevenue || 0)} loading={statsLoading}
                    icon={<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01"/></svg>}
                />
                <StatCard 
                    title="Total Schools Managed" value={schools.length.toString()} loading={schoolsLoading} colorClass="text-blue-600 bg-blue-50"
                    icon={<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>}
                />
                 <StatCard 
                    title="Active License Holders" value={stats?.activeSubs?.toString() || '0'} loading={statsLoading} colorClass="text-green-600 bg-green-50"
                    icon={<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                    <div className="flex space-x-6">
                        <button onClick={() => setActiveTab('overview')} className={`pb-2 font-black text-xs uppercase tracking-widest border-b-4 transition-all ${activeTab === 'overview' ? 'border-primary-600 text-slate-800' : 'border-transparent text-slate-300'}`}>Institutional Registry</button>
                        <button onClick={() => setActiveTab('revenue')} className={`pb-2 font-black text-xs uppercase tracking-widest border-b-4 transition-all ${activeTab === 'revenue' ? 'border-primary-600 text-slate-800' : 'border-transparent text-slate-300'}`}>Revenue Stream</button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {activeTab === 'overview' ? (
                        <table className="w-full text-left">
                            <thead className="bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest">
                                <tr>
                                    <th className="px-10 py-6">Institution</th>
                                    <th className="px-10 py-6">Licensing</th>
                                    <th className="px-10 py-6">Status</th>
                                    <th className="px-10 py-6 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 font-bold uppercase text-xs">
                                {schools.map((s: any) => (
                                    <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-10 py-5">
                                            <div className="text-slate-900 text-lg font-black tracking-tight">{s.name}</div>
                                            <div className="text-[10px] text-slate-400 font-black mt-1 lowercase">{s.email}</div>
                                        </td>
                                        <td className="px-10 py-5">
                                            <span className="px-3 py-1 bg-primary-50 text-primary-700 rounded-lg text-[10px] font-black">{s.subscription?.plan}</span>
                                        </td>
                                        <td className="px-10 py-5">
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black ${s.subscription?.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{s.subscription?.status}</span>
                                        </td>
                                        <td className="px-10 py-5 text-center space-x-2">
                                            <button onClick={() => openRecovery(s)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all font-black text-[10px]">RECOVERY</button>
                                            <button onClick={() => openEditSub(s)} className="px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-black transition-all font-black text-[10px]">PROVISION</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest">
                                <tr>
                                    <th className="px-10 py-6">Date</th>
                                    <th className="px-10 py-6">School</th>
                                    <th className="px-10 py-6">Reference</th>
                                    <th className="px-10 py-6 text-right">Net Valuation</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 font-bold uppercase text-xs">
                                {paymentsLoading ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <tr key={i}><td colSpan={4} className="p-10"><Skeleton className="h-8 w-full" /></td></tr>
                                    ))
                                ) : payments.map((p: any) => (
                                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-10 py-5 text-slate-400">{new Date(p.paymentDate).toLocaleDateString()}</td>
                                        <td className="px-10 py-5 text-slate-800">{p.school?.name}</td>
                                        <td className="px-10 py-5 font-mono text-primary-600 font-black">{p.transactionCode}</td>
                                        <td className="px-10 py-5 text-right text-lg font-black">{formatCurrency(p.amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* MASTER CONFIG MODAL */}
            <Modal isOpen={isConfigModalOpen} onClose={() => setIsConfigModalOpen(false)} title="Platform Ecosystem Configuration" size="2xl">
                <div className="flex space-x-6 mb-10 border-b border-slate-100">
                    <button onClick={() => setConfigSection('pricing')} className={`pb-4 font-black text-[10px] uppercase tracking-widest border-b-4 transition-all ${configSection === 'pricing' ? 'border-b-4 border-primary-600 text-slate-800' : 'text-slate-300'}`}>Revenue Logic</button>
                    <button onClick={() => setConfigSection('gateways')} className={`pb-4 font-black text-[10px] uppercase tracking-widest transition-all ${configSection === 'gateways' ? 'border-b-4 border-primary-600 text-slate-800' : 'text-slate-300'}`}>Collection Gateways</button>
                </div>

                <form onSubmit={handleSavePricing} className="space-y-8 p-1">
                    {configSection === 'pricing' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in-up">
                            <div className="p-6 bg-slate-50 rounded-[2rem] border-2 border-white shadow-sm">
                                <h4 className="font-black text-slate-800 text-[10px] uppercase tracking-widest mb-6">Standard Tier Pricing</h4>
                                <div className="space-y-4">
                                    <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase">Monthly (KES)</label><input type="number" name="basicMonthlyPrice" value={pricingForm.basicMonthlyPrice} onChange={handlePricingChange} className="w-full p-4 border-2 border-white rounded-2xl font-bold bg-white focus:border-primary-500 outline-none"/></div>
                                    <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase">Annual (KES)</label><input type="number" name="basicAnnualPrice" value={pricingForm.basicAnnualPrice} onChange={handlePricingChange} className="w-full p-4 border-2 border-white rounded-2xl font-bold bg-white focus:border-primary-500 outline-none"/></div>
                                </div>
                            </div>
                            <div className="p-6 bg-slate-900 rounded-[2rem] border-2 border-slate-800 text-white">
                                <h4 className="font-black text-primary-400 text-[10px] uppercase tracking-widest mb-6">Enterprise Tier Pricing</h4>
                                <div className="space-y-4">
                                    <div className="space-y-1"><label className="text-[9px] font-black text-slate-500 uppercase">Monthly (KES)</label><input type="number" name="premiumMonthlyPrice" value={pricingForm.premiumMonthlyPrice} onChange={handlePricingChange} className="w-full p-4 border-2 border-slate-800 bg-slate-800 rounded-2xl font-bold text-white outline-none focus:border-primary-500"/></div>
                                    <div className="space-y-1"><label className="text-[9px] font-black text-slate-500 uppercase">Annual (KES)</label><input type="number" name="premiumAnnualPrice" value={pricingForm.premiumAnnualPrice} onChange={handlePricingChange} className="w-full p-4 border-2 border-slate-800 bg-slate-800 rounded-2xl font-bold text-white outline-none focus:border-primary-500"/></div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-10 animate-fade-in-up">
                            <div className="space-y-6">
                                <h4 className="flex items-center text-lg font-black text-slate-800 tracking-tight uppercase"><img src="https://i.imgur.com/G5YvJ2F.png" className="h-5 mr-3" /> Lipa Na M-Pesa (C2B)</h4>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase">Paybill</label><input name="mpesaPaybill" value={pricingForm.mpesaPaybill} onChange={handlePricingChange} className="w-full p-4 border-2 border-slate-50 bg-slate-50 rounded-2xl font-bold"/></div>
                                    <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase">Passkey</label><input type="password" name="mpesaPasskey" value={pricingForm.mpesaPasskey} onChange={handlePricingChange} className="w-full p-4 border-2 border-slate-50 bg-slate-50 rounded-2xl font-bold"/></div>
                                    <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase">Consumer Key</label><input name="mpesaConsumerKey" value={pricingForm.mpesaConsumerKey} onChange={handlePricingChange} className="w-full p-4 border-2 border-slate-50 bg-slate-50 rounded-2xl font-bold"/></div>
                                    <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase">Consumer Secret</label><input type="password" name="mpesaConsumerSecret" value={pricingForm.mpesaConsumerSecret} onChange={handlePricingChange} className="w-full p-4 border-2 border-slate-50 bg-slate-50 rounded-2xl font-bold"/></div>
                                </div>
                            </div>
                            <div className="pt-8 border-t border-slate-100">
                                <h4 className="flex items-center text-lg font-black text-slate-800 tracking-tight uppercase"><svg className="w-6 h-6 mr-3 text-[#635BFF]" fill="currentColor" viewBox="0 0 24 24"><path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.915 0-1.17 1.256-1.936 2.756-1.936 1.704 0 2.946.852 3.655 2.14l2.58-1.572C18.256 2.378 16.036.8 13.376.8c-3.6 0-6.196 2.05-6.196 5.518 0 3.328 2.656 4.796 5.566 5.86 2.17.804 3.018 1.574 3.018 2.964 0 1.288-1.418 2.124-3.056 2.124-2.186 0-3.528-1.074-4.22-2.58L5.6 16.39c1.078 2.376 3.42 3.61 6.55 3.61 3.86 0 6.646-1.996 6.646-5.818 0-3.518-2.616-4.992-4.82-5.832"/></svg> Stripe Ecosystem</h4>
                                <div className="grid grid-cols-1 gap-4 mt-6">
                                    <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase">Publishable Key</label><input name="stripePublishableKey" value={pricingForm.stripePublishableKey} onChange={handlePricingChange} className="w-full p-4 border-2 border-slate-50 bg-slate-50 rounded-2xl font-bold"/></div>
                                    <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase">Secret Key</label><input type="password" name="stripeSecretKey" value={pricingForm.stripeSecretKey} onChange={handlePricingChange} className="w-full p-4 border-2 border-slate-50 bg-slate-50 rounded-2xl font-bold"/></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="flex justify-end pt-6 border-t">
                        <button type="submit" disabled={updateConfigMutation.isPending} className="px-12 py-4 bg-primary-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary-500/30 hover:bg-primary-700 transition-all flex items-center justify-center min-w-[200px]">
                            {updateConfigMutation.isPending ? <Spinner /> : 'Finalize Master Config'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* IDENTITY RECOVERY MODAL */}
            <Modal isOpen={isRecoveryModalOpen} onClose={() => setIsRecoveryModalOpen(false)} title={`Scholar Identity Overwrite: ${selectedSchool?.name}`} size="md">
                <form onSubmit={(e) => { e.preventDefault(); updateIdentityMutation.mutate({ id: selectedSchool.id, ...recoveryForm }); }} className="space-y-6">
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">Overwrite the institutional primary contact information to restore access for localized administrators.</p>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Administrative Email</label>
                        <input value={recoveryForm.email} onChange={e=>setRecoveryForm({...recoveryForm, email: e.target.value})} className="w-full p-4 border-2 border-slate-100 rounded-2xl font-bold bg-slate-50 outline-none focus:border-primary-500 transition-all" required/>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Support Phone</label>
                        <input value={recoveryForm.phone} onChange={e=>setRecoveryForm({...recoveryForm, phone: e.target.value})} className="w-full p-4 border-2 border-slate-100 rounded-2xl font-bold bg-slate-50 outline-none focus:border-primary-500 transition-all" required/>
                    </div>
                    <button type="submit" disabled={updateIdentityMutation.isPending} className="w-full py-5 bg-primary-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">
                        {updateIdentityMutation.isPending ? <Spinner /> : 'Force Identity Overwrite'}
                    </button>
                </form>
            </Modal>

            {/* SUBSCRIPTION PROVISIONING MODAL */}
            <Modal isOpen={isEditSubModalOpen} onClose={() => setIsEditSubModalOpen(false)} title="Institutional License Provisioning" size="md">
                <form onSubmit={handleSaveSubscription} className="space-y-6 p-1">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assigned Package</label>
                        <select value={subEditForm.plan} onChange={e=>setSubEditForm({...subEditForm, plan: e.target.value as SubscriptionPlan})} className="w-full p-4 border-2 border-slate-50 bg-slate-50 rounded-2xl font-bold outline-none">
                            {Object.values(SubscriptionPlan).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Service Status</label>
                        <select value={subEditForm.status} onChange={e=>setSubEditForm({...subEditForm, status: e.target.value as SubscriptionStatus})} className="w-full p-4 border-2 border-slate-50 bg-slate-50 rounded-2xl font-bold outline-none">
                            {Object.values(SubscriptionStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Forced Expiry Override</label>
                        <input type="date" value={subEditForm.endDate} onChange={e=>setSubEditForm({...subEditForm, endDate: e.target.value})} className="w-full p-4 border-2 border-slate-50 bg-slate-50 rounded-2xl font-bold outline-none" />
                    </div>
                    <button type="submit" disabled={updateSubMutation.isPending} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">
                        {updateSubMutation.isPending ? <Spinner /> : 'Commit Provisioning'}
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default SuperAdminDashboard;