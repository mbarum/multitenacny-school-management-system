
import React, { useState, useEffect } from 'react';
import type { Expense, NewExpense } from '../../types';
import { ExpenseCategory } from '../../types';
import Modal from '../common/Modal';
import { useData } from '../../contexts/DataContext';
import * as api from '../../services/api';
import Skeleton from '../common/Skeleton';

const ExpensesView: React.FC = () => {
    const { addNotification, formatCurrency } = useData();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    
    const initialExpenseState: NewExpense = {
        category: ExpenseCategory.Utilities, description: '', amount: 0, date: new Date().toISOString().split('T')[0]
    };
    const [formData, setFormData] = useState<NewExpense>(initialExpenseState);

    const fetchExpenses = async () => {
        setLoading(true);
        try {
            const data = await api.getExpenses();
            setExpenses(data);
        } catch (error) {
            console.error(error);
            addNotification("Failed to load expenses.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    const openAddModal = () => {
        setEditingExpense(null);
        setFormData(initialExpenseState);
        setIsModalOpen(true);
    };

    const openEditModal = (expense: Expense) => {
        setEditingExpense(expense);
        setFormData({
            category: expense.category,
            description: expense.description,
            amount: expense.amount,
            date: expense.date
        });
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingExpense) {
                await api.updateExpense(editingExpense.id, formData);
                addNotification("Expense updated successfully.", "success");
            } else {
                await api.createExpense(formData);
                addNotification("Expense added successfully.", "success");
            }
            setIsModalOpen(false);
            fetchExpenses();
        } catch (error) {
            addNotification("Failed to save expense.", "error");
        }
    };

    const handleDelete = async (id: string) => {
        if(window.confirm("Are you sure you want to delete this expense record?")) {
            try {
                await api.deleteExpense(id);
                addNotification("Expense deleted successfully.", "success");
                setExpenses(prev => prev.filter(e => e.id !== id));
            } catch (error) {
                addNotification("Failed to delete expense.", "error");
            }
        }
    }

    return (
        <div className="p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-slate-800">Expense Tracking</h2>
                <button onClick={openAddModal} className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700">Add New Expense</button>
            </div>
            <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
                 <table className="w-full text-left table-auto">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-4 py-3 font-semibold text-slate-600">Date</th>
                            <th className="px-4 py-3 font-semibold text-slate-600">Category</th>
                            <th className="px-4 py-3 font-semibold text-slate-600">Description</th>
                            <th className="px-4 py-3 font-semibold text-slate-600 text-right">Amount</th>
                            <th className="px-4 py-3 font-semibold text-slate-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                             Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="border-b border-slate-100">
                                    <td className="px-4 py-4"><Skeleton className="h-4 w-24"/></td>
                                    <td className="px-4 py-4"><Skeleton className="h-4 w-32"/></td>
                                    <td className="px-4 py-4"><Skeleton className="h-4 w-48"/></td>
                                    <td className="px-4 py-4"><Skeleton className="h-4 w-24"/></td>
                                    <td className="px-4 py-4"><Skeleton className="h-4 w-20"/></td>
                                </tr>
                            ))
                        ) : expenses.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-8 text-slate-500">No expenses recorded.</td></tr>
                        ) : (
                            expenses.map(exp => (
                                <tr key={exp.id} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="px-4 py-3 text-slate-500">{new Date(exp.date).toLocaleDateString()}</td>
                                    <td className="px-4 py-3 text-slate-600">{exp.category}</td>
                                    <td className="px-4 py-3 text-slate-800">{exp.description}</td>
                                    <td className="px-4 py-3 text-right font-semibold text-slate-800">{formatCurrency(exp.amount)}</td>
                                    <td className="px-4 py-3 space-x-2">
                                        <button onClick={() => openEditModal(exp)} className="text-blue-600 hover:underline">Edit</button>
                                        <button onClick={() => handleDelete(exp.id)} className="text-red-600 hover:underline">Delete</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
             <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingExpense ? "Edit Expense" : "Add New Expense"}>
                <form onSubmit={handleSave} className="space-y-4">
                    <input type="date" value={formData.date} onChange={e => setFormData(ex => ({...ex, date: e.target.value}))} required className="w-full p-2 border border-slate-300 rounded-lg"/>
                    <select value={formData.category} onChange={e => setFormData(ex => ({...ex, category: e.target.value as ExpenseCategory}))} className="w-full p-2 border border-slate-300 rounded-lg">
                         {Object.values(ExpenseCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <input type="text" placeholder="Description" value={formData.description} onChange={e => setFormData(ex => ({...ex, description: e.target.value}))} required className="w-full p-2 border border-slate-300 rounded-lg"/>
                    <input type="number" placeholder="Amount" value={formData.amount || ''} onChange={e => setFormData(ex => ({...ex, amount: parseFloat(e.target.value)}))} required className="w-full p-2 border border-slate-300 rounded-lg"/>
                    <div className="flex justify-end"><button type="submit" className="px-6 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700">Save Expense</button></div>
                </form>
            </Modal>
        </div>
    );
};

export default ExpensesView;