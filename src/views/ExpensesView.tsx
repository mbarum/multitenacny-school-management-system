
import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Expense, NewExpense } from '../types';
import { ExpenseCategory } from '../types';
import Modal from '../components/common/Modal';
import { useData } from '../contexts/DataContext';
import * as api from '../services/api';
import Skeleton from '../components/common/Skeleton';
import WebcamCaptureModal from '../components/common/WebcamCaptureModal';
import Pagination from '../components/common/Pagination';

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
        queryFn: () => api.getExpenses({
            page,
            limit: 10,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            category: selectedCategory || undefined
        }),
        placeholderData: (prev) => prev
    });

    // CRITICAL FIX: The backend returns { data: [...], last_page: x }. 
    // We must look inside the .data property.
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
        onError: (err: any) => addNotification(err.message || "Failed to add expense.", "error")
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
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 no-print">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Expenditure Log</h2>
                    <p className="text-slate-500 font-medium">Track and categorize institutional spending.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={handleExportCSV} className="px-5 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 font-black text-xs uppercase tracking-widest flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Export CSV
                    </button>
                    <button onClick={openAddModal} className="px-6 py-3 bg-primary-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-primary-500/30 hover:bg-primary-700 transition-all">
                        Record Expense
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="mb-8 bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 flex flex-col lg:flex-row items-center gap-6 no-print">
                <div className="flex items-center space-x-3 w-full lg:w-auto">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date Range</label>
                    <div className="flex items-center space-x-2">
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-3 border-2 border-slate-100 rounded-2xl outline-none font-bold text-sm bg-slate-50"/>
                        <span className="text-slate-300">to</span>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-3 border-2 border-slate-100 rounded-2xl outline-none font-bold text-sm bg-slate-50"/>
                    </div>
                </div>
                 <div className="flex-grow w-full">
                    <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="w-full p-3 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary-500 font-bold text-slate-700 bg-slate-50 text-sm">
                        <option value="">All Expense Categories</option>
                        {Object.values(ExpenseCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 printable-area">
                 <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-900 text-white">
                            <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px]">Date</th>
                            <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px]">Category</th>
                            <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px]">Description</th>
                            <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px] text-right">Amount</th>
                            <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px] no-print">Receipt</th>
                            <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px] text-center no-print">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                             Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i}><td colSpan={6} className="px-8 py-5"><Skeleton className="h-6 w-full"/></td></tr>
                            ))
                        ) : expenses.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-20 text-slate-400 font-black uppercase tracking-widest italic">No expenses matching your criteria.</td></tr>
                        ) : (
                            expenses.map((exp: any) => (
                                <tr key={exp.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="font-bold text-slate-800">{new Date(exp.date).toLocaleDateString()}</div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                            {exp.category}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-slate-600 font-medium">{exp.description}</td>
                                    <td className="px-8 py-5 text-right font-black text-lg text-slate-900">{formatCurrency(exp.amount)}</td>
                                    <td className="px-8 py-5 no-print">
                                        {exp.attachmentUrl && (
                                            <a href={exp.attachmentUrl} target="_blank" rel="noreferrer" className="inline-flex p-1 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors shadow-sm">
                                                {isPdf(exp.attachmentUrl) ? (
                                                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                                ) : (
                                                    <img src={exp.attachmentUrl} alt="Receipt" className="h-6 w-6 object-cover rounded-md" />
                                                )}
                                            </a>
                                        )}
                                    </td>
                                    <td className="px-8 py-5 space-x-3 no-print text-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openEditModal(exp)} className="text-blue-600 font-black text-[10px] uppercase hover:underline">Revise</button>
                                        <button onClick={() => handleDelete(exp.id)} className="text-red-600 font-black text-[10px] uppercase hover:underline">Remove</button>
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

             <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingExpense ? "Modify Expenditure" : "New Expenditure Entry"} size="lg">
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</label>
                            <select value={formData.category} onChange={e => setFormData(ex => ({...ex, category: e.target.value as ExpenseCategory}))} className="w-full p-3.5 border border-slate-200 rounded-xl bg-slate-50 font-bold focus:ring-2 focus:ring-primary-500 outline-none">
                                {Object.values(ExpenseCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date of Purchase</label>
                            <input type="date" value={formData.date} onChange={e => setFormData(ex => ({...ex, date: e.target.value}))} required className="w-full p-3.5 border border-slate-200 rounded-xl bg-slate-50 font-bold focus:ring-2 focus:ring-primary-500 outline-none"/>
                        </div>
                    </div>
                    
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</label>
                        <input type="text" placeholder="What was purchased?" value={formData.description} onChange={e => setFormData(ex => ({...ex, description: e.target.value}))} required className="w-full p-3.5 border border-slate-200 rounded-xl bg-slate-50 font-bold focus:ring-2 focus:ring-primary-500 outline-none"/>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount Disbursed (KES)</label>
                        <input type="number" step="0.01" placeholder="0.00" value={formData.amount || ''} onChange={e => setFormData(ex => ({...ex, amount: parseFloat(e.target.value)}))} required className="w-full p-3.5 border border-slate-200 rounded-xl bg-slate-50 font-bold focus:ring-2 focus:ring-primary-500 outline-none text-lg"/>
                    </div>
                    
                    <div className="border-t border-slate-100 pt-6">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Supporting Evidence (Receipt/Invoice)</label>
                        <div className="flex items-center gap-4">
                             {formData.attachmentUrl && (
                                <div className="relative h-20 w-20 rounded-2xl border-4 border-slate-100 overflow-hidden shadow-sm">
                                    {isPdf(formData.attachmentUrl) ? (
                                         <div className="h-full w-full flex items-center justify-center bg-red-50 text-red-500 font-black text-[10px]">PDF</div>
                                    ) : (
                                        <img src={formData.attachmentUrl} alt="Preview" className="h-full w-full object-cover" />
                                    )}
                                </div>
                             )}
                            <input type="file" accept="image/*,application/pdf" ref={fileInputRef} onChange={handleFileChange} className="hidden"/>
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="px-5 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">Upload File</button>
                            <span className="text-slate-300 font-black text-xs">OR</span>
                            <button type="button" onClick={() => setIsCaptureModalOpen(true)} className="px-5 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">Capture Receipt</button>
                        </div>
                    </div>

                    <div className="flex justify-end pt-6 border-t gap-4">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-4 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-600 transition-colors">Discard</button>
                        <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="px-12 py-4 bg-primary-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl shadow-primary-500/30 hover:-translate-y-1 transition-all active:scale-95">
                            {editingExpense ? 'Save Changes' : 'Commit to Ledger'}
                        </button>
                    </div>
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
