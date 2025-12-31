
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import { initiateSTKPush } from '../services/darajaService';
import type { Transaction, NewTransaction } from '../types';
import { PaymentMethod, TransactionType } from '../types';
import { useData } from '../contexts/DataContext';
import GenerateInvoicesModal from '../components/common/GenerateInvoicesModal';
import ReceiptModal from '../components/common/ReceiptModal';
import * as api from '../services/api';
import Skeleton from '../components/common/Skeleton';

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

    const isMpesaConfigured = darajaSettings?.consumerKey && darajaSettings?.paybillNumber;

    // --- Queries ---

    const { data: students = [] } = useQuery({
        queryKey: ['students-list'],
        queryFn: () => api.getStudents({ limit: 1000 }).then(res => Array.isArray(res) ? res : res.data)
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Fees & Ledger</h2>
                    <p className="text-slate-500 font-medium">Manage school revenue and student balances.</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button onClick={() => setIsGenerateInvoicesModalOpen(true)} className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                        Bulk Bill
                    </button>
                    <button onClick={openRecordModal} className="px-5 py-2.5 bg-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-500/30 hover:bg-primary-700 transition-all flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                        Add Entry
                    </button>
                </div>
            </div>

            {/* Powerful Filtering Bar */}
            <div className="mb-6 bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 flex flex-col lg:row items-center gap-6">
                <div className="flex items-center space-x-3 w-full lg:w-auto">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Timeframe</label>
                    <select value={filterOption} onChange={handleFilterChange} className="p-3 border-2 border-slate-100 rounded-2xl focus:border-primary-500 outline-none bg-slate-50 font-bold text-slate-700">
                        <option value="all">All Records</option>
                        <option value="today">Today</option>
                        <option value="this_week">This Week</option>
                        <option value="this_month">This Month</option>
                        <option value="custom">Custom Range</option>
                    </select>
                </div>

                {filterOption === 'custom' && (
                    <div className="flex items-center space-x-3 w-full lg:w-auto animate-fade-in-right">
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-3 border-2 border-slate-100 rounded-2xl outline-none font-bold"/>
                        <span className="text-slate-300">to</span>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-3 border-2 border-slate-100 rounded-2xl outline-none font-bold"/>
                    </div>
                )}
                
                <div className="relative flex-grow w-full">
                    <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    <input 
                        type="text" 
                        placeholder="Search student name, ID or reference code..." 
                        value={searchTerm} 
                        onChange={e => { setSearchTerm(e.target.value); setPage(1); }} 
                        className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary-500 font-medium placeholder:text-slate-300 transition-all"
                    />
                </div>
            </div>

            {/* World Class Data Table */}
            <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-900 text-white">
                            <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px]">Date</th>
                            <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px]">Ref #</th>
                            <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px]">Type</th>
                            <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px]">Student Identity</th>
                            <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px] text-right">Amount</th>
                            <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px] text-center">Manage</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                             Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i}><td colSpan={6} className="px-6 py-4"><Skeleton className="h-6 w-full"/></td></tr>
                            ))
                        ) : transactions.length === 0 ? (
                             <tr><td colSpan={6} className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest">No entries found.</td></tr>
                        ) : (
                            transactions.map((p: any) => (
                                <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4 font-bold text-slate-500">{new Date(p.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 font-mono text-xs text-primary-700 font-black">{p.transactionCode || '-'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${p.type === TransactionType.Payment ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {p.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-black text-slate-800">{p.studentName || 'Unknown'}</div>
                                        <div className="text-[10px] text-slate-400 font-bold mt-0.5">{p.method ? `via ${p.method}` : 'Standard Billing'}</div>
                                    </td>
                                    <td className={`px-6 py-4 text-right font-black text-lg ${p.type === TransactionType.Payment ? 'text-green-600' : 'text-slate-800'}`}>
                                        {formatCurrency(p.amount)}
                                    </td>
                                    <td className="px-6 py-4 text-center space-x-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openReceiptModal(p)} className="text-primary-600 font-black text-[10px] uppercase hover:underline">Receipt</button>
                                        <button onClick={() => openEditModal(p)} className="text-blue-600 font-black text-[10px] uppercase hover:underline">Edit</button>
                                        <button onClick={() => {if(confirm('Delete permanently?')) deleteMutation.mutate(p.id)}} className="text-red-500 font-black text-[10px] uppercase hover:underline">Delete</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
             <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            
            {/* Entry Modal */}
            <Modal isOpen={isRecordModalOpen} onClose={() => setIsRecordModalOpen(false)} title={selectedTransaction ? "Modify Transaction" : "New Ledger Entry"}>
                <form onSubmit={handleSaveTransaction} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry Type</label>
                            <select 
                                value={paymentForm.type} 
                                onChange={e => setPaymentForm(p => ({...p, type: e.target.value as TransactionType}))} 
                                className="w-full p-3.5 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary-500 font-bold bg-slate-50"
                            >
                                <option value={TransactionType.Payment}>Payment (Credit)</option>
                                <option value={TransactionType.Invoice}>Invoice (Debit)</option>
                                <option value={TransactionType.ManualCredit}>Manual Credit (Waiver)</option>
                                <option value={TransactionType.ManualDebit}>Manual Debit (Penalty)</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</label>
                            <input type="date" value={paymentForm.date} onChange={e => setPaymentForm(p => ({...p, date: e.target.value}))} required className="w-full p-3.5 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary-500 font-bold bg-slate-50" />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Student</label>
                        <select value={paymentForm.studentId} onChange={e => setPaymentForm(p => ({...p, studentId: e.target.value}))} required className="w-full p-3.5 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary-500 font-bold bg-slate-50" disabled={!!selectedTransaction}>
                            <option value="">Choose student...</option>
                            {students.map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.admissionNumber})</option>)}
                        </select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</label>
                            <input type="number" value={paymentForm.amount || ''} onChange={e => setPaymentForm(p => ({...p, amount: parseFloat(e.target.value)}))} required className="w-full p-3.5 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary-500 font-bold bg-slate-50" placeholder="0.00" />
                        </div>
                        {paymentForm.type === TransactionType.Payment && (
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Method</label>
                                <select value={paymentForm.method} onChange={e => setPaymentForm(p => ({...p, method: e.target.value as PaymentMethod}))} className="w-full p-3.5 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary-500 font-bold bg-slate-50">
                                    {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="space-y-1">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</label>
                         <input type="text" value={paymentForm.description} onChange={e => setPaymentForm(p => ({...p, description: e.target.value}))} required className="w-full p-3.5 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary-500 font-bold bg-slate-50" placeholder="e.g. Term 2 Tuition" />
                    </div>

                    <div className="flex justify-end pt-6 border-t gap-4">
                        <button type="button" onClick={() => setIsRecordModalOpen(false)} className="px-6 py-3 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors">Cancel</button>
                        {paymentForm.method === PaymentMethod.MPesa && paymentForm.type === TransactionType.Payment && !selectedTransaction ? (
                            <button type="button" onClick={handleStkPush} disabled={isPaying || !isMpesaConfigured} className="px-8 py-3 bg-green-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-green-500/30 hover:bg-green-700 transition-all">
                                {isPaying ? 'Requesting PIN...' : 'Trigger M-Pesa STK'}
                            </button>
                        ) : (
                            <button type="submit" className="px-8 py-3 bg-primary-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-primary-500/30 hover:bg-primary-700 transition-all">
                                {selectedTransaction ? 'Apply Changes' : 'Commit to Ledger'}
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
