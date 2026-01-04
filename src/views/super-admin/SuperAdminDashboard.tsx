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
    const [phone, setPhone] = useState('');
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
            addNotification('Registry synchronized successfully.', 'success');
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

    // --- PDF Helper ---
    const generateDocument = (schoolName: string, sub: any, isReceipt = false, paymentData?: any) => {
        const doc = new jsPDF();
        const primaryColor = [52, 105, 85]; // Saaslink Green
        
        // Header
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(0, 0, 10, 297, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(28);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text('SAASLINK', 20, 25);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text('CLOUD INFRASTRUCTURE FOR EDUCATION', 20, 32);

        // Body
        doc.setFillColor(240, 240, 240);
        doc.rect(20, 45, 170, 15, 'F');
        doc.setFontSize(16);
        doc.setTextColor(0);
        doc.text(isReceipt ? 'OFFICIAL RECEIPT' : 'PROFORMA INVOICE', 25, 55);
        doc.setFontSize(10);
        doc.text(`REF: ${isReceipt ? paymentData?.transactionCode : sub?.invoiceNumber}`, 185, 55, { align: 'right' });

        doc.setFontSize(9);
        doc.setTextColor(150);
        doc.text(isReceipt ? 'ISSUED TO:' : 'BILL TO:', 20, 75);
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.setFont('helvetica', 'bold');
        doc.text(schoolName.toUpperCase(), 20, 82);

        // Details
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(20, 110, 170, 10, 'F');
        doc.setTextColor(255);
        doc.text('ITEM DESCRIPTION', 25, 116.5);
        doc.text('AMOUNT (KES)', 185, 116.5, { align: 'right' });

        const amount = isReceipt ? paymentData?.amount : (sub?.plan === 'BASIC' ? (stats?.pricing?.basicMonthlyPrice || 3000) : (stats?.pricing?.premiumMonthlyPrice || 5000)) * 1.16;
        
        doc.setTextColor(0);
        doc.setFont('helvetica', 'normal');
        doc.text(`${sub?.plan || 'Standard'} Subscription License`, 25, 130);
        doc.text(amount.toLocaleString(), 185, 130, { align: 'right' });
        
        doc.setDrawColor(200);
        doc.line(140, 142, 190, 142);
        doc.setFont('helvetica', 'bold');
        doc.text(`TOTAL: KES ${amount.toLocaleString()}`, 185, 150, { align: 'right' });

        if (!isReceipt) {
            doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.roundedRect(20, 170, 170, 40, 3, 3, 'D');
            doc.text('SETTLEMENT INSTRUCTIONS', 25, 180);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text('Bank: I&M Bank Kenya | Acc: 05206707336350', 25, 190);
            doc.setFont('helvetica', 'bold');
            doc.text(`REFERENCE: ${sub?.invoiceNumber}`, 25, 200);
        } else {
             doc.text('PAYMENT VERIFIED ELECTRONICALLY', 20, 180);
             doc.setFontSize(8);
             doc.setTextColor(150);
             doc.text(`Processed on: ${new Date(paymentData?.paymentDate).toLocaleString()}`, 20, 185);
        }

        doc.save(`${isReceipt ? 'Receipt' : 'Invoice'}_${schoolName.replace(/\s+/g, '_')}.pdf`);
    };

    // --- Computed Data ---
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
        if (filter === 'pending') return schools.filter((s: any) => s.subscription?.status === SubscriptionStatus.PENDING_APPROVAL || s.subscription?.status === SubscriptionStatus.PENDING_PAYMENT);
        return schools;
    }, [schools, filter]);

    // --- Handlers ---
    
    // FIX: Added missing handleOpenPricing handler
    const handleOpenPricing = () => {
        if (stats?.pricing) {
            setPricingForm(stats.pricing);
        }
        setIsPricingModalOpen(true);
    };

    // FIX: Added missing handleSavePricing handler
    const handleSavePricing = (e: React.FormEvent) => {
        e.preventDefault();
        updatePricingMutation.mutate(pricingForm);
    };

    // FIX: Added missing handlePricingChange handler
    const handlePricingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setPricingForm(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value
        }));
    };

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

        updateSubscriptionMutation.mutate({
            schoolId: selectedSchool.id,
            payload: { plan, status, endDate: endDate || undefined }
        });
    };

    return (
        <div className="p-6 md:p-8 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Saaslink Authority</h2>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">Platform Control Center</p>
                </div>
                <div className="flex space-x-3">
                     <button onClick={() => { setIsHealthModalOpen(true); refetchHealth(); }} className="px-5 py-3 bg-white text-slate-700 border-2 border-slate-100 rounded-2xl shadow-sm hover:bg-slate-50 font-black text-xs uppercase tracking-widest flex items-center transition-all">
                        Health Status
                    </button>
                    <button onClick={handleOpenPricing} className="px-5 py-3 bg-slate-900 text-white rounded-2xl shadow-xl hover:bg-black font-black text-xs uppercase tracking-widest transition-all">
                        Platform Architecture
                    </button>
                </div>
            </div>
            
            <div className="border-b border-slate-200 overflow-x-auto scrollbar-hide">
                <nav className="-mb-px flex space-x-8">
                    <button onClick={() => setActiveTab('overview')} className={`whitespace-nowrap py-4 px-1 border-b-4 font-black text-[10px] uppercase tracking-[0.2em] ${activeTab === 'overview' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Directory</button>
                    <button onClick={() => setActiveTab('invoices')} className={`whitespace-nowrap py-4 px-1 border-b-4 font-black text-[10px] uppercase tracking-[0.2em] ${activeTab === 'invoices' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Wire Verification</button>
                    <button onClick={() => setActiveTab('revenue')} className={`whitespace-nowrap py-4 px-1 border-b-4 font-black text-[10px] uppercase tracking-[0.2em] ${activeTab === 'revenue' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Revenue Ledger</button>
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
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-8 py-5 font-black uppercase text-[10px] text-slate-400">School Identity</th>
                                    <th className="px-8 py-5 font-black uppercase text-[10px] text-slate-400">Ref Code</th>
                                    <th className="px-8 py-5 font-black uppercase text-[10px] text-slate-400">Subscription Status</th>
                                    <th className="px-8 py-5 font-black uppercase text-[10px] text-slate-400 text-center">Manage</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredSchools.map((school: any) => (
                                    <tr key={school.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="font-black text-slate-800 text-lg uppercase">{school.name}</div>
                                            <div className="text-[10px] text-slate-400 font-bold mt-0.5">{school.email} | {school.phone}</div>
                                        </td>
                                        <td className="px-8 py-5 font-mono text-xs font-black text-primary-600">{school.subscription?.invoiceNumber || '---'}</td>
                                        <td className="px-8 py-5">
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                                school.subscription?.status === SubscriptionStatus.ACTIVE ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                                {school.subscription?.plan || 'FREE'} - {school.subscription?.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <button onClick={() => openEditModal(school)} className="px-6 py-2 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest">Configure</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'invoices' && (
                <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
                    <div className="p-8 border-b border-slate-200">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Pending Wire Invoices</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-8 py-5 font-black uppercase text-[10px] text-slate-400">Ref #</th>
                                    <th className="px-8 py-5 font-black uppercase text-[10px] text-slate-400">Institution</th>
                                    <th className="px-8 py-5 font-black uppercase text-[10px] text-slate-400 text-right">Amount Due</th>
                                    <th className="px-8 py-5 font-black uppercase text-[10px] text-slate-400 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {pendingInvoices.map((school: any) => (
                                    <tr key={school.id} className="hover:bg-slate-50">
                                        <td className="px-8 py-5 font-mono text-xs font-black text-primary-600">{school.subscription.invoiceNumber}</td>
                                        <td className="px-8 py-5 font-bold uppercase">{school.name}</td>
                                        <td className="px-8 py-5 text-right font-black">
                                            {formatCurrency((school.subscription.plan === 'BASIC' ? stats?.pricing?.basicMonthlyPrice : stats?.pricing?.premiumMonthlyPrice) * 1.16)}
                                        </td>
                                        <td className="px-8 py-5 text-center space-x-2">
                                            <button onClick={() => generateDocument(school.name, school.subscription)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-black text-[10px] uppercase">Proforma PDF</button>
                                            <button 
                                                onClick={() => {
                                                    const amount = (school.subscription.plan === 'BASIC' ? stats?.pricing?.basicMonthlyPrice : stats?.pricing?.premiumMonthlyPrice) * 1.16;
                                                    if (confirm(`Activate ${school.name}?`)) approvePaymentMutation.mutate({ schoolId: school.id, amount, transactionCode: school.subscription.invoiceNumber, date: new Date().toISOString().split('T')[0], method: 'WIRE' });
                                                }} 
                                                className="px-6 py-2 bg-green-600 text-white rounded-xl font-black text-[10px] uppercase"
                                            >
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
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Historical Revenue Ledger</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-8 py-5 font-black uppercase text-[10px] text-slate-400">Date</th>
                                    <th className="px-8 py-5 font-black uppercase text-[10px] text-slate-400">Client</th>
                                    <th className="px-8 py-5 font-black uppercase text-[10px] text-slate-400">Amount</th>
                                    <th className="px-8 py-5 font-black uppercase text-[10px] text-slate-400 text-center">Receipt</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-bold uppercase text-xs">
                                {payments.map((payment: any) => (
                                    <tr key={payment.id} className="hover:bg-slate-50">
                                        <td className="px-8 py-5 text-slate-500">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                                        <td className="px-8 py-5">{payment.school?.name}</td>
                                        <td className="px-8 py-5 text-primary-600">{formatCurrency(payment.amount)}</td>
                                        <td className="px-8 py-5 text-center">
                                            <button onClick={() => generateDocument(payment.school?.name, payment.school?.subscription, true, payment)} className="px-4 py-2 border rounded-lg hover:bg-slate-100">Download Receipt</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Edit Subscription Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Management Dossier: ${selectedSchool?.name}`} size="md">
                <form onSubmit={handleSaveSubscription} className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                        <h4 className="text-[10px] font-black text-primary-600 uppercase tracking-widest">Subscription Logic</h4>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Service Package</label>
                                <select value={plan} onChange={e => setPlan(e.target.value as SubscriptionPlan)} className="w-full p-3 border rounded-xl font-bold">
                                    {Object.values(SubscriptionPlan).map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Account State</label>
                                <select value={status} onChange={e => setStatus(e.target.value as SubscriptionStatus)} className="w-full p-3 border rounded-xl font-bold">
                                    {Object.values(SubscriptionStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                         <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Expiry Override</label>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-3 border rounded-xl font-bold" />
                        </div>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                        <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Institutional Contacts</h4>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Administrative Email</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 border rounded-xl font-bold" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Primary Phone</label>
                            <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-3 border rounded-xl font-bold" />
                        </div>
                    </div>

                    <div className="pt-4 border-t flex flex-col gap-3">
                        <button type="submit" disabled={updateSubscriptionMutation.isPending} className="w-full py-4 bg-primary-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">
                            {updateSubscriptionMutation.isPending ? <Spinner /> : 'Save Profile Changes'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Manage Pricing Modal */}
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
                    <div className="p-8 text-center"><Spinner /></div>
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
