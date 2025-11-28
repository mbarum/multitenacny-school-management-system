

import React, { useState } from 'react';
import type { Expense, NewExpense } from '../../types';
import { ExpenseCategory } from '../../types';
import Modal from '../common/Modal';
import { useData } from '../../contexts/DataContext';

const ExpensesView: React.FC = () => {
    const { expenses, addExpense } = useData();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newExpense, setNewExpense] = useState<NewExpense>({
        category: ExpenseCategory.Utilities, description: '', amount: 0, date: new Date().toISOString().split('T')[0]
    });

    const handleAddExpense = (e: React.FormEvent) => {
        e.preventDefault();
        addExpense(newExpense).then(() => {
            setIsAddModalOpen(false);
        });
    };

    return (
        <div className="p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-slate-800">Expense Tracking</h2>
                <button onClick={() => {
                    setNewExpense({ category: ExpenseCategory.Utilities, description: '', amount: 0, date: new Date().toISOString().split('T')[0] });
                    setIsAddModalOpen(true);
                }} className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700">Add New Expense</button>
            </div>
            <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
                 <table className="w-full text-left table-auto">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-4 py-3 font-semibold text-slate-600">Date</th>
                            <th className="px-4 py-3 font-semibold text-slate-600">Category</th>
                            <th className="px-4 py-3 font-semibold text-slate-600">Description</th>
                            <th className="px-4 py-3 font-semibold text-slate-600 text-right">Amount (KES)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {expenses.map(exp => (
                            <tr key={exp.id} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="px-4 py-3 text-slate-500">{exp.date}</td>
                                <td className="px-4 py-3 text-slate-600">{exp.category}</td>
                                <td className="px-4 py-3 text-slate-800">{exp.description}</td>
                                <td className="px-4 py-3 text-right font-semibold text-slate-800">{exp.amount.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Expense">
                <form onSubmit={handleAddExpense} className="space-y-4">
                    <input type="date" value={newExpense.date} onChange={e => setNewExpense(ex => ({...ex, date: e.target.value}))} required className="w-full p-2 border border-slate-300 rounded-lg"/>
                    <select value={newExpense.category} onChange={e => setNewExpense(ex => ({...ex, category: e.target.value as ExpenseCategory}))} className="w-full p-2 border border-slate-300 rounded-lg">
                         {Object.values(ExpenseCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <input type="text" placeholder="Description" value={newExpense.description} onChange={e => setNewExpense(ex => ({...ex, description: e.target.value}))} required className="w-full p-2 border border-slate-300 rounded-lg"/>
                    <input type="number" placeholder="Amount" value={newExpense.amount || ''} onChange={e => setNewExpense(ex => ({...ex, amount: parseFloat(e.target.value)}))} required className="w-full p-2 border border-slate-300 rounded-lg"/>
                    <div className="flex justify-end"><button type="submit" className="px-6 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700">Save Expense</button></div>
                </form>
            </Modal>
        </div>
    );
};

export default ExpensesView;