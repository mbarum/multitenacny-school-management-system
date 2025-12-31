
import React, { useState, useMemo, useEffect } from 'react';
import type { Student, Transaction, SchoolInfo, NewTransaction } from '../../types';
import { TransactionType } from '../../types';
import Modal from './Modal';
import StatementModal from './StatementModal';
import { useData } from '../../contexts/DataContext';
import * as api from '../../services/api';
import Skeleton from './Skeleton';

interface StudentBillingModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: Student | null;
}

const StudentBillingModal: React.FC<StudentBillingModalProps> = ({ isOpen, onClose, student }) => {
    const { addTransaction, schoolInfo } = useData();

    const [showAdjustmentForm, setShowAdjustmentForm] = useState(false);
    const [adjustmentType, setAdjustmentType] = useState<TransactionType.ManualDebit | TransactionType.ManualCredit>(TransactionType.ManualDebit);
    const [adjustmentAmount, setAdjustmentAmount] = useState(0);
    const [adjustmentDescription, setAdjustmentDescription] = useState('');
    const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
    
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && student) {
            setLoading(true);
            // Fix: Replaced api.getTransactions parameter with updated type that includes studentId.
            api.getTransactions({ studentId: student.id, limit: 1000 })
                .then(res => setTransactions(res.data))
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [isOpen, student]);

    const handleSaveAdjustment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!student || adjustmentAmount <= 0 || !adjustmentDescription.trim()) {
            alert('Please fill all fields for the adjustment.');
            return;
        }

        const newTransaction: NewTransaction = {
            studentId: student.id,
            type: adjustmentType,
            date: new Date().toISOString().split('T')[0],
            description: adjustmentDescription,
            amount: adjustmentAmount,
        };

        addTransaction(newTransaction).then((t) => {
             setTransactions(prev => [t, ...prev]);
             setShowAdjustmentForm(false);
             setAdjustmentAmount(0);
             setAdjustmentDescription('');
        });
    };

    const renderLedger = () => {
        // Sort by date ascending for running balance
        const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        let runningBalance = 0;
        return (
            <table className="w-full text-left table-auto text-sm">
                <thead className="bg-slate-50 sticky top-0">
                    <tr>
                        <th className="p-2 font-semibold">Date</th>
                        <th className="p-2 font-semibold">Description</th>
                        <th className="p-2 font-semibold text-right">Debit</th>
                        <th className="p-2 font-semibold text-right">Credit</th>
                        <th className="p-2 font-semibold text-right">Balance</th>
                    </tr>
                </thead>
                <tbody>
                    {sorted.map(t => {
                        const isDebit = t.type === 'Invoice' || t.type === 'ManualDebit';
                        if (isDebit) {
                            runningBalance += t.amount;
                        } else {
                            runningBalance -= t.amount;
                        }

                        return (
                            <tr key={t.id} className="border-b">
                                <td className="p-2">{new Date(t.date).toLocaleDateString()}</td>
                                <td className="p-2">{t.description}</td>
                                <td className="p-2 text-right">{isDebit ? t.amount.toLocaleString() : '-'}</td>
                                <td className="p-2 text-right text-green-600">{!isDebit ? t.amount.toLocaleString() : '-'}</td>
                                <td className="p-2 text-right font-semibold">{runningBalance.toLocaleString()}</td>
                            </tr>
                        );
                    })}
                </tbody>
                 <tfoot className="bg-slate-100 font-bold sticky bottom-0">
                    <tr>
                        <td colSpan={4} className="p-2 text-right">Current Balance:</td>
                        <td className="p-2 text-right text-lg">{runningBalance.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}</td>
                    </tr>
                </tfoot>
            </table>
        );
    };

    if (!student || !schoolInfo) return null;

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title={`Billing for ${student.name}`} size="3xl">
                <div className="flex flex-col h-[70vh]">
                    <div className="flex-shrink-0 flex items-center space-x-2 mb-4 p-2 bg-slate-100 rounded-md">
                        <button onClick={() => setShowAdjustmentForm(!showAdjustmentForm)} className="px-3 py-1.5 bg-yellow-500 text-white text-sm font-semibold rounded-md hover:bg-yellow-600">Adjust Balance</button>
                        <button onClick={() => setIsStatementModalOpen(true)} className="px-3 py-1.5 bg-blue-500 text-white text-sm font-semibold rounded-md hover:bg-blue-600">View Statement</button>
                    </div>

                    {showAdjustmentForm && (
                        <form onSubmit={handleSaveAdjustment} className="p-4 border rounded-lg mb-4 bg-slate-50 space-y-3">
                            <h4 className="font-semibold text-slate-700">New Manual Transaction</h4>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                <select value={adjustmentType} onChange={e => setAdjustmentType(e.target.value as any)} className="p-2 border rounded-md">
                                    <option value={TransactionType.ManualDebit}>Charge (Debit)</option>
                                    <option value={TransactionType.ManualCredit}>Credit / Waiver</option>
                                </select>
                                <input type="text" placeholder="Description (e.g., Library Fine)" value={adjustmentDescription} onChange={e => setAdjustmentDescription(e.target.value)} className="p-2 border rounded-md md:col-span-2" required />
                                <input type="number" placeholder="Amount" value={adjustmentAmount || ''} onChange={e => setAdjustmentAmount(parseFloat(e.target.value))} className="p-2 border rounded-md" required />
                            </div>
                            <div className="flex justify-end space-x-2">
                                <button type="button" onClick={() => setShowAdjustmentForm(false)} className="px-3 py-1.5 bg-slate-200 text-slate-700 text-sm font-semibold rounded-md hover:bg-slate-300">Cancel</button>
                                <button type="submit" className="px-3 py-1.5 bg-primary-600 text-white text-sm font-semibold rounded-md hover:bg-primary-700">Save Adjustment</button>
                            </div>
                        </form>
                    )}

                    <div className="flex-grow overflow-y-auto border rounded-lg">
                        {loading ? <div className="p-4 space-y-2"><Skeleton className="h-8 w-full"/><Skeleton className="h-8 w-full"/><Skeleton className="h-8 w-full"/></div> : 
                        transactions.length > 0 ? renderLedger() : <p className="text-center p-8 text-slate-500">No transactions found for this student.</p>}
                    </div>
                </div>
            </Modal>
            <StatementModal 
                isOpen={isStatementModalOpen}
                onClose={() => setIsStatementModalOpen(false)}
                student={student}
                transactions={transactions}
                schoolInfo={schoolInfo}
            />
        </>
    );
};

export default StudentBillingModal;
