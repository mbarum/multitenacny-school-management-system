
import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Expense, NewExpense } from '../../types';
import { ExpenseCategory } from '../../types';
import Modal from '../common/Modal';
import { useData } from '../../contexts/DataContext';
import * as api from '../../services/api';
import Skeleton from '../common/Skeleton';
import WebcamCaptureModal from '../common/WebcamCaptureModal';
import Pagination from '../common/Pagination';

const ExpensesView: React.FC = () => {
    const { addNotification, formatCurrency } = useData();
    const queryClient = useQueryClient();
    
    // UI State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Filters
    const [page, setPage] = useState(1);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    
    const initialExpenseState: NewExpense = {
        category: ExpenseCategory.Utilities, description: '', amount: 0, date: new Date().toISOString().split('T')[0], attachmentUrl: ''
    };
    const [formData, setFormData] = useState<NewExpense>(initialExpenseState);

    // --- Queries ---
    const { data: expensesData, isLoading } = useQuery({
        queryKey: ['expenses', page, startDate, endDate, selectedCategory],
        // Fix: getExpenses is now exported in src/services/api.ts. Added (res: any) for safety.
        queryFn: () => api.getExpenses({
            page,
            limit: 10,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            category: selectedCategory || undefined
        }).then((res: any) => res),
        placeholderData: (prev) => prev
    });

    const expenses = expensesData?.data || [];
    const totalPages = expensesData?.last_page || 1;

    // --- Mutations ---
    const createMutation = useMutation({
        mutationFn: api.createExpense,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
            addNotification("Expense added successfully.", "success");
            setIsModalOpen(false);
        },
        onError: () => addNotification("Failed to add expense.", "error")
    });

    const updateMutation = useMutation({
        mutationFn: (data: { id: string, payload: Partial<Expense> }) => api.updateExpense(data.id, data.payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            addNotification("Expense updated.", "success");
            setIsModalOpen(false);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: api.deleteExpense,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            addNotification("Expense deleted.", "success");
        }
    });

    // --- Handlers ---

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
        fetch(imageDataUrl)
            .then(res => res.blob())
            .then(blob => {
                const file = new File([blob], `receipt_${Date.now()}.jpg`, { type: "image/jpeg" });
                handleFileUpload(file);
            });
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingExpense) {
            updateMutation.mutate({ id: editingExpense.id, payload: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleDelete = (id: string) => {
        if(window.confirm("Are you sure you want to delete this expense record?")) {
            deleteMutation.mutate(id);
        }
    }
    
    const handleExportCSV = async () => {
        try {
             const blob = await api.exportExpenses({
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                category: selectedCategory || undefined
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `expenses_export_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            addNotification('Expenses exported to CSV successfully.', 'success');
        } catch (error) {
             addNotification('Failed to export expenses.', 'error');
        }
    }
    
    const handlePrint = () => {
        window.print();
    }
    
    const isPdf = (url?: string) => url && url.toLowerCase().endsWith('.pdf');

    return (
        <div className="p-6 md:p-8">
            <style>
                {`
                @media print {
                    body * { visibility: hidden; }
                    .printable-area, .printable-area * { visibility: visible; }
                    .printable-area { position: absolute; left: 0; top: 0; width: 100%; }
                    .no-print { display: none !important; }
                }
                `}
            </style>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 no-print">
                <h2 className="text-3xl font-bold text-slate-800">Expense Tracking</h2>
                <div className="flex gap-2">
                    <button onClick={handlePrint} className="px-4 py-2 bg-slate-500 text-white font-semibold rounded-lg shadow-md hover:bg-slate-600">Print / PDF</button>
                    <button onClick={handleExportCSV} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700">Export CSV</button>
                    <button onClick={openAddModal} className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700">Add New Expense</button>
                </div>
            </div>

            {/* Filters */}
            <div className="mb-4 bg-white p-4 rounded-xl shadow-lg flex flex-col sm:flex-row items-center gap-4 no-print">
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 border border-slate-300 rounded-lg w-full" placeholder="Start Date"/>
                    <span className="text-slate-500">to</span>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 border border-slate-300 rounded-lg w-full" placeholder="End Date"/>
                </div>
                 <div className="flex-grow">
                    <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg">
                        <option value="">All Categories</option>
                        {Object.values(ExpenseCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-x-auto printable-area">
                 {/* Print Header */}
                 <div className="hidden print:block text-center mb-4">
                     <h3 className="text-2xl font-bold">Expenses Report</h3>
                     <p>Generated on {new Date().toLocaleDateString()}</p>
                     {(startDate || endDate) && <p>Period: {startDate || 'Start'} to {endDate || 'End'}</p>}
                 </div>

                 <table className="w-full text-left table-auto">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-4 py-3 font-semibold text-slate-600">Date</th>
                            <th className="px-4 py-3 font-semibold text-slate-600">Category</th>
                            <th className="px-4 py-3 font-semibold text-slate-600">Description</th>
                            <th className="px-4 py-3 font-semibold text-slate-600 text-right">Amount</th>
                            <th className="px-4 py-3 font-semibold text-slate-600 no-print">Receipt</th>
                            <th className="px-4 py-3 font-semibold text-slate-600 no-print">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
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
                            expenses.map((exp: any) => (
                                <tr key={exp.id} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="px-4 py-3 text-slate-500">{new Date(exp.date).toLocaleDateString()}</td>
                                    <td className="px-4 py-3 text-slate-600">{exp.category}</td>
                                    <td className="px-4 py-3 text-slate-800">{exp.description}</td>
                                    <td className="px-4 py-3 text-right font-semibold text-slate-800">{formatCurrency(exp.amount)}</td>
                                    <td className="px-4 py-3 no-print">
                                        {exp.attachmentUrl && (
                                            <a href={exp.attachmentUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs flex items-center">
                                                {isPdf(exp.attachmentUrl) ? (
                                                    <>
                                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                                        PDF
                                                    </>
                                                ) : (
                                                    <img src={exp.attachmentUrl} alt="Receipt" className="h-8 w-8 object-cover rounded border hover:scale-150 transition-transform" />
                                                )}
                                            </a>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 space-x-2 no-print">
                                        <button onClick={() => openEditModal(exp)} className="text-blue-600 hover:underline">Edit</button>
                                        <button onClick={() => handleDelete(exp.id)} className="text-red-600 hover:underline">Delete</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
             <div className="no-print">
                 <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
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
                                isPdf(formData.attachmentUrl) ? (
                                     <div className="h-16 w-16 flex items-center justify-center bg-slate-100 rounded border text-slate-500 text-xs">PDF</div>
                                ) : (
                                    <img src={formData.attachmentUrl} alt="Receipt Preview" className="h-16 w-16 object-cover rounded border" />
                                )
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
