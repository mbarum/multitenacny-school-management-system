
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from '../common/Modal';
import Pagination from '../common/Pagination';
import { initiateSTKPush } from '../../services/darajaService';
import type { Transaction, NewTransaction } from '../../types';
import { PaymentMethod, TransactionType } from '../../types';
import { useData } from '../../contexts/DataContext';
import GenerateInvoicesModal from '../common/GenerateInvoicesModal';
import ReceiptModal from '../common/ReceiptModal';
import * as api from '../../services/api';
import Skeleton from '../common/Skeleton';
import StatCard from '../common/StatCard';
// Fix: Imported Spinner to resolve reference error.
import Spinner from '../common/Spinner';

const FeeManagementView: React.FC = () => {
    const { darajaSettings, addNotification, formatCurrency } = useData();
    const queryClient = useQueryClient();

    // UI State
    const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
    const [isSyncInfoModalOpen, setIsSyncInfoModalOpen] = useState(false);
    const [isGenerateInvoicesModalOpen, setIsGenerateInvoicesModalOpen] = useState(false);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [isPaying, setIsPaying] = useState(false);

    // Filter State
    const [filterOption, setFilterOption] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);

    // Form State
    const [paymentForm, setPaymentForm] = useState<Partial<Transaction>>({
        studentId: '', amount: 0, date: new Date().toISOString().split('T')[0], method: PaymentMethod.Cash, description: 'Fee Payment', type: TransactionType.Payment
    });

    const isMpesaConfigured = !!(darajaSettings?.consumerKey && darajaSettings?.paybillNumber);

    // --- Queries ---

    const { data: students = [] } = useQuery({
        queryKey: ['students-list'],
        queryFn: () => api.getStudents({ limit: 1000 }).then(res => Array.isArray(res) ? res : res.data)
    });

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: api.getDashboardStats
    });

    const getDateRange = () => {
        if (filterOption === 'custom') return { startDate, endDate };
        const now = new Date();
        const range: { startDate?: string, endDate?: string } = {};
        if (filterOption === 'today') range.startDate = range.endDate = now.toISOString().split('T')[0];
        else if (filterOption === 'this_week') {
            const day = now.getDay();
            const monday = new Date(now.setDate(now.getDate() - day + (day === 0 ? -6 : 1)));
            range.startDate = monday.toISOString().split('T')[0];
            range.endDate = new Date().toISOString().split('T')[0];
        } else if (filterOption === 'this_month') {
            range.startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            range.endDate = new Date().toISOString().split('T')[0];
        }
        return range;
    };

    const { startDate: qStart, endDate: qEnd } = getDateRange();

    const { data: transactionsData, isLoading } = useQuery({
        queryKey: ['transactions', page, searchTerm, filterOption, startDate, endDate],
        queryFn: () => api.getTransactions({
            page,
            limit: 10,
            search: searchTerm,
            startDate: qStart,
            endDate: qEnd
        }),
        placeholderData: (prev) => prev
    });

    const transactions = transactionsData?.data || [];
    const totalPages = transactionsData?.last_page || 1;

    // --- Mutations ---

    const createMutation = useMutation({
        mutationFn: api.createTransaction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
            addNotification("Transaction recorded successfully.", "success");
            setIsRecordModalOpen(false);
        },
        onError: () => addNotification("Failed to save transaction.", "error")
    });

    const updateMutation = useMutation({
        mutationFn: (data: { id: string, payload: any }) => api.updateTransaction(data.id, data.payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            addNotification("Transaction updated.", "success");
            setIsRecordModalOpen(false);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: api.deleteTransaction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            addNotification("Transaction deleted.", "success");
        }
    });

    // --- Handlers ---

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilterOption(e.target.value);
        setPage(1);
    };

    const openRecordModal = () => {
        setSelectedTransaction(null);
        setPaymentForm({
            studentId: '', amount: 0, date: new Date().toISOString().split('T')[0], method: PaymentMethod.Cash, description: 'Fee Payment', type: TransactionType.Payment
        });
        setIsRecordModalOpen(true);
    };

    const openEditModal = (transaction: Transaction) => {
        setSelectedTransaction(transaction);
        setPaymentForm({ ...transaction });
        setIsRecordModalOpen(true);
    };

    const openReceiptModal = (transaction: Transaction) => {
        setSelectedTransaction(transaction);
        setIsReceiptModalOpen(true);
    };

    const handleStkPush = async () => {
        if (!paymentForm.studentId || !paymentForm.amount || paymentForm.amount <= 0) {
            addNotification("Invalid payment details.", 'error');
            return;
        }
        const student = students.find((s: any) => s.id === paymentForm.studentId);
        if (!student) return;
        setIsPaying(true);
        try {
            const response = await initiateSTKPush(paymentForm.amount, student.guardianContact, student.admissionNumber);
            addNotification(response.CustomerMessage, 'info');
            setIsRecordModalOpen(false);
        } catch (error: any) {
            addNotification(error.message, 'error');
        } finally {
            setIsPaying(false);
        }
    };

    const handleSaveTransaction = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedTransaction) {
            updateMutation.mutate({ id: selectedTransaction.id, payload: paymentForm });
        } else {
            const student = students.find((s: any) => s.id === paymentForm.studentId);
            createMutation.mutate({
                ...paymentForm,
                studentName: student?.name,
                type: paymentForm.type || TransactionType.Payment,
                amount: paymentForm.amount || 0,
                date: paymentForm.date || new Date().toISOString(),
                description: paymentForm.description || 'Fee Payment'
            } as NewTransaction);
        }
    };

    return (
        <div className="p-6 md:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Fees & Ledger</h2>
                    <p className="text-slate-500 font-medium">Professional school revenue management.</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button onClick={() => setIsGenerateInvoicesModalOpen(true)} className="px-5 py-3 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-black transition-all flex items-center uppercase text-xs tracking-widest">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                        Run Bulk Invoicing
                    </button>
                    <button onClick={openRecordModal} className="px-5 py-3 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-600/30 hover:bg-primary-700 transition-all flex items-center uppercase text-xs tracking-widest">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                        New Transaction
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                 <StatCard 
                    title="Total Collected" 
                    value={formatCurrency(stats?.totalRevenue || 0)} 
                    loading={statsLoading}
                    icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
                <StatCard 
                    title="Total Overdue" 
                    value={formatCurrency(stats?.feesOverdue || 0)} 
                    loading={statsLoading}
                    colorClass="text-red-600 bg-red-50"
                    icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
                 <StatCard 
                    title="Net Profit/Loss" 
                    value={formatCurrency(stats?.totalProfit || 0)} 
                    loading={statsLoading}
                    colorClass={ (stats?.totalProfit || 0) >= 0 ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}
                    icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                />
            </div>

            <div className="mb-6 bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 flex flex-col lg:flex-row items-center gap-6">
                <div className="flex items-center space-x-3 w-full lg:w-auto">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">View Range</label>
                    <select value={filterOption} onChange={handleFilterChange} className="p-3 border-2 border-slate-100 rounded-2xl focus:border-primary-500 outline-none bg-slate-50 font-bold text-slate-700 text-sm">
                        <option value="all">All Records</option>
                        <option value="today">Today</option>
                        <option value="this_week">This Week</option>
                        <option value="this_month">This Month</option>
                        <option value="custom">Custom Range</option>
                    </select>
                </div>

                {filterOption === 'custom' && (
                    <div className="flex items-center space-x-3 w-full lg:w-auto animate-fade-in-right">
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-3 border-2 border-slate-100 rounded-2xl outline-none font-bold text-sm"/>
                        <span className="text-slate-300">to</span>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-3 border-2 border-slate-100 rounded-2xl outline-none font-bold text-sm"/>
                    </div>
                )}
                
                <div className="relative flex-grow w-full">
                    <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    <input 
                        type="text" 
                        placeholder="Search student, ref code..." 
                        value={searchTerm} 
                        onChange={e => { setSearchTerm(e.target.value); setPage(1); }} 
                        className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary-500 font-medium placeholder:text-slate-300 transition-all text-sm"
                    />
                </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-900 text-white">
                            <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px]">Date</th>
                            <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px]">Type</th>
                            <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px]">Identity</th>
                            <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px] text-right">Amount</th>
                            <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px] text-center">Reference</th>
                            <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px] text-center">Manage</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                             Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i}><td colSpan={6} className="px-6 py-5"><Skeleton className="h-6 w-full"/></td></tr>
                            ))
                        ) : transactions.length === 0 ? (
                             <tr><td colSpan={6} className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest">No matching ledger entries.</td></tr>
                        ) : (
                            transactions.map((p: any) => (
                                <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="font-bold text-slate-800">{new Date(p.date).toLocaleDateString()}</div>
                                        <div className="text-[10px] text-slate-400 font-black uppercase mt-0.5">{new Date(p.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                            p.type === TransactionType.Payment ? 'bg-green-100 text-green-700' : 
                                            p.type === TransactionType.Invoice ? 'bg-blue-100 text-blue-700' :
                                            'bg-amber-100 text-amber-700'
                                        }`}>
                                            {p.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="font-black text-slate-800">{p.studentName || 'Unknown Student'}</div>
                                        <div className="text-[10px] text-slate-400 font-bold mt-0.5">{p.method ? `Mode: ${p.method}` : 'Standard Billing'}</div>
                                    </td>
                                    <td className={`px-6 py-5 text-right font-black text-lg ${p.type === TransactionType.Payment ? 'text-green-600' : 'text-slate-800'}`}>
                                        {formatCurrency(p.amount)}
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                         <div className="font-mono text-xs text-primary-700 font-black">{p.transactionCode || '---'}</div>
                                    </td>
                                    <td className="px-6 py-5 text-center space-x-3">
                                        <button onClick={() => openReceiptModal(p)} className="p-2 text-slate-400 hover:text-primary-600 transition-colors" title="Print Receipt">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm7-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                        </button>
                                        <button onClick={() => openEditModal(p)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors" title="Edit Entry">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        </button>
                                        <button onClick={() => {if(confirm('Delete ledger entry?')) deleteMutation.mutate(p.id)}} className="p-2 text-slate-400 hover:text-red-600 transition-colors" title="Remove Entry">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
             <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            
            {/* Record Entry Modal */}
            <Modal isOpen={isRecordModalOpen} onClose={() => setIsRecordModalOpen(false)} title={selectedTransaction ? "Modify Transaction" : "New Ledger Entry"} size="lg">
                <form onSubmit={handleSaveTransaction} className="space-y-8">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry Type</label>
                            <select 
                                value={paymentForm.type} 
                                onChange={e => setPaymentForm(p => ({...p, type: e.target.value as TransactionType}))} 
                                className="w-full p-4 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary-500 font-bold bg-slate-50"
                            >
                                <option value={TransactionType.Payment}>Payment (Credit)</option>
                                <option value={TransactionType.Invoice}>Invoice (Debit)</option>
                                <option value={TransactionType.ManualCredit}>Credit Waiver</option>
                                <option value={TransactionType.ManualDebit}>Penalty/Fine</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction Date</label>
                            <input type="date" value={paymentForm.date} onChange={e => setPaymentForm(p => ({...p, date: e.target.value}))} required className="w-full p-4 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary-500 font-bold bg-slate-50" />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Search Student</label>
                        <select value={paymentForm.studentId} onChange={e => setPaymentForm(p => ({...p, studentId: e.target.value}))} required className="w-full p-4 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary-500 font-bold bg-slate-50" disabled={!!selectedTransaction}>
                            <option value="">Choose a student...</option>
                            {students.map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.admissionNumber})</option>)}
                        </select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount ({useData().schoolInfo?.currency || 'KES'})</label>
                            <input type="number" value={paymentForm.amount || ''} onChange={e => setPaymentForm(p => ({...p, amount: parseFloat(e.target.value)}))} required className="w-full p-4 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary-500 font-bold bg-slate-50" placeholder="0.00" />
                        </div>
                        {paymentForm.type === TransactionType.Payment && (
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Channel</label>
                                <select value={paymentForm.method} onChange={e => setPaymentForm(p => ({...p, method: e.target.value as PaymentMethod}))} className="w-full p-4 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary-500 font-bold bg-slate-50">
                                    {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="space-y-1">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description / Note</label>
                         <input type="text" value={paymentForm.description} onChange={e => setPaymentForm(p => ({...p, description: e.target.value}))} required className="w-full p-4 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary-500 font-bold bg-slate-50" placeholder="e.g. 2nd Term Tuition Fee" />
                    </div>

                    <div className="flex justify-end pt-6 border-t gap-4">
                        <button type="button" onClick={() => setIsRecordModalOpen(false)} className="px-8 py-4 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-600 transition-colors">Discard</button>
                        {paymentForm.method === PaymentMethod.MPesa && paymentForm.type === TransactionType.Payment && !selectedTransaction ? (
                            <button type="button" onClick={handleStkPush} disabled={isPaying || !isMpesaConfigured} className="px-10 py-4 bg-green-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-green-500/30 hover:bg-green-700 transition-all flex items-center gap-3">
                                {isPaying ? <Spinner /> : 'Push M-Pesa STK'}
                            </button>
                        ) : (
                            <button type="submit" className="px-10 py-4 bg-primary-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-primary-500/30 hover:bg-primary-700 transition-all">
                                {selectedTransaction ? 'Update Record' : 'Post to Ledger'}
                            </button>
                        )}
                    </div>
                </form>
            </Modal>
            
            <GenerateInvoicesModal isOpen={isGenerateInvoicesModalOpen} onClose={() => setIsGenerateInvoicesModalOpen(false)} />
            <ReceiptModal isOpen={isReceiptModalOpen} onClose={() => setIsReceiptModalOpen(false)} transaction={selectedTransaction} />
        </div>
    );
};

export default FeeManagementView;
