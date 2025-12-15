
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import { initiateSTKPush } from '../services/darajaService';
import type { Transaction, NewTransaction } from '../types';
import { PaymentMethod, TransactionType } from '../types';
import { useData } from '../contexts/DataContext';
import GenerateInvoicesModal from '../components/common/GenerateInvoicesModal';
import * as api from '../services/api';
import Skeleton from '../components/common/Skeleton';

const FeeManagementView: React.FC = () => {
    const { darajaSettings, addNotification, formatCurrency } = useData();
    const queryClient = useQueryClient();

    // UI State
    const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSyncInfoModalOpen, setIsSyncInfoModalOpen] = useState(false);
    const [isGenerateInvoicesModalOpen, setIsGenerateInvoicesModalOpen] = useState(false);
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

    // 1. Fetch Students for Dropdown (Cached)
    const { data: students = [] } = useQuery({
        queryKey: ['students-list'],
        queryFn: () => api.getStudents({ mode: 'minimal', limit: 1000 }).then(res => Array.isArray(res) ? res : res.data)
    });

    // 2. Calculate Dates for Filters
    const getDateRange = () => {
        if (filterOption === 'custom') return { startDate, endDate };
        
        const now = new Date();
        const range: { startDate?: string, endDate?: string } = {};
        
        if (filterOption === 'today') {
            range.startDate = now.toISOString().split('T')[0];
            range.endDate = now.toISOString().split('T')[0];
        } else if (filterOption === 'this_week') {
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1); 
            const monday = new Date(now.setDate(diff));
            range.startDate = monday.toISOString().split('T')[0];
            range.endDate = new Date().toISOString().split('T')[0];
        } else if (filterOption === 'this_month') {
            range.startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            range.endDate = new Date().toISOString().split('T')[0];
        }
        return range;
    };

    const { startDate: qStart, endDate: qEnd } = getDateRange();

    // 3. Fetch Transactions (Server Paginated)
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
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] }); // Update dashboard revenue
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
        if (e.target.value !== 'custom') {
            setStartDate('');
            setEndDate('');
        }
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

    const handleDelete = (id: string) => {
        if(window.confirm("Are you sure you want to delete this transaction? This will affect balances.")) {
            deleteMutation.mutate(id);
        }
    }
    
    const handleStkPush = async () => {
        if (!paymentForm.studentId || !paymentForm.amount || paymentForm.amount <= 0) {
            addNotification("Please select a student and enter a valid amount.", 'error');
            return;
        }

        const student = students.find((s: any) => s.id === paymentForm.studentId);
        if (!student) {
            addNotification("Could not find selected student.", 'error');
            return;
        }

        setIsPaying(true);
        addNotification("Sending payment request to guardian's phone...", 'info');
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
                // Ensure required fields
                type: paymentForm.type || TransactionType.Payment,
                amount: paymentForm.amount || 0,
                date: paymentForm.date || new Date().toISOString(),
                description: paymentForm.description || 'Fee Payment'
            } as NewTransaction);
        }
    };

    return (
        <div className="p-6 md:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h2 className="text-3xl font-bold text-slate-800">Fee Management</h2>
                <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                     <button 
                        onClick={() => setIsSyncInfoModalOpen(true)}
                        disabled={!isMpesaConfigured}
                        className="px-4 py-2 bg-slate-500 text-white font-semibold rounded-lg shadow-md hover:bg-slate-600 disabled:bg-slate-400 disabled:cursor-not-allowed"
                        title={!isMpesaConfigured ? "Please configure M-Pesa settings first" : "About M-Pesa Payment Confirmation"}
                    >
                        M-Pesa Info
                    </button>
                    <button onClick={() => setIsGenerateInvoicesModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">Generate Invoices</button>
                    <button onClick={openRecordModal} className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700">Record Transaction</button>
                </div>
            </div>

            {/* Filters */}
            <div className="mb-4 bg-white p-4 rounded-xl shadow-lg flex flex-col sm:flex-row items-center gap-4">
                <div className="flex items-center space-x-4 w-full sm:w-auto">
                    <label htmlFor="date-filter" className="font-medium text-slate-700 whitespace-nowrap">Filter by:</label>
                    <select id="date-filter" value={filterOption} onChange={handleFilterChange} className="p-2 border border-slate-300 rounded-lg w-full sm:w-auto">
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="this_week">This Week</option>
                        <option value="this_month">This Month</option>
                        <option value="custom">Custom Range</option>
                    </select>
                </div>

                {filterOption === 'custom' && (
                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 border border-slate-300 rounded-lg w-full"/>
                        <span className="text-slate-500">to</span>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 border border-slate-300 rounded-lg w-full"/>
                    </div>
                )}
                
                <div className="flex-grow">
                    <input 
                        type="text" 
                        placeholder="Search student, description or code..." 
                        value={searchTerm} 
                        onChange={e => { setSearchTerm(e.target.value); setPage(1); }} 
                        className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-x-auto min-h-[400px]">
                <table className="w-full text-left table-auto">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-4 py-3 font-semibold text-slate-600">Date</th>
                            <th className="px-4 py-3 font-semibold text-slate-600">Type</th>
                            <th className="px-4 py-3 font-semibold text-slate-600">Student Name</th>
                            <th className="px-4 py-3 font-semibold text-slate-600">Description</th>
                            <th className="px-4 py-3 font-semibold text-slate-600 text-right">Amount</th>
                            <th className="px-4 py-3 font-semibold text-slate-600">Method</th>
                            <th className="px-4 py-3 font-semibold text-slate-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                             Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="border-b border-slate-100">
                                    <td className="px-4 py-4"><Skeleton className="h-4 w-24"/></td>
                                    <td className="px-4 py-4"><Skeleton className="h-4 w-20"/></td>
                                    <td className="px-4 py-4"><Skeleton className="h-4 w-48"/></td>
                                    <td className="px-4 py-4"><Skeleton className="h-4 w-32"/></td>
                                    <td className="px-4 py-4"><Skeleton className="h-4 w-24"/></td>
                                    <td className="px-4 py-4"><Skeleton className="h-4 w-20"/></td>
                                    <td className="px-4 py-4"><Skeleton className="h-4 w-24"/></td>
                                </tr>
                            ))
                        ) : transactions.length === 0 ? (
                             <tr><td colSpan={7} className="text-center py-8 text-slate-500">No transactions found.</td></tr>
                        ) : (
                            transactions.map((p: any) => (
                                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="px-4 py-3 text-slate-500">{new Date(p.date).toLocaleDateString()}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${p.type === TransactionType.Payment ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {p.type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 font-semibold text-slate-800">{p.studentName || 'Unknown'}</td>
                                    <td className="px-4 py-3 text-slate-600">{p.description}</td>
                                    <td className="px-4 py-3 text-right font-medium text-slate-800">{formatCurrency(p.amount)}</td>
                                    <td className="px-4 py-3 text-slate-600">{p.method || '-'}</td>
                                    <td className="px-4 py-3 space-x-2">
                                        <button onClick={() => openEditModal(p)} className="text-blue-600 hover:underline">Edit</button>
                                        <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:underline">Delete</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
             <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            
            {/* Record/Edit Modal */}
            <Modal isOpen={isRecordModalOpen} onClose={() => setIsRecordModalOpen(false)} title={selectedTransaction ? "Edit Transaction" : "Record New Transaction"}>
                <form onSubmit={handleSaveTransaction} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Transaction Type</label>
                            <select 
                                name="type" 
                                value={paymentForm.type} 
                                onChange={e => setPaymentForm(p => ({...p, type: e.target.value as TransactionType}))} 
                                className="w-full p-2 border border-slate-300 rounded-lg"
                            >
                                <option value={TransactionType.Payment}>Payment</option>
                                <option value={TransactionType.Invoice}>Invoice (Charge)</option>
                                <option value={TransactionType.ManualCredit}>Credit Note (Waiver)</option>
                                <option value={TransactionType.ManualDebit}>Debit Note (Fine)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Date</label>
                            <input type="date" name="date" value={paymentForm.date} onChange={e => setPaymentForm(p => ({...p, date: e.target.value}))} required className="w-full p-2 border border-slate-300 rounded-lg" />
                        </div>
                    </div>

                    <select name="studentId" value={paymentForm.studentId} onChange={e => setPaymentForm(p => ({...p, studentId: e.target.value}))} required className="w-full p-2 border border-slate-300 rounded-lg" disabled={!!selectedTransaction}>
                        <option value="">Select Student</option>
                        {students.map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.admissionNumber})</option>)}
                    </select>
                    
                    <input type="number" name="amount" placeholder="Amount" value={paymentForm.amount || ''} onChange={e => setPaymentForm(p => ({...p, amount: parseFloat(e.target.value)}))} required className="w-full p-2 border border-slate-300 rounded-lg" />
                    <input type="text" name="description" placeholder="Description (e.g. Term 1 Fees)" value={paymentForm.description} onChange={e => setPaymentForm(p => ({...p, description: e.target.value}))} required className="w-full p-2 border border-slate-300 rounded-lg" />

                    {(paymentForm.type === TransactionType.Payment) && (
                        <>
                            <select name="method" value={paymentForm.method} onChange={e => setPaymentForm(p => ({...p, method: e.target.value as PaymentMethod, transactionCode: '', checkBank: '', checkNumber: ''}))} className="w-full p-2 border border-slate-300 rounded-lg">
                                {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                            
                            {paymentForm.method === PaymentMethod.Cash && <input type="text" name="transactionCode" placeholder="Received by..." value={paymentForm.transactionCode || ''} onChange={e => setPaymentForm(p => ({...p, transactionCode: e.target.value}))} className="w-full p-2 border border-slate-300 rounded-lg" />}
                            {paymentForm.method === PaymentMethod.Check && (
                                <div className="grid grid-cols-2 gap-2">
                                    <input type="text" name="checkNumber" placeholder="Check Number" value={paymentForm.checkNumber || ''} onChange={e => setPaymentForm(p => ({...p, checkNumber: e.target.value}))} className="w-full p-2 border border-slate-300 rounded-lg" />
                                    <input type="text" name="checkBank" placeholder="Bank Name" value={paymentForm.checkBank || ''} onChange={e => setPaymentForm(p => ({...p, checkBank: e.target.value}))} className="w-full p-2 border border-slate-300 rounded-lg" />
                                </div>
                            )}
                        </>
                    )}

                    <div className="flex justify-end pt-4">
                        {!selectedTransaction && paymentForm.method === PaymentMethod.MPesa && paymentForm.type === TransactionType.Payment ? (
                            <button type="button" onClick={handleStkPush} disabled={isPaying || !isMpesaConfigured} className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 disabled:bg-slate-400 disabled:cursor-not-allowed">
                                {isPaying ? 'Processing...' : 'Send STK Push'}
                            </button>
                        ) : (
                            <button type="submit" className="px-6 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700">
                                {selectedTransaction ? 'Update Transaction' : 'Save Transaction'}
                            </button>
                        )}
                    </div>
                     {!isMpesaConfigured && paymentForm.method === PaymentMethod.MPesa && <p className="text-xs text-red-600 text-center mt-2">M-Pesa settings are not configured. Please update them in the Settings page to enable STK push.</p>}
                </form>
            </Modal>
            
            <Modal isOpen={isSyncInfoModalOpen} onClose={() => setIsSyncInfoModalOpen(false)} title="M-Pesa Payment Confirmation">
                <div className="space-y-4 text-slate-700">
                    <h3 className="text-lg font-semibold text-slate-800">Production-Ready Architecture</h3>
                    <p>M-Pesa payments (both Paybill and STK Push) are confirmed asynchronously. This means after a parent pays, M-Pesa sends a confirmation to a special <strong className="font-semibold">Callback URL</strong> on our secure backend server.</p>
                    <p>The backend server is responsible for:</p>
                    <ul className="list-disc list-inside pl-4 space-y-1">
                        <li>Receiving the transaction confirmation from M-Pesa.</li>
                        <li>Verifying the payment is authentic and valid.</li>
                        <li>Automatically finding the correct student using the admission number (BillRefNumber).</li>
                        <li>Securely adding the payment transaction to the student's ledger.</li>
                    </ul>
                    <p>This ensures every payment is securely processed and automatically reconciled without manual intervention.</p>
                </div>
            </Modal>
            <GenerateInvoicesModal 
                isOpen={isGenerateInvoicesModalOpen}
                onClose={() => setIsGenerateInvoicesModalOpen(false)}
            />
        </div>
    );
};

export default FeeManagementView;
