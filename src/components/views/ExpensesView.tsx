

import React, { useState, useEffect, useRef } from 'react';
import type { Expense, NewExpense } from '../../types';
import { ExpenseCategory } from '../../types';
import Modal from '../common/Modal';
import { useData } from '../../contexts/DataContext';
import * as api from '../../services/api';
import Skeleton from '../common/Skeleton';
import WebcamCaptureModal from '../common/WebcamCaptureModal';

const ExpensesView: React.FC = () => {
    const { addNotification, formatCurrency } = useData();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const initialExpenseState: NewExpense = {
        category: ExpenseCategory.Utilities, description: '', amount: 0, date: new Date().toISOString().split('T')[0], attachmentUrl: ''
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
            date: expense.date,
            attachmentUrl: expense.attachmentUrl
        });
        setIsModalOpen(true);
    };

    const handleFileUpload = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await api.uploadExpenseReceipt(formData);
            setFormData(prev => ({ ...prev, attachmentUrl: res.url }));
            addNotification("Receipt uploaded successfully.", "success");
        } catch (e) {
            addNotification("Failed to upload receipt.", "error");
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
        }
    };

    const handlePhotoCapture = (imageDataUrl: string) => {
        // Convert base64 to blob/file
        fetch(imageDataUrl)
            .then(res => res.blob())
            .then(blob => {
                const file = new File([blob], `receipt_${Date.now()}.jpg`, { type: "image/jpeg" });
                handleFileUpload(file);
            });
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
                            <th className="px-4 py-3 font-semibold text-slate-600 text-right">Amount (KES)</th>
                            <th className="px-4 py-3 font-semibold text-slate-600">Receipt</th>
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
                                    <td className="px-4 py-4"><Skeleton className="h-4 w-10"/></td>
                                    <td className="px-4 py-4"><Skeleton className="h-4 w-20"/></td>
                                </tr>
                            ))
                        ) : expenses.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-8 text-slate-500">No expenses recorded.</td></tr>
                        ) : (
                            expenses.map(exp => (
                                <tr key={exp.id} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="px-4 py-3 text-slate-500">{new Date(exp.date).toLocaleDateString()}</td>
                                    <td className="px-4 py-3 text-slate-600">{exp.category}</td>
                                    <td className="px-4 py-3 text-slate-800">{exp.description}</td>
                                    <td className="px-4 py-3 text-right font-semibold text-slate-800">{formatCurrency(exp.amount)}</td>
                                    <td className="px-4 py-3">
                                        {exp.attachmentUrl && (
                                            <a href={exp.attachmentUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs">
                                                View
                                            </a>
                                        )}
                                    </td>
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
                    
                    <div className="border-t pt-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Receipt / Invoice</label>
                        <div className="flex items-center space-x-3">
                             {formData.attachmentUrl && (
                                <img src={formData.attachmentUrl} alt="Receipt Preview" className="h-16 w-16 object-cover rounded border" />
                             )}
                            <input 
                                type="file" 
                                accept="image/*,application/pdf"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 bg-slate-200 text-slate-700 text-sm font-semibold rounded hover:bg-slate-300">Upload File</button>
                            <span className="text-slate-400">or</span>
                            <button type="button" onClick={() => setIsCaptureModalOpen(true)} className="px-3 py-1.5 bg-slate-200 text-slate-700 text-sm font-semibold rounded hover:bg-slate-300">Capture</button>
                        </div>
                    </div>

                    <div className="flex justify-end mt-4"><button type="submit" className="px-6 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700">Save Expense</button></div>
                </form>
            </Modal>
            <WebcamCaptureModal 
                isOpen={isCaptureModalOpen} 
                onClose={() => setIsCaptureModalOpen(false)} 
                onCapture={handlePhotoCapture} 
            />
        </div>
    );
};

export default ExpensesView;