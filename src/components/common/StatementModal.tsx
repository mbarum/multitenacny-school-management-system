
import React, { useState, useMemo } from 'react';
import type { Student, Transaction, SchoolInfo } from '../../types';
import Modal from './Modal';
import { useData } from '../../contexts/DataContext';

interface StatementModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: Student | null;
    transactions: Transaction[];
    schoolInfo: SchoolInfo;
}

const StatementModal: React.FC<StatementModalProps> = ({ isOpen, onClose, student, transactions, schoolInfo }) => {
    const { formatCurrency } = useData();
    const today = new Date().toISOString().split('T')[0];
    const [startDate, setStartDate] = useState('2024-01-01');
    const [endDate, setEndDate] = useState(today);

    const { statementTransactions, openingBalance, closingBalance, totalDebits, totalCredits } = useMemo(() => {
        if (!student) return { statementTransactions: [], openingBalance: 0, closingBalance: 0, totalDebits: 0, totalCredits: 0 };
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        const priorTransactions = transactions.filter(t => new Date(t.date) < start);
        let currentOpeningBalance = 0;
        priorTransactions.forEach(t => {
            if (t.type === 'Invoice' || t.type === 'ManualDebit') {
                currentOpeningBalance += t.amount;
            } else {
                currentOpeningBalance -= t.amount;
            }
        });

        const currentStatementTransactions = transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate >= start && tDate <= end;
        });

        let currentTotalDebits = 0;
        let currentTotalCredits = 0;
        currentStatementTransactions.forEach(t => {
             if (t.type === 'Invoice' || t.type === 'ManualDebit') {
                currentTotalDebits += t.amount;
            } else {
                currentTotalCredits += t.amount;
            }
        });

        const currentClosingBalance = currentOpeningBalance + currentTotalDebits - currentTotalCredits;

        return {
            statementTransactions: currentStatementTransactions,
            openingBalance: currentOpeningBalance,
            closingBalance: currentClosingBalance,
            totalDebits: currentTotalDebits,
            totalCredits: currentTotalCredits
        };

    }, [student, transactions, startDate, endDate]);

    if (!student) return null;

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Student Statement" 
            size="3xl"
            footer={
                <button onClick={() => window.print()} className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700">
                    Print Statement
                </button>
            }
        >
            <div className="printable-area p-2">
                <div className="p-6 border border-slate-200 rounded-lg">
                    {/* Header */}
                    <div className="flex justify-between items-start pb-4 border-b">
                        <div className="flex items-center space-x-4">
                            {schoolInfo.logoUrl && <img src={schoolInfo.logoUrl} alt="logo" className="h-16 w-16 rounded-full" />}
                            <div>
                                <h2 className="text-2xl font-bold text-primary-800">{schoolInfo.name}</h2>
                                <p className="text-slate-600">{schoolInfo.address}</p>
                                <p className="text-slate-600">{schoolInfo.phone} | {schoolInfo.email}</p>
                            </div>
                        </div>
                        <h3 className="text-2xl font-semibold text-slate-700">Statement of Account</h3>
                    </div>

                    {/* Student Info & Date Range */}
                    <div className="grid grid-cols-2 gap-4 my-4">
                        <div className="bg-slate-50 p-3 rounded-md">
                            <h4 className="font-semibold text-slate-800">Billed To:</h4>
                            <p className="font-bold">{student.name}</p>
                            <p>{student.admissionNumber} | {student.class}</p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-md no-print">
                            <h4 className="font-semibold text-slate-800">Select Date Range:</h4>
                             <div className="flex items-center space-x-2 text-sm">
                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-1 border rounded-md"/>
                                <span>to</span>
                                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-1 border rounded-md"/>
                            </div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-md hidden print:block">
                             <h4 className="font-semibold text-slate-800">Statement Period:</h4>
                             <p>{startDate} to {endDate}</p>
                        </div>
                    </div>

                    {/* Transactions Table */}
                    <table className="w-full text-left table-auto text-sm">
                        <thead className="bg-slate-100">
                            <tr>
                                <th className="p-2 font-semibold">Date</th>
                                <th className="p-2 font-semibold">Description</th>
                                <th className="p-2 font-semibold text-right">Charges ({schoolInfo.currency || 'KES'})</th>
                                <th className="p-2 font-semibold text-right">Payments ({schoolInfo.currency || 'KES'})</th>
                                <th className="p-2 font-semibold text-right">Balance ({schoolInfo.currency || 'KES'})</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b font-medium">
                                <td colSpan={4} className="p-2">Opening Balance</td>
                                <td className="p-2 text-right">{formatCurrency(openingBalance)}</td>
                            </tr>
                            {statementTransactions.map((t, index) => {
                                const isDebit = t.type === 'Invoice' || t.type === 'ManualDebit';
                                const balanceAfter = openingBalance + statementTransactions.slice(0, index + 1).reduce((acc, curr) => {
                                    return acc + ((curr.type === 'Invoice' || curr.type === 'ManualDebit') ? curr.amount : -curr.amount);
                                }, 0);

                                return(
                                <tr key={t.id} className="border-b">
                                    <td className="p-2">{t.date}</td>
                                    <td className="p-2">{t.description}</td>
                                    <td className="p-2 text-right">{isDebit ? formatCurrency(t.amount) : '-'}</td>
                                    <td className="p-2 text-right text-green-600">{!isDebit ? formatCurrency(t.amount) : '-'}</td>
                                    <td className="p-2 text-right font-medium">{formatCurrency(balanceAfter)}</td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                    
                    {/* Summary Footer */}
                    <div className="mt-4 pt-4 border-t-2 grid grid-cols-5 text-sm font-semibold">
                        <div className="col-span-2"></div>
                        <div className="text-right p-2 bg-slate-100 rounded-l-md">{formatCurrency(totalDebits)}</div>
                        <div className="text-right p-2 bg-slate-100">{formatCurrency(totalCredits)}</div>
                        <div className="text-right p-2 bg-slate-200 rounded-r-md text-base">{formatCurrency(closingBalance)}</div>
                    </div>
                     <div className="mt-1 grid grid-cols-5 text-sm font-bold">
                        <div className="col-span-2"></div>
                        <div className="text-right px-2">Total Charges</div>
                        <div className="text-right px-2">Total Payments</div>
                        <div className="text-right px-2">Closing Balance</div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default StatementModal;
