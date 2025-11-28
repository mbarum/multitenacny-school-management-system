import React, { useState, useMemo, useEffect } from 'react';
import Modal from '../common/Modal';
import Pagination from '../common/Pagination';
import { initiateSTKPush } from '../../services/darajaService';
import type { Transaction, NewTransaction } from '../../types';
// Fix: Import TransactionType to use enum members.
import { PaymentMethod, TransactionType } from '../../types';
import { useData } from '../../contexts/DataContext';

const FeeManagementView: React.FC = () => {
    const { transactions, addTransaction, students, darajaSettings, addNotification } = useData();
    const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
    const [newPayment, setNewPayment] = useState<Partial<NewTransaction>>({
        studentId: '', amount: 0, date: new Date().toISOString().split('T')[0], method: PaymentMethod.Cash, description: 'Fee Payment'
    });

    const [filterOption, setFilterOption] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isPaying, setIsPaying] = useState(false);
    const [isSyncInfoModalOpen, setIsSyncInfoModalOpen] = useState(false);

    const ITEMS_PER_PAGE = 10;

    const isMpesaConfigured = darajaSettings?.consumerKey && darajaSettings?.paybillNumber;
    
    const paymentTransactions = useMemo(() => transactions.filter(t => t.type === 'Payment').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [transactions]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filterOption, startDate, endDate]);

    const filteredPayments = useMemo(() => {
        let dateFilteredPayments = paymentTransactions;
        if (filterOption !== 'all') {
            let startFilterDate: Date | null = null;
            let endFilterDate: Date | null = null;
            const now = new Date();
            switch(filterOption) {
                case 'today':
                    startFilterDate = new Date(now.setHours(0,0,0,0));
                    endFilterDate = new Date(now.setHours(23,59,59,999));
                    break;
                case 'this_week':
                    startFilterDate = new Date(now.setDate(now.getDate() - now.getDay()));
                    startFilterDate.setHours(0,0,0,0);
                    endFilterDate = new Date();
                    break;
                case 'this_month':
                    startFilterDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    endFilterDate = new Date();
                    break;
            }
             dateFilteredPayments = paymentTransactions.filter(p => {
                const paymentDate = new Date(p.date);
                if (startFilterDate && paymentDate < startFilterDate) return false;
                if (endFilterDate && paymentDate > endFilterDate) return false;
                return true;
            });
        }
        
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            return dateFilteredPayments.filter(p => {
                const paymentDate = new Date(p.date);
                return paymentDate >= start && paymentDate <= end;
            })
        }

        return dateFilteredPayments;
    }, [paymentTransactions, filterOption, startDate, endDate]);

    const totalPages = Math.ceil(filteredPayments.length / ITEMS_PER_PAGE);
    const paginatedPayments = useMemo(() => {
        return filteredPayments.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    }, [filteredPayments, currentPage]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilterOption(e.target.value);
        if (e.target.value !== 'custom') {
            setStartDate('');
            setEndDate('');
        }
    };

    const closeRecordModal = () => {
        setIsRecordModalOpen(false);
        setNewPayment({
            studentId: '', amount: 0, date: new Date().toISOString().split('T')[0], method: PaymentMethod.Cash, description: 'Fee Payment'
        });
    };
    
    const handleStkPush = async () => {
        if (!newPayment.studentId || !newPayment.amount || newPayment.amount <= 0) {
            addNotification("Please select a student and enter a valid amount.", 'error');
            return;
        }

        const student = students.find(s => s.id === newPayment.studentId);
        if (!student) {
            addNotification("Could not find selected student.", 'error');
            return;
        }

        setIsPaying(true);
        addNotification("Sending payment request to guardian's phone...", 'info');
        try {
            const response = await initiateSTKPush(newPayment.amount, student.guardianContact, student.admissionNumber);
            
            addNotification(response.CustomerMessage, 'info');
            // NOTE: In a real system, the transaction record is created by the backend via the M-Pesa callback URL, not here.
            // This frontend will receive the update via a WebSocket or by polling.
            // For this project, we'll optimistically assume it will be processed.
            closeRecordModal();

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            addNotification(errorMessage, 'error');
        } finally {
            setIsPaying(false);
        }
    };

    const handleManualRecordPayment = (e: React.FormEvent) => {
        e.preventDefault();
        const student = students.find(s => s.id === newPayment.studentId);
        const paymentToAdd: NewTransaction = {
            // Fix: Use TransactionType enum member instead of string literal.
            type: TransactionType.Payment,
            studentId: newPayment.studentId!,
            studentName: student?.name,
            amount: newPayment.amount!,
            date: newPayment.date!,
            description: newPayment.description || 'Fee Payment',
            method: newPayment.method,
            transactionCode: newPayment.transactionCode
        };
        addTransaction(paymentToAdd).then(() => {
            closeRecordModal();
        });
    };

    return (
        <div className="p-6 md:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h2 className="text-3xl font-bold text-slate-800">Fee Management</h2>
                <div>
                     <button 
                        onClick={() => setIsSyncInfoModalOpen(true)}
                        disabled={!isMpesaConfigured}
                        className="mr-4 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
                        title={!isMpesaConfigured ? "Please configure M-Pesa settings first" : "About M-Pesa Payment Confirmation"}
                    >
                        M-Pesa Payment Confirmation
                    </button>
                    <button onClick={() => setIsRecordModalOpen(true)} className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700">Record Payment</button>
                </div>
            </div>

            <div className="mb-4 bg-white p-4 rounded-xl shadow-lg flex items-center space-x-4">
                <label htmlFor="date-filter" className="font-medium text-slate-700">Filter by:</label>
                <select id="date-filter" value={filterOption} onChange={handleFilterChange} className="p-2 border border-slate-300 rounded-lg">
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="this_week">This Week</option>
                    <option value="this_month">This Month</option>
                    <option value="custom">Custom Range</option>
                </select>

                {filterOption === 'custom' && (
                    <>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 border border-slate-300 rounded-lg"/>
                        <span className="text-slate-500">to</span>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 border border-slate-300 rounded-lg"/>
                    </>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
                <table className="w-full text-left table-auto">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-4 py-3 font-semibold text-slate-600">Date</th>
                            <th className="px-4 py-3 font-semibold text-slate-600">Student Name</th>
                            <th className="px-4 py-3 font-semibold text-slate-600">Amount (KES)</th>
                            <th className="px-4 py-3 font-semibold text-slate-600">Method</th>
                            <th className="px-4 py-3 font-semibold text-slate-600">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedPayments.map(p => (
                            <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="px-4 py-3 text-slate-500">{p.date}</td>
                                <td className="px-4 py-3 font-semibold text-slate-800">{p.studentName || students.find(s => s.id === p.studentId)?.name || 'N/A'}</td>
                                <td className="px-4 py-3 text-slate-600">{p.amount.toLocaleString()}</td>
                                <td className="px-4 py-3 text-slate-600">{p.method}</td>
                                {/* Fix: Changed p.checkDetails?.checkNumber to p.checkNumber to match the flattened Transaction type. */}
                                <td className="px-4 py-3 text-slate-500">{p.transactionCode || p.checkNumber || 'N/A'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            <Modal isOpen={isRecordModalOpen} onClose={closeRecordModal} title="Record New Payment">
                <form onSubmit={handleManualRecordPayment} className="space-y-4">
                    <select name="studentId" value={newPayment.studentId} onChange={e => setNewPayment(p => ({...p, studentId: e.target.value}))} required className="w-full p-2 border border-slate-300 rounded-lg">
                        <option value="">Select Student</option>
                        {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.admissionNumber})</option>)}
                    </select>
                    <input type="number" name="amount" placeholder="Amount" value={newPayment.amount || ''} onChange={e => setNewPayment(p => ({...p, amount: parseFloat(e.target.value)}))} required className="w-full p-2 border border-slate-300 rounded-lg" />
                    <input type="date" name="date" value={newPayment.date} onChange={e => setNewPayment(p => ({...p, date: e.target.value}))} required className="w-full p-2 border border-slate-300 rounded-lg" />
                    <select name="method" value={newPayment.method} onChange={e => setNewPayment(p => ({...p, method: e.target.value as PaymentMethod, transactionCode: ''}))} required className="w-full p-2 border border-slate-300 rounded-lg">
                        {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    
                    {newPayment.method !== PaymentMethod.MPesa && <input type="text" name="transactionCode" placeholder="Transaction/Check Details" value={newPayment.transactionCode || ''} onChange={e => setNewPayment(p => ({...p, transactionCode: e.target.value}))} className="w-full p-2 border border-slate-300 rounded-lg" />}

                    <div className="flex justify-end">
                        {newPayment.method === PaymentMethod.MPesa ? (
                            <button type="button" onClick={handleStkPush} disabled={isPaying || !isMpesaConfigured} className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 disabled:bg-slate-400 disabled:cursor-not-allowed">
                                {isPaying ? 'Processing...' : 'Send STK Push'}
                            </button>
                        ) : (
                            <button type="submit" className="px-6 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700">Save Payment</button>
                        )}
                    </div>
                     {!isMpesaConfigured && newPayment.method === PaymentMethod.MPesa && <p className="text-xs text-red-600 text-center mt-2">M-Pesa settings are not configured. Please update them in the Settings page to enable STK push.</p>}
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
        </div>
    );
};

export default FeeManagementView;