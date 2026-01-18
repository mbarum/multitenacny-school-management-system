
import React, { useState, useMemo, useEffect } from 'react';
import type { Student, Transaction, NewTransaction } from '../../types';
import { TransactionType } from '../../types';
import Modal from './Modal';
import StatementModal from './StatementModal';
import { useData } from '../../contexts/DataContext';
import * as api from '../../services/api';
import Skeleton from './Skeleton';

const StudentBillingModal: React.FC<{ isOpen: boolean; onClose: () => void; student: Student | null; }> = ({ isOpen, onClose, student }) => {
    const { addTransaction, schoolInfo, formatCurrency } = useData();
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
            api.getTransactions({ studentId: student.id, limit: 1000 })
                .then(res => setTransactions(res.data))
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [isOpen, student]);

    const handleSaveAdjustment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!student || adjustmentAmount <= 0) return;

        const newTransaction: NewTransaction = {
            studentId: student.id,
            type: adjustmentType,
            date: new Date().toISOString().split('T')[0],
            description: adjustmentDescription || 'Institutional Adjustment',
            amount: adjustmentAmount,
        };

        addTransaction(newTransaction).then((t) => {
             setTransactions(prev => [t, ...prev]);
             setShowAdjustmentForm(false);
             setAdjustmentAmount(0);
             setAdjustmentDescription('');
        });
    };

    const ledgerData = useMemo(() => {
        const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        let running = 0;
        return sorted.map(t => {
            const isDebit = t.type === TransactionType.Invoice || t.type === TransactionType.ManualDebit;
            running += isDebit ? t.amount : -t.amount;
            return { ...t, isDebit, runningBalance: running };
        }).reverse(); // Most recent at top
    }, [transactions]);

    if (!student || !schoolInfo) return null;

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title={`Institutional Ledger: ${student.name}`} size="3xl">
                <div className="flex flex-col h-[75vh]">
                    <div className="flex justify-between items-center mb-6 px-2">
                        <div className="flex gap-2">
                            <button onClick={() => setShowAdjustmentForm(!showAdjustmentForm)} className="px-5 py-2 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-black transition-all">Manual Posting</button>
                            <button onClick={() => setIsStatementModalOpen(true)} className="px-5 py-2 bg-white text-slate-700 border-2 border-slate-100 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all">Generate Statement</button>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Net Payable</p>
                            <p className={`text-2xl font-black ${(ledgerData[0]?.runningBalance || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(ledgerData[0]?.runningBalance || 0)}</p>
                        </div>
                    </div>

                    {showAdjustmentForm && (
                        <div className="mb-6 p-6 bg-slate-50 rounded-3xl border-2 border-slate-100 animate-fade-in-up">
                            <form onSubmit={handleSaveAdjustment} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase">Entry Class</label>
                                    <select value={adjustmentType} onChange={e => setAdjustmentType(e.target.value as any)} className="w-full p-3 border-2 border-white rounded-xl font-bold bg-white outline-none">
                                        <option value={TransactionType.ManualDebit}>Charge (Debit)</option>
                                        <option value={TransactionType.ManualCredit}>Credit (Waiver)</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase">Amount</label>
                                    <input type="number" value={adjustmentAmount || ''} onChange={e => setAdjustmentAmount(parseFloat(e.target.value))} className="w-full p-3 border-2 border-white rounded-xl font-bold bg-white outline-none" required />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase">Description</label>
                                    <div className="flex gap-2">
                                        <input type="text" value={adjustmentDescription} onChange={e => setAdjustmentDescription(e.target.value)} className="flex-1 p-3 border-2 border-white rounded-xl font-bold bg-white outline-none" required />
                                        <button type="submit" className="p-3 bg-primary-600 text-white rounded-xl shadow-lg hover:bg-primary-700 transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg></button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="flex-grow overflow-hidden border-2 border-slate-100 rounded-[2rem] bg-white shadow-inner">
                        <div className="h-full overflow-y-auto custom-scrollbar">
                            {loading ? <div className="p-10"><Skeleton className="h-40 w-full rounded-2xl"/></div> : (
                                <table className="w-full text-left">
                                    <thead className="bg-slate-900 text-white sticky top-0 z-10">
                                        <tr>
                                            <th className="px-6 py-4 font-black uppercase tracking-widest text-[9px]">Date</th>
                                            <th className="px-6 py-4 font-black uppercase tracking-widest text-[9px]">Description</th>
                                            <th className="px-6 py-4 font-black uppercase tracking-widest text-[9px] text-right">Debit</th>
                                            <th className="px-6 py-4 font-black uppercase tracking-widest text-[9px] text-right">Credit</th>
                                            <th className="px-6 py-4 font-black uppercase tracking-widest text-[9px] text-right bg-slate-800">Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {ledgerData.map(t => (
                                            <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 font-bold text-slate-400 text-[10px]">{new Date(t.date).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 font-black text-slate-700 uppercase text-xs">{t.description}</td>
                                                <td className="px-6 py-4 text-right font-black text-slate-400">{t.isDebit ? t.amount.toLocaleString() : '-'}</td>
                                                <td className="px-6 py-4 text-right font-black text-primary-600">{!t.isDebit ? t.amount.toLocaleString() : '-'}</td>
                                                <td className="px-6 py-4 text-right font-black text-slate-900 bg-slate-50/50">{t.runningBalance.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
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
