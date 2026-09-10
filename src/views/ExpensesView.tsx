import React, { useState, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    Wallet, 
    DollarSign, 
    TrendingDown, 
    Receipt, 
    FileText, 
    Download, 
    Printer, 
    Search, 
    Filter, 
    Plus, 
    Trash2, 
    Edit2, 
    Eye, 
    Upload, 
    Camera, 
    LayoutGrid, 
    List, 
    CheckCircle2, 
    AlertCircle, 
    Calendar, 
    ExternalLink, 
    Layers,
    PieChart,
    Building2,
    Wrench,
    BookOpen,
    Users,
    Coins,
    Sparkles
} from 'lucide-react';
import type { Expense, NewExpense } from '../types';
import { ExpenseCategory } from '../types';
import Modal from '../components/common/Modal';
import { useData } from '../contexts/DataContext';
import * as api from '../services/api';
import Skeleton from '../components/common/Skeleton';
import WebcamCaptureModal from '../components/common/WebcamCaptureModal';
import Pagination from '../components/common/Pagination';
import Spinner from '../components/common/Spinner';

// CSV Export Utility
function downloadExpensesCSV(filename: string, expenses: any[], currency: string = 'KES') {
    const headers = ['Date', 'Category', 'Description / Payee', `Amount (${currency})`, 'Receipt Attached', 'Attachment URL'];
    const rows = expenses.map(e => [
        e.date ? e.date.split('T')[0] : '',
        e.category || '',
        e.description || '',
        e.amount ?? 0,
        e.attachmentUrl ? 'YES' : 'NO',
        e.attachmentUrl || ''
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Category Icon Helper
const getCategoryIcon = (category: ExpenseCategory) => {
    switch (category) {
        case ExpenseCategory.Salaries:
            return <Users className="w-3.5 h-3.5 text-blue-500" />;
        case ExpenseCategory.Utilities:
            return <Building2 className="w-3.5 h-3.5 text-amber-500" />;
        case ExpenseCategory.Supplies:
            return <BookOpen className="w-3.5 h-3.5 text-emerald-500" />;
        case ExpenseCategory.Maintenance:
            return <Wrench className="w-3.5 h-3.5 text-orange-500" />;
        case ExpenseCategory.PettyCash:
        default:
            return <Coins className="w-3.5 h-3.5 text-purple-500" />;
    }
};

const ExpensesView: React.FC = () => {
    const { addNotification, formatCurrency, schoolInfo } = useData();
    const queryClient = useQueryClient();
    
    // UI State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
    const [previewReceipt, setPreviewReceipt] = useState<{ url: string; description: string } | null>(null);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    
    // Filters
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [timeframePreset, setTimeframePreset] = useState<'all' | 'month' | 'custom'>('all');
    
    const initialExpenseState: NewExpense = {
        category: ExpenseCategory.Utilities, 
        description: '', 
        amount: 0, 
        date: new Date().toISOString().split('T')[0], 
        attachmentUrl: ''
    };
    const [formData, setFormData] = useState<NewExpense>(initialExpenseState);

    // Apply quick presets
    const handlePresetChange = (preset: 'all' | 'month' | 'custom') => {
        setTimeframePreset(preset);
        setPage(1);
        if (preset === 'all') {
            setStartDate('');
            setEndDate('');
        } else if (preset === 'month') {
            const now = new Date();
            setStartDate(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);
            setEndDate(new Date().toISOString().split('T')[0]);
        }
    };

    // --- Queries ---
    const { data: expensesData, isLoading } = useQuery({
        queryKey: ['expenses', page, startDate, endDate, selectedCategory, searchQuery],
        queryFn: () => api.getExpenses({
            page,
            limit: viewMode === 'cards' ? 12 : 15,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            category: selectedCategory || undefined,
            search: searchQuery || undefined
        }),
        placeholderData: (prev) => prev
    });

    // Unpaginated expenses query for executive audit metrics & full CSV exports
    const { data: allExpensesData } = useQuery({
        queryKey: ['expenses-all-summary'],
        queryFn: () => api.getExpenses({ pagination: 'false', limit: 3000 }).then(res => res.data || res || [])
    });

    const allExpenses: Expense[] = useMemo(() => {
        if (Array.isArray(allExpensesData)) return allExpensesData;
        if (allExpensesData?.data && Array.isArray(allExpensesData.data)) return allExpensesData.data;
        return [];
    }, [allExpensesData]);

    const rawExpenses: Expense[] = useMemo(() => {
        if (!expensesData) return [];
        if (Array.isArray(expensesData.data)) return expensesData.data;
        if (Array.isArray(expensesData)) return expensesData;
        return [];
    }, [expensesData]);

    const totalPages = expensesData?.last_page || Math.max(1, Math.ceil((expensesData?.total || rawExpenses.length) / (viewMode === 'cards' ? 12 : 15))) || 1;

    // Filter by client-side search query if backend doesn't support fuzzy search on description
    const expenses = useMemo(() => {
        if (!searchQuery) return rawExpenses;
        const q = searchQuery.toLowerCase();
        return rawExpenses.filter((e: any) => 
            (e.description && e.description.toLowerCase().includes(q)) ||
            (e.category && e.category.toLowerCase().includes(q))
        );
    }, [rawExpenses, searchQuery]);

    // Strategic Expenditure & Audit Analytics
    const metrics = useMemo(() => {
        const pool = allExpenses.length > 0 ? allExpenses : rawExpenses;
        const totalDisbursed = pool.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        const receiptCount = pool.filter(e => Boolean(e.attachmentUrl)).length;
        const complianceRate = pool.length > 0 ? Math.round((receiptCount / pool.length) * 100) : 100;
        const averageVoucher = pool.length > 0 ? Math.round(totalDisbursed / pool.length) : 0;

        // Breakdown by category
        const categoryMap: Record<string, number> = {};
        pool.forEach(e => {
            const cat = e.category || 'Other';
            categoryMap[cat] = (categoryMap[cat] || 0) + (Number(e.amount) || 0);
        });

        let topCategory = 'None';
        let topCategoryAmount = 0;
        Object.entries(categoryMap).forEach(([cat, amt]) => {
            if (amt > topCategoryAmount) {
                topCategoryAmount = amt;
                topCategory = cat;
            }
        });

        return {
            totalDisbursed,
            voucherCount: pool.length,
            receiptCount,
            complianceRate,
            averageVoucher,
            topCategory,
            topCategoryAmount,
            categoryMap
        };
    }, [allExpenses, rawExpenses]);

    // --- Mutations ---
    const createMutation = useMutation({
        mutationFn: api.createExpense,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            queryClient.invalidateQueries({ queryKey: ['expenses-all-summary'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
            addNotification("Expenditure voucher committed to ledger.", "success");
            setIsModalOpen(false);
            setFormData(initialExpenseState);
        },
        onError: (err: any) => addNotification(err.message || "Failed to commit expenditure.", "error")
    });

    const updateMutation = useMutation({
        mutationFn: (data: { id: string, payload: Partial<Expense> }) => api.updateExpense(data.id, data.payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            queryClient.invalidateQueries({ queryKey: ['expenses-all-summary'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
            addNotification("Expenditure record updated.", "success");
            setIsModalOpen(false);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: api.deleteExpense,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            queryClient.invalidateQueries({ queryKey: ['expenses-all-summary'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
            addNotification("Expenditure record deleted.", "success");
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
            date: expense.date ? expense.date.split('T')[0] : new Date().toISOString().split('T')[0],
            attachmentUrl: expense.attachmentUrl
        });
        setIsModalOpen(true);
    };

    const handleFileUpload = async (file: File) => {
        setIsUploading(true);
        const uploadData = new FormData();
        uploadData.append('file', file);
        try {
            const res = await api.uploadExpenseReceipt(uploadData);
            setFormData(prev => ({ ...prev, attachmentUrl: res.url }));
            addNotification("Receipt attached to voucher.", "success");
        } catch (e) {
            // Fallback: Read as Data URL
            const reader = new FileReader();
            reader.onload = (loadEvt) => {
                setFormData(prev => ({ ...prev, attachmentUrl: loadEvt.target?.result as string }));
                addNotification("Receipt saved locally.", "info");
            };
            reader.readAsDataURL(file);
        } finally {
            setIsUploading(false);
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
        if (!formData.description) {
            addNotification("Please enter an expense description.", "error");
            return;
        }
        if (!formData.amount || formData.amount <= 0) {
            addNotification("Please specify a valid disbursement amount.", "error");
            return;
        }

        if (editingExpense) {
            updateMutation.mutate({ id: editingExpense.id, payload: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Are you sure you want to delete this expense voucher from the ledger?")) {
            deleteMutation.mutate(id);
        }
    };
    
    const handleExport = () => {
        const dataToExport = allExpenses.length > 0 ? allExpenses : rawExpenses;
        downloadExpensesCSV(
            `Expenditure_Ledger_${new Date().toISOString().split('T')[0]}`, 
            dataToExport, 
            schoolInfo?.currency || 'KES'
        );
        addNotification(`Exported ${dataToExport.length} expenditure entries.`, 'success');
    };

    const isPdf = (url?: string) => Boolean(url && url.toLowerCase().endsWith('.pdf'));

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-fade-in-up">
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

            {/* Top Header Hub */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5 no-print">
                <div>
                    <div className="flex items-center space-x-2">
                        <span className="p-2 bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 rounded-xl border border-primary-200 dark:border-primary-800">
                            <Wallet className="w-5 h-5" />
                        </span>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                            Institutional Expenditure Log
                        </h1>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
                        Operational spending, procurement vouchers, petty cash tracking, and receipt audit compliance.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                    <button 
                        id="btn-print-expenses"
                        onClick={() => window.print()}
                        className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        title="Print Expense Audit Sheet"
                    >
                        <Printer className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                        Print Sheet
                    </button>

                    <button 
                        id="btn-export-expenses-csv"
                        onClick={handleExport}
                        className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        title="Download CSV Outflows Report"
                    >
                        <Download className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                        Export CSV
                    </button>

                    <button 
                        id="btn-open-record-expense"
                        onClick={openAddModal}
                        className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-primary-600 rounded-xl shadow-sm hover:bg-primary-700 active:scale-98 transition-all"
                    >
                        <Plus className="w-4 h-4 mr-1.5" />
                        Record Expense
                    </button>
                </div>
            </div>

            {/* Strategic KPI Metric Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 no-print">
                <div className="bg-white dark:bg-slate-800/80 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Total Disbursed</span>
                        <TrendingDown className="w-4 h-4 text-red-500" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                        {formatCurrency(metrics.totalDisbursed)}
                    </div>
                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                        Across {metrics.voucherCount} total vouchers
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800/80 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Top Expenditure</span>
                        <PieChart className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white truncate">
                        {metrics.topCategory}
                    </div>
                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                        Disbursed: {formatCurrency(metrics.topCategoryAmount)}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800/80 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Receipt Compliance</span>
                        <Receipt className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                        {metrics.complianceRate}%
                    </div>
                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                        {metrics.receiptCount} of {metrics.voucherCount} receipts attached
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800/80 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Average Outflow</span>
                        <DollarSign className="w-4 h-4 text-primary-500" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                        {formatCurrency(metrics.averageVoucher)}
                    </div>
                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                        Mean voucher disbursement
                    </div>
                </div>
            </div>

            {/* Smart Filtering & View Switcher */}
            <div className="bg-white dark:bg-slate-800/90 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3 no-print">
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                    {/* Live Search */}
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input 
                            id="input-search-expenses"
                            type="text" 
                            placeholder="Search by description, vendor, or category..." 
                            value={searchQuery} 
                            onChange={e => { setSearchQuery(e.target.value); setPage(1); }} 
                            className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-primary-500 transition-colors"
                        />
                    </div>

                    {/* Quick Timeframe Preset Pills */}
                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
                        <button 
                            type="button"
                            onClick={() => handlePresetChange('all')} 
                            className={`px-3 py-1.5 rounded-lg transition-colors ${timeframePreset === 'all' ? 'bg-white dark:bg-slate-800 text-primary-600 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                        >
                            All Time
                        </button>
                        <button 
                            type="button"
                            onClick={() => handlePresetChange('month')} 
                            className={`px-3 py-1.5 rounded-lg transition-colors ${timeframePreset === 'month' ? 'bg-white dark:bg-slate-800 text-primary-600 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                        >
                            This Month
                        </button>
                        <button 
                            type="button"
                            onClick={() => handlePresetChange('custom')} 
                            className={`px-3 py-1.5 rounded-lg transition-colors ${timeframePreset === 'custom' ? 'bg-white dark:bg-slate-800 text-primary-600 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                        >
                            Custom Range
                        </button>
                    </div>

                    {/* Category Filter */}
                    <div className="w-full sm:w-52">
                        <select 
                            id="select-filter-category"
                            value={selectedCategory} 
                            onChange={e => { setSelectedCategory(e.target.value); setPage(1); }} 
                            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-hidden focus:border-primary-500"
                        >
                            <option value="">All Expense Categories</option>
                            {Object.values(ExpenseCategory).map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    {/* View Switcher */}
                    <div className="flex items-center space-x-1.5 border-t lg:border-t-0 pt-2 lg:pt-0">
                        <button 
                            id="btn-view-expenses-table"
                            onClick={() => setViewMode('table')}
                            className={`p-2 rounded-xl transition-colors ${
                                viewMode === 'table' 
                                    ? 'bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800' 
                                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                            }`}
                            title="Table Audit View"
                        >
                            <List className="w-4 h-4" />
                        </button>
                        <button 
                            id="btn-view-expenses-cards"
                            onClick={() => setViewMode('cards')}
                            className={`p-2 rounded-xl transition-colors ${
                                viewMode === 'cards' 
                                    ? 'bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800' 
                                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                            }`}
                            title="Voucher Cards View"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Custom Date Picker Bar */}
                {timeframePreset === 'custom' && (
                    <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 animate-fade-in-right">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date Window:</span>
                        <input 
                            type="date" 
                            value={startDate} 
                            onChange={e => setStartDate(e.target.value)} 
                            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                        />
                        <span className="text-xs text-slate-400 font-bold">to</span>
                        <input 
                            type="date" 
                            value={endDate} 
                            onChange={e => setEndDate(e.target.value)} 
                            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                        />
                    </div>
                )}
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1 font-medium no-print">
                <span>
                    Displaying {expenses.length} expenditure entries {selectedCategory ? `in ${selectedCategory}` : ''}
                </span>
                <span>Page {page} of {totalPages}</span>
            </div>

            {/* ========================================================= */}
            {/* View Mode: TABLE */}
            {/* ========================================================= */}
            {viewMode === 'table' && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden printable-area">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    <th className="px-5 py-3.5">Disbursement Date</th>
                                    <th className="px-5 py-3.5">Category</th>
                                    <th className="px-5 py-3.5">Description / Vendor</th>
                                    <th className="px-5 py-3.5 text-right">Amount Disbursed</th>
                                    <th className="px-5 py-3.5 text-center no-print">Receipt Proof</th>
                                    <th className="px-5 py-3.5 text-center no-print">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
                                {isLoading ? (
                                    Array.from({ length: 6 }).map((_, i) => (
                                        <tr key={i}>
                                            <td colSpan={6} className="px-5 py-3.5">
                                                <Skeleton className="h-9 w-full rounded-xl" />
                                            </td>
                                        </tr>
                                    ))
                                ) : expenses.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-16 text-slate-400 dark:text-slate-500 font-medium italic">
                                            No expenditure vouchers matching your criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    expenses.map((exp: any) => (
                                        <tr key={exp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors group">
                                            <td className="px-5 py-3 text-slate-600 dark:text-slate-300 font-medium">
                                                {new Date(exp.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                                                    {getCategoryIcon(exp.category)}
                                                    {exp.category}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-slate-900 dark:text-white font-semibold">
                                                {exp.description}
                                            </td>
                                            <td className="px-5 py-3 text-right font-black text-sm text-slate-900 dark:text-white">
                                                {formatCurrency(exp.amount)}
                                            </td>
                                            <td className="px-5 py-3 text-center no-print">
                                                {exp.attachmentUrl ? (
                                                    <button 
                                                        id={`btn-view-receipt-${exp.id}`}
                                                        onClick={() => setPreviewReceipt({ url: exp.attachmentUrl, description: exp.description })}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 rounded-lg transition-colors"
                                                        title="Inspect receipt documentation"
                                                    >
                                                        <Receipt className="w-3.5 h-3.5" />
                                                        View Proof
                                                    </button>
                                                ) : (
                                                    <span className="text-[10px] text-slate-400 italic">No receipt</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3 text-center no-print">
                                                <div className="inline-flex items-center gap-1.5">
                                                    <button 
                                                        id={`btn-edit-expense-${exp.id}`}
                                                        onClick={() => openEditModal(exp)}
                                                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                                        title="Revise Entry"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button 
                                                        id={`btn-delete-expense-${exp.id}`}
                                                        onClick={() => handleDelete(exp.id)}
                                                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                                                        title="Remove Entry"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* View Mode: VOUCHER CARDS */}
            {/* ========================================================= */}
            {viewMode === 'cards' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 no-print">
                    {isLoading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <Skeleton key={i} className="h-48 w-full rounded-2xl" />
                        ))
                    ) : expenses.length === 0 ? (
                        <div className="col-span-full text-center py-16 text-slate-400 dark:text-slate-500 font-medium italic">
                            No expenditure vouchers matching your criteria.
                        </div>
                    ) : (
                        expenses.map((exp: any) => (
                            <div 
                                key={exp.id} 
                                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs hover:border-primary-400 dark:hover:border-primary-600 transition-all flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            <span className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl">
                                                {getCategoryIcon(exp.category)}
                                            </span>
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                                    {exp.category}
                                                </span>
                                                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                                    {new Date(exp.date).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <span className="text-base font-black text-slate-900 dark:text-white">
                                            {formatCurrency(exp.amount)}
                                        </span>
                                    </div>

                                    <p className="mt-3 text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-2">
                                        {exp.description}
                                    </p>
                                </div>

                                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                                    {exp.attachmentUrl ? (
                                        <button 
                                            onClick={() => setPreviewReceipt({ url: exp.attachmentUrl, description: exp.description })}
                                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                                        >
                                            <Receipt className="w-3.5 h-3.5" />
                                            View Receipt Proof
                                        </button>
                                    ) : (
                                        <span className="text-[11px] text-slate-400 italic">No receipt attached</span>
                                    )}

                                    <div className="flex items-center gap-1">
                                        <button 
                                            onClick={() => openEditModal(exp)}
                                            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                            title="Edit"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(exp.id)}
                                            className="p-1.5 text-slate-500 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Pagination Controls */}
            <div className="pt-2 no-print">
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>

            {/* ========================================================= */}
            {/* RECORD / EDIT EXPENSE MODAL */}
            {/* ========================================================= */}
            <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title={editingExpense ? "Modify Expenditure Voucher" : "New Expenditure Voucher"} 
                size="lg"
                footer={
                    <div className="flex justify-end gap-2.5 w-full">
                        <button 
                            id="btn-expense-discard"
                            type="button" 
                            onClick={() => setIsModalOpen(false)} 
                            className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                        >
                            Discard
                        </button>
                        <button 
                            id="btn-expense-submit"
                            type="button" 
                            onClick={handleSave} 
                            disabled={createMutation.isPending || updateMutation.isPending}
                            className="inline-flex items-center px-6 py-2.5 bg-primary-600 text-white rounded-xl font-semibold text-xs shadow-sm hover:bg-primary-700 disabled:opacity-50 transition-colors"
                        >
                            {createMutation.isPending || updateMutation.isPending ? <Spinner /> : (
                                editingExpense ? 'Save Changes' : 'Commit Voucher'
                            )}
                        </button>
                    </div>
                }
            >
                <form onSubmit={handleSave} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                Spending Category *
                            </label>
                            <select 
                                id="select-expense-modal-category"
                                value={formData.category} 
                                onChange={e => setFormData({ ...formData, category: e.target.value as ExpenseCategory })} 
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-hidden focus:border-primary-500"
                                required
                            >
                                {Object.values(ExpenseCategory).map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                Date of Purchase *
                            </label>
                            <input 
                                id="input-expense-modal-date"
                                type="date" 
                                value={formData.date ? formData.date.split('T')[0] : ''} 
                                onChange={e => setFormData({ ...formData, date: e.target.value })} 
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-hidden focus:border-primary-500"
                                required
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                            Description / Payee Vendor *
                        </label>
                        <input 
                            id="input-expense-modal-description"
                            type="text" 
                            placeholder="e.g. Kenya Power token purchase, Science Lab chemicals, Printing Paper" 
                            value={formData.description} 
                            onChange={e => setFormData({ ...formData, description: e.target.value })} 
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-hidden focus:border-primary-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                            Amount Disbursed ({schoolInfo?.currency || 'KES'}) *
                        </label>
                        <input 
                            id="input-expense-modal-amount"
                            type="number" 
                            step="0.01" 
                            min="1"
                            placeholder="0.00" 
                            value={formData.amount || ''} 
                            onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })} 
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:outline-hidden focus:border-primary-500"
                            required
                        />
                    </div>
                    
                    {/* Supporting Evidence (Receipt/Invoice) */}
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                            Supporting Evidence (Receipt / Invoice Proof)
                        </label>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                            {formData.attachmentUrl ? (
                                <div className="relative w-16 h-16 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
                                    {isPdf(formData.attachmentUrl) ? (
                                        <div className="h-full w-full flex items-center justify-center bg-red-50 text-red-600 font-bold text-xs">
                                            PDF
                                        </div>
                                    ) : (
                                        <img src={formData.attachmentUrl} alt="Receipt Preview" className="h-full w-full object-cover" />
                                    )}
                                </div>
                            ) : (
                                <div className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-300 dark:text-slate-600">
                                    <Receipt className="w-6 h-6" />
                                </div>
                            )}

                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    {formData.attachmentUrl ? 'Evidence document attached' : 'No document attached'}
                                </p>
                                <div className="flex items-center gap-2 pt-0.5">
                                    <input 
                                        type="file" 
                                        accept="image/*,application/pdf" 
                                        ref={fileInputRef} 
                                        onChange={handleFileChange} 
                                        className="hidden"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => fileInputRef.current?.click()} 
                                        disabled={isUploading}
                                        className="px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-100 transition-colors"
                                    >
                                        <Upload className="w-3 h-3 mr-1 inline" />
                                        {isUploading ? 'Uploading...' : 'Upload File'}
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => setIsCaptureModalOpen(true)} 
                                        className="px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-100 transition-colors"
                                    >
                                        <Camera className="w-3 h-3 mr-1 inline" />
                                        Snap Camera
                                    </button>
                                    {formData.attachmentUrl && (
                                        <button 
                                            type="button" 
                                            onClick={() => setFormData(prev => ({ ...prev, attachmentUrl: '' }))}
                                            className="px-2 py-1 text-xs text-red-500 hover:text-red-700 font-semibold"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* ========================================================= */}
            {/* RECEIPT LIGHTBOX MODAL */}
            {/* ========================================================= */}
            {previewReceipt && (
                <Modal 
                    isOpen={Boolean(previewReceipt)} 
                    onClose={() => setPreviewReceipt(null)} 
                    title={`Receipt Proof: ${previewReceipt.description}`}
                    size="lg"
                    footer={
                        <div className="flex justify-between items-center w-full">
                            <a 
                                href={previewReceipt.url} 
                                target="_blank" 
                                rel="noreferrer" 
                                download 
                                className="inline-flex items-center px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-colors"
                            >
                                <Download className="w-3.5 h-3.5 mr-1.5" />
                                Download File
                            </a>
                            <button 
                                onClick={() => setPreviewReceipt(null)}
                                className="px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-semibold hover:bg-primary-700 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    }
                >
                    <div className="p-2 flex items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-2xl min-h-[300px]">
                        {isPdf(previewReceipt.url) ? (
                            <iframe 
                                src={previewReceipt.url} 
                                title="Receipt Document" 
                                className="w-full h-96 rounded-xl border border-slate-200 dark:border-slate-700" 
                            />
                        ) : (
                            <img 
                                src={previewReceipt.url} 
                                alt="Receipt Evidence" 
                                className="max-h-[500px] w-auto object-contain rounded-xl shadow-xs" 
                            />
                        )}
                    </div>
                </Modal>
            )}

            {/* Sub-Modals */}
            <WebcamCaptureModal 
                isOpen={isCaptureModalOpen} 
                onClose={() => setIsCaptureModalOpen(false)} 
                onCapture={handlePhotoCapture} 
            />
        </div>
    );
};

export default ExpensesView;
