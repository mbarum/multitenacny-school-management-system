import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    CreditCard, 
    DollarSign, 
    TrendingUp, 
    AlertTriangle, 
    CheckCircle2, 
    Search, 
    Filter, 
    Plus, 
    Download, 
    Receipt, 
    Smartphone, 
    Calendar, 
    Trash2, 
    Edit2, 
    ArrowUpRight, 
    ArrowDownLeft, 
    FileSpreadsheet, 
    FileText,
    Printer,
    Building, 
    Wallet, 
    ChevronRight, 
    ChevronDown,
    ChevronUp,
    ShieldCheck, 
    Sparkles, 
    RefreshCw,
    UserCheck,
    Coins,
    HelpCircle,
    Layers,
    PieChart
} from 'lucide-react';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import { initiateSTKPush } from '../services/darajaService';
import type { Transaction, NewTransaction, Student } from '../types';
import { PaymentMethod, TransactionType, StudentStatus } from '../types';
import { useData } from '../contexts/DataContext';
import GenerateInvoicesModal from '../components/common/GenerateInvoicesModal';
import ReceiptModal from '../components/common/ReceiptModal';
import FeeLedgerPrintModal from '../components/common/FeeLedgerPrintModal';
import StatementModal from '../components/common/StatementModal';
import * as api from '../services/api';
import Skeleton from '../components/common/Skeleton';
import Spinner from '../components/common/Spinner';
import { generateFeesPDF } from '../services/exportService';

// CSV Export Utility for Ledger
function downloadTransactionsCSV(filename: string, transactions: any[], currency: string = 'KES') {
    const headers = ['Date', 'Transaction Code / Ref', 'Type', 'Student Name', `Amount (${currency})`, 'Payment Method', 'Description'];
    const rows = transactions.map(t => [
        t.date ? t.date.split('T')[0] : '',
        t.transactionCode || t.id?.substring(0, 8)?.toUpperCase() || '',
        t.type || '',
        t.studentName || 'Unassigned',
        t.amount ?? 0,
        t.method || (t.type === TransactionType.Payment ? 'Standard Cash' : 'Billing Invoice'),
        t.description || ''
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

const FeeManagementView: React.FC = () => {
    const { darajaSettings, addNotification, formatCurrency, schoolInfo } = useData();
    const queryClient = useQueryClient();

    // UI State
    const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
    const [isGenerateInvoicesModalOpen, setIsGenerateInvoicesModalOpen] = useState(false);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [isLedgerPrintModalOpen, setIsLedgerPrintModalOpen] = useState(false);
    const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
    const [selectedStudentForStatement, setSelectedStudentForStatement] = useState<Student | null>(null);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [isPaying, setIsPaying] = useState(false);
    const [entryMode, setEntryMode] = useState<TransactionType>(TransactionType.Payment);

    // Filter State
    const [filterOption, setFilterOption] = useState('all');
    const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
    const [methodFilter, setMethodFilter] = useState<'all' | PaymentMethod>('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);

    // Form State
    const [paymentForm, setPaymentForm] = useState<Partial<Transaction>>({
        studentId: '', 
        amount: 0, 
        date: new Date().toISOString().split('T')[0], 
        method: PaymentMethod.Cash, 
        description: 'Term Tuition Payment', 
        type: TransactionType.Payment,
        transactionCode: ''
    });

    const isMpesaConfigured = Boolean(darajaSettings?.consumerKey && darajaSettings?.paybillNumber);
    const [showClassBreakdown, setShowClassBreakdown] = useState(false);

    // --- Queries ---

    const { data: students = [] } = useQuery({
        queryKey: ['students-list'],
        queryFn: () => api.getStudents({ limit: 2000 }).then(res => Array.isArray(res) ? res : res.data || [])
    });

    const { data: feeStructure = [] } = useQuery({
        queryKey: ['fee-structure'],
        queryFn: () => api.getFeeStructure().then(res => Array.isArray(res) ? res : [])
    });

    const { data: classes = [] } = useQuery({
        queryKey: ['classes'],
        queryFn: () => api.getClasses().then(res => Array.isArray(res) ? res : [])
    });

    const getDateRange = () => {
        if (filterOption === 'custom') return { startDate, endDate };
        const now = new Date();
        const range: { startDate?: string, endDate?: string } = {};
        if (filterOption === 'today') {
            range.startDate = range.endDate = now.toISOString().split('T')[0];
        } else if (filterOption === 'this_week') {
            const day = now.getDay();
            const monday = new Date(now.setDate(now.getDate() - day + (day === 0 ? -6 : 1)));
            range.startDate = monday.toISOString().split('T')[0];
            range.endDate = new Date().toISOString().split('T')[0];
        } else if (filterOption === 'this_month') {
            range.startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            range.endDate = new Date().toISOString().split('T')[0];
        }
        return range;
    };

    const { startDate: qStart, endDate: qEnd } = getDateRange();

    // Query for paginated transactions
    const { data: transactionsData, isLoading } = useQuery({
        queryKey: ['transactions', page, searchTerm, filterOption, startDate, endDate],
        queryFn: () => api.getTransactions({
            page,
            limit: 15,
            search: searchTerm || undefined,
            startDate: qStart || undefined,
            endDate: qEnd || undefined
        }),
        placeholderData: (prev) => prev
    });

    // Unpaginated transactions for strategic metrics & CSV
    const { data: allTransactionsData } = useQuery({
        queryKey: ['transactions-all-summary'],
        queryFn: () => api.getTransactions({ pagination: 'false', limit: 5000 }).then(res => res.data || res || [])
    });

    const allTransactions: Transaction[] = useMemo(() => {
        if (Array.isArray(allTransactionsData)) return allTransactionsData;
        if (allTransactionsData?.data && Array.isArray(allTransactionsData.data)) return allTransactionsData.data;
        return [];
    }, [allTransactionsData]);

    const rawTransactions: Transaction[] = useMemo(() => {
        if (!transactionsData) return [];
        if (Array.isArray(transactionsData.data)) return transactionsData.data;
        if (Array.isArray(transactionsData)) return transactionsData;
        return [];
    }, [transactionsData]);

    const totalPages = transactionsData?.last_page || Math.max(1, Math.ceil((transactionsData?.total || rawTransactions.length) / 15)) || 1;

    // Apply client-side sub-filters (type and method)
    const transactions = useMemo(() => {
        return rawTransactions.filter((t: any) => {
            if (typeFilter !== 'all' && t.type !== typeFilter) return false;
            if (methodFilter !== 'all' && t.method !== methodFilter) return false;
            return true;
        });
    }, [rawTransactions, typeFilter, methodFilter]);

    // Strategic Financial Pulse Metrics
    const metrics = useMemo(() => {
        const pool = allTransactions.length > 0 ? allTransactions : rawTransactions;
        
        let totalCollections = 0;
        let totalInvoiced = 0;
        let mpesaCollections = 0;

        pool.forEach((t: any) => {
            const amt = Number(t.amount) || 0;
            if (t.type === TransactionType.Payment || t.type === TransactionType.ManualCredit) {
                totalCollections += amt;
                if (t.method === PaymentMethod.MPesa) {
                    mpesaCollections += amt;
                }
            } else if (t.type === TransactionType.Invoice || t.type === TransactionType.ManualDebit) {
                totalInvoiced += amt;
            }
        });

        // Calculate student total outstanding arrears from students list
        const totalArrears = students.reduce((acc: number, s: any) => acc + Math.max(0, s.balance || 0), 0);

        // Calculate expected fee projection from curriculum fee structure per class & enrolled scholars
        let feeStructureExpected = 0;
        const classMap: Record<string, { className: string; count: number; feePerStudent: number; totalExpected: number }> = {};
        
        classes.forEach((c: any) => {
            let classFeeSum = 0;
            feeStructure.forEach((item: any) => {
                const cf = item.classSpecificFees?.find((f: any) => f.classId === c.id);
                if (cf && cf.amount) {
                    classFeeSum += Number(cf.amount);
                }
            });
            classMap[c.id] = {
                className: c.name,
                count: 0,
                feePerStudent: classFeeSum,
                totalExpected: 0
            };
        });

        students.forEach((s: any) => {
            if (s.status !== StudentStatus.Inactive && s.status !== StudentStatus.Graduated && s.classId) {
                if (!classMap[s.classId]) {
                    const matchedClass = classes.find((c: any) => c.id === s.classId);
                    classMap[s.classId] = {
                        className: matchedClass?.name || 'Class ' + s.classId,
                        count: 0,
                        feePerStudent: 0,
                        totalExpected: 0
                    };
                }
                classMap[s.classId].count += 1;
                
                let studentFee = 0;
                feeStructure.forEach((item: any) => {
                    const cf = item.classSpecificFees?.find((f: any) => f.classId === s.classId);
                    if (cf && cf.amount) {
                        studentFee += Number(cf.amount);
                    }
                });
                classMap[s.classId].totalExpected += studentFee;
                feeStructureExpected += studentFee;
            }
        });

        const classBreakdown = Object.entries(classMap).map(([classId, info]) => ({
            classId,
            className: info.className,
            enrolledCount: info.count,
            feePerStudent: info.feePerStudent,
            totalExpected: info.totalExpected
        }));

        const totalExpectedFee = feeStructureExpected > 0 
            ? feeStructureExpected 
            : (totalInvoiced > 0 ? totalInvoiced : totalCollections + totalArrears);

        const collectionEfficiency = totalExpectedFee > 0 
            ? Math.min(100, Math.round((totalCollections / totalExpectedFee) * 100)) 
            : (totalInvoiced > 0 ? Math.min(100, Math.round((totalCollections / totalInvoiced) * 100)) : 100);

        return {
            totalCollections,
            totalInvoiced,
            totalArrears,
            totalExpectedFee,
            feeStructureExpected,
            classBreakdown,
            mpesaCollections,
            collectionEfficiency,
            entryCount: pool.length
        };
    }, [allTransactions, rawTransactions, students, feeStructure, classes]);

    // --- Mutations ---

    const createMutation = useMutation({
        mutationFn: api.createTransaction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['transactions-all-summary'] });
            queryClient.invalidateQueries({ queryKey: ['students'] });
            queryClient.invalidateQueries({ queryKey: ['students-list'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
            addNotification("Transaction recorded in official ledger.", "success");
            setIsRecordModalOpen(false);
        },
        onError: () => addNotification("Failed to record transaction.", "error")
    });

    const updateMutation = useMutation({
        mutationFn: (data: { id: string, payload: any }) => api.updateTransaction(data.id, data.payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['transactions-all-summary'] });
            queryClient.invalidateQueries({ queryKey: ['students'] });
            queryClient.invalidateQueries({ queryKey: ['students-list'] });
            addNotification("Transaction updated successfully.", "success");
            setIsRecordModalOpen(false);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: api.deleteTransaction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['transactions-all-summary'] });
            queryClient.invalidateQueries({ queryKey: ['students'] });
            queryClient.invalidateQueries({ queryKey: ['students-list'] });
            addNotification("Transaction permanently removed.", "success");
        }
    });

    // --- Handlers ---

    const openRecordModal = (mode: TransactionType = TransactionType.Payment) => {
        setSelectedTransaction(null);
        setEntryMode(mode);
        setPaymentForm({
            studentId: '', 
            amount: 0, 
            date: new Date().toISOString().split('T')[0], 
            method: mode === TransactionType.Payment ? PaymentMethod.MPesa : PaymentMethod.Cash, 
            description: mode === TransactionType.Payment ? 'Tuition Fee Payment' : 'Termly Tuition Invoice', 
            type: mode,
            transactionCode: ''
        });
        setIsRecordModalOpen(true);
    };

    const openEditModal = (transaction: Transaction) => {
        setSelectedTransaction(transaction);
        setEntryMode(transaction.type);
        setPaymentForm({ ...transaction });
        setIsRecordModalOpen(true);
    };

    const openReceipt = (transaction: Transaction) => {
        setSelectedTransaction(transaction);
        setIsReceiptModalOpen(true);
    };

    const handleStkPush = async () => {
        if (!paymentForm.studentId || !paymentForm.amount || paymentForm.amount <= 0) {
            addNotification("Please select a scholar and enter a valid payment amount first.", 'error');
            return;
        }
        const student = students.find((s: any) => s.id === paymentForm.studentId);
        if (!student) return;
        if (!student.guardianContact) {
            addNotification("This scholar has no registered guardian contact phone.", 'error');
            return;
        }

        setIsPaying(true);
        try {
            const response = await initiateSTKPush(
                paymentForm.amount, 
                student.guardianContact, 
                student.admissionNumber
            );
            addNotification(response.CustomerMessage || 'M-Pesa STK Prompt dispatched to guardian.', 'info');
            setIsRecordModalOpen(false);
        } catch (error: any) {
            addNotification(error.message || 'M-Pesa STK push failed. Check gateway credentials.', 'error');
        } finally {
            setIsPaying(false);
        }
    };

    const handleSaveTransaction = (e: React.FormEvent) => {
        e.preventDefault();
        if (!paymentForm.studentId) {
            addNotification("Please select a scholar.", "error");
            return;
        }
        if (!paymentForm.amount || paymentForm.amount <= 0) {
            addNotification("Please enter an amount greater than 0.", "error");
            return;
        }

        if (selectedTransaction) {
            updateMutation.mutate({ id: selectedTransaction.id, payload: paymentForm });
        } else {
            const student = students.find((s: any) => s.id === paymentForm.studentId);
            createMutation.mutate({
                ...paymentForm,
                studentName: student?.name || 'Unassigned Scholar',
                type: entryMode,
                amount: Number(paymentForm.amount) || 0,
                date: paymentForm.date || new Date().toISOString(),
                description: paymentForm.description || (entryMode === TransactionType.Payment ? 'Fee Payment' : 'Tuition Billing'),
                method: entryMode === TransactionType.Payment ? paymentForm.method : undefined
            } as NewTransaction);
        }
    };

    const handleExportLedger = () => {
        const dataToExport = allTransactions.length > 0 ? allTransactions : rawTransactions;
        downloadTransactionsCSV(
            `Institutional_Ledger_${new Date().toISOString().split('T')[0]}`, 
            dataToExport, 
            schoolInfo?.currency || 'KES'
        );
        addNotification(`Exported ${dataToExport.length} ledger entries to CSV.`, 'success');
    };

    const handleExportLedgerPDF = () => {
        try {
            const dataToExport = allTransactions.length > 0 ? allTransactions : rawTransactions;
            const doc = generateFeesPDF(dataToExport, schoolInfo);
            const filename = `${schoolInfo?.schoolCode || 'School'}_Fees_Ledger_${new Date().toISOString().slice(0, 10)}.pdf`;
            doc.save(filename);
            addNotification(`Exported ${dataToExport.length} financial ledger entries to PDF document.`, 'success');
        } catch (err) {
            console.error('Failed to generate PDF:', err);
            addNotification('Failed to generate PDF export.', 'error');
        }
    };

    const activeScholar = useMemo(() => {
        return students.find((s: any) => s.id === paymentForm.studentId);
    }, [students, paymentForm.studentId]);

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-fade-in-up">
            {/* Top Header Hub */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
                <div>
                    <div className="flex items-center space-x-2">
                        <span className="p-2 bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 rounded-xl border border-primary-200 dark:border-primary-800">
                            <CreditCard className="w-5 h-5" />
                        </span>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                            Fee Collection & Ledger
                        </h1>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
                        Institutional revenue management, student balances, automated billing, and M-Pesa reconciliation.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                    <button 
                        id="btn-export-ledger-csv"
                        onClick={handleExportLedger}
                        className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        title="Download CSV Ledger Statement"
                    >
                        <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                        Export CSV
                    </button>

                    <button 
                        id="btn-export-ledger-pdf"
                        onClick={handleExportLedgerPDF}
                        className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        title="Download PDF Ledger Statement"
                    >
                        <FileText className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                        Export PDF
                    </button>

                    <button 
                        id="btn-print-ledger-modal"
                        onClick={() => setIsLedgerPrintModalOpen(true)}
                        className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        title="Print Certified Institutional Ledger"
                    >
                        <Printer className="w-3.5 h-3.5 mr-1.5 text-slate-700 dark:text-slate-300" />
                        Print Ledger
                    </button>

                    <button 
                        id="btn-open-bulk-bill"
                        onClick={() => setIsGenerateInvoicesModalOpen(true)}
                        className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                        <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-primary-600" />
                        Bulk Invoicing
                    </button>

                    <button 
                        id="btn-open-record-payment"
                        onClick={() => openRecordModal(TransactionType.Payment)}
                        className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-primary-600 rounded-xl shadow-sm hover:bg-primary-700 active:scale-98 transition-all"
                    >
                        <Plus className="w-4 h-4 mr-1.5" />
                        Record Transaction
                    </button>
                </div>
            </div>

            {/* Strategic KPI Metric Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                {/* Total Expected Fees Card */}
                <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-blue-50/90 to-indigo-50/50 dark:from-slate-800/90 dark:to-blue-950/20 p-4 sm:p-5 rounded-2xl border border-blue-200/80 dark:border-blue-900/50 shadow-xs">
                    <div className="flex items-center justify-between text-blue-700 dark:text-blue-400 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Total Expected Fees</span>
                        <Receipt className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-blue-900 dark:text-blue-100">
                        {formatCurrency(metrics.totalExpectedFee)}
                    </div>
                    <div className="text-[11px] font-medium text-blue-700 dark:text-blue-300 mt-1 flex items-center justify-between">
                        <span>{students.length} Enrolled Scholars</span>
                        <span className="px-1.5 py-0.5 rounded-md bg-blue-200/60 dark:bg-blue-900/60 text-[10px] font-bold">
                            {metrics.collectionEfficiency}% Collected
                        </span>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800/80 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Total Collections</span>
                        <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(metrics.totalCollections)}
                    </div>
                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>M-Pesa: {formatCurrency(metrics.mpesaCollections)}</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800/80 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Outstanding Arrears</span>
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-red-600 dark:text-red-400">
                        {formatCurrency(metrics.totalArrears)}
                    </div>
                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                        Net pending student debt
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800/80 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Tuition Invoiced</span>
                        <ArrowUpRight className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                        {formatCurrency(metrics.totalInvoiced)}
                    </div>
                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                        Cumulative invoices billed
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800/80 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider">M-Pesa Gateway</span>
                        <Smartphone className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`w-2.5 h-2.5 rounded-full ${isMpesaConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                        <span className="text-lg font-black text-slate-900 dark:text-white">
                            {isMpesaConfigured ? `Paybill ${darajaSettings?.paybillNumber}` : 'Not Configured'}
                        </span>
                    </div>
                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                        {isMpesaConfigured ? 'Direct STK Push Ready' : 'Configure in Settings'}
                    </div>
                </div>
            </div>

            {/* Expected Fee Progress & Class Breakdown Strip */}
            <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="p-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-lg">
                                <PieChart className="w-4 h-4" />
                            </span>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                Institutional Fee Expectation & Collection Pulse
                            </h3>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Total Expected Revenue: <strong className="text-slate-800 dark:text-slate-200">{formatCurrency(metrics.totalExpectedFee)}</strong> • Collected: <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(metrics.totalCollections)} ({metrics.collectionEfficiency}%)</strong> • Outstanding Arrears: <strong className="text-red-600 dark:text-red-400">{formatCurrency(metrics.totalArrears)}</strong>
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowClassBreakdown(!showClassBreakdown)}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-950/50 hover:bg-primary-100 dark:hover:bg-primary-900/50 rounded-xl transition-colors border border-primary-200/80 dark:border-primary-800"
                    >
                        <Layers className="w-3.5 h-3.5 mr-1.5" />
                        {showClassBreakdown ? 'Hide Class Breakdown' : 'View Class-by-Class Expected Fees'}
                        {showClassBreakdown ? <ChevronUp className="w-3.5 h-3.5 ml-1.5" /> : <ChevronDown className="w-3.5 h-3.5 ml-1.5" />}
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                    <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden flex shadow-inner">
                        <div 
                            className="bg-emerald-500 h-full transition-all duration-500" 
                            style={{ width: `${Math.min(100, metrics.collectionEfficiency)}%` }}
                            title={`Collected: ${formatCurrency(metrics.totalCollections)} (${metrics.collectionEfficiency}%)`}
                        />
                        <div 
                            className="bg-red-400/80 h-full transition-all duration-500" 
                            style={{ width: `${Math.min(100 - Math.min(100, metrics.collectionEfficiency), metrics.totalExpectedFee > 0 ? (metrics.totalArrears / metrics.totalExpectedFee) * 100 : 0)}%` }}
                            title={`Outstanding: ${formatCurrency(metrics.totalArrears)}`}
                        />
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400 font-medium px-1">
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span>Collected: <strong>{formatCurrency(metrics.totalCollections)}</strong></span>
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-red-400"></span>
                            <span>Arrears: <strong>{formatCurrency(metrics.totalArrears)}</strong></span>
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            <span>Target: <strong>{formatCurrency(metrics.totalExpectedFee)}</strong></span>
                        </span>
                    </div>
                </div>

                {/* Collapsible Class-by-Class Breakdown */}
                {showClassBreakdown && (
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-700/80 animate-in fade-in duration-200">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2.5">
                            Class-by-Class Projected Fee Revenue
                        </h4>
                        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 dark:bg-slate-800/90 text-slate-500 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-700">
                                    <tr>
                                        <th className="px-4 py-2.5">Class / Stream</th>
                                        <th className="px-4 py-2.5 text-center">Active Scholars</th>
                                        <th className="px-4 py-2.5 text-right">Fee Per Scholar</th>
                                        <th className="px-4 py-2.5 text-right">Total Expected Revenue</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 bg-white dark:bg-slate-850">
                                    {metrics.classBreakdown.map((item) => (
                                        <tr key={item.classId} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30">
                                            <td className="px-4 py-2 font-bold text-slate-800 dark:text-slate-200">
                                                {item.className}
                                            </td>
                                            <td className="px-4 py-2 text-center text-slate-600 dark:text-slate-300">
                                                {item.enrolledCount} scholars
                                            </td>
                                            <td className="px-4 py-2 text-right font-medium text-slate-600 dark:text-slate-300">
                                                {formatCurrency(item.feePerStudent)}
                                            </td>
                                            <td className="px-4 py-2 text-right font-bold text-blue-600 dark:text-blue-400">
                                                {formatCurrency(item.totalExpected)}
                                            </td>
                                        </tr>
                                    ))}
                                    {metrics.classBreakdown.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-4 text-center text-slate-400">
                                                No class fee projections available. Configure fees in Fee Structure.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot className="bg-slate-50 dark:bg-slate-800 font-bold border-t border-slate-200 dark:border-slate-700">
                                    <tr>
                                        <td className="px-4 py-2.5 text-slate-900 dark:text-white">Institutional Total</td>
                                        <td className="px-4 py-2.5 text-center text-slate-900 dark:text-white">
                                            {students.length} scholars
                                        </td>
                                        <td className="px-4 py-2.5 text-right text-slate-500">-</td>
                                        <td className="px-4 py-2.5 text-right text-blue-600 dark:text-blue-400">
                                            {formatCurrency(metrics.totalExpectedFee)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Smart Filter & Search Control Center */}
            <div className="bg-white dark:bg-slate-800/90 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                    {/* Live Search */}
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input 
                            id="input-search-transactions"
                            type="text" 
                            placeholder="Search by scholar name, ref code, or description..." 
                            value={searchTerm} 
                            onChange={e => { setSearchTerm(e.target.value); setPage(1); }} 
                            className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-primary-500 transition-colors"
                        />
                    </div>

                    {/* Timeframe Selector */}
                    <div className="w-full sm:w-44">
                        <select 
                            id="select-filter-timeframe"
                            value={filterOption} 
                            onChange={e => { setFilterOption(e.target.value); setPage(1); }} 
                            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-hidden focus:border-primary-500"
                        >
                            <option value="all">All Time Records</option>
                            <option value="today">Today Only</option>
                            <option value="this_week">This Current Week</option>
                            <option value="this_month">This Current Month</option>
                            <option value="custom">Custom Date Range</option>
                        </select>
                    </div>

                    {/* Transaction Type Filter */}
                    <div className="w-full sm:w-40">
                        <select 
                            id="select-filter-type"
                            value={typeFilter} 
                            onChange={e => setTypeFilter(e.target.value as any)} 
                            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-hidden focus:border-primary-500"
                        >
                            <option value="all">All Entry Types</option>
                            <option value={TransactionType.Payment}>Payments (Credit)</option>
                            <option value={TransactionType.Invoice}>Invoices (Debit)</option>
                            <option value={TransactionType.ManualDebit}>Manual Debits</option>
                            <option value={TransactionType.ManualCredit}>Manual Credits</option>
                        </select>
                    </div>

                    {/* Payment Method Filter */}
                    <div className="w-full sm:w-36">
                        <select 
                            id="select-filter-method"
                            value={methodFilter} 
                            onChange={e => setMethodFilter(e.target.value as any)} 
                            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-hidden focus:border-primary-500"
                        >
                            <option value="all">All Channels</option>
                            <option value={PaymentMethod.MPesa}>M-Pesa</option>
                            <option value={PaymentMethod.Cash}>Cash</option>
                            <option value={PaymentMethod.Check}>Cheque / Bank</option>
                        </select>
                    </div>
                </div>

                {/* Custom Date Pickers */}
                {filterOption === 'custom' && (
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
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1 font-medium">
                <span>
                    Displaying {transactions.length} transactions {filterOption !== 'all' ? `(${filterOption})` : ''}
                </span>
                <span>Page {page} of {totalPages}</span>
            </div>

            {/* High-Performance Ledger Data Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                <th className="px-5 py-3.5">Posting Date</th>
                                <th className="px-5 py-3.5">Ref / Serial #</th>
                                <th className="px-5 py-3.5">Entry Type</th>
                                <th className="px-5 py-3.5">Scholar / Description</th>
                                <th className="px-5 py-3.5">Channel</th>
                                <th className="px-5 py-3.5 text-right">Amount</th>
                                <th className="px-5 py-3.5 text-center">Documentation</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
                            {isLoading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan={7} className="px-5 py-3.5">
                                            <Skeleton className="h-9 w-full rounded-xl" />
                                        </td>
                                    </tr>
                                ))
                            ) : transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-16 text-slate-400 dark:text-slate-500 font-medium">
                                        No financial entries found matching the active criteria.
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((t: any) => {
                                    const isPayment = t.type === TransactionType.Payment || t.type === TransactionType.ManualCredit;
                                    const isInvoice = t.type === TransactionType.Invoice || t.type === TransactionType.ManualDebit;
                                    const formattedDate = new Date(t.date).toLocaleDateString();

                                    return (
                                        <tr key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors group">
                                            <td className="px-5 py-3 text-slate-600 dark:text-slate-300 font-medium">
                                                {formattedDate}
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                                    {t.transactionCode || t.id.substring(0, 8).toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                                    isPayment 
                                                        ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300' 
                                                        : 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                                                }`}>
                                                    {t.type}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="font-bold text-slate-900 dark:text-white leading-snug">
                                                    {t.studentName || students.find((s: any) => s.id === t.studentId)?.name || 'General Student'}
                                                </div>
                                                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate max-w-xs">
                                                    {t.description || 'Tuition ledger transaction'}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3">
                                                {t.method === PaymentMethod.MPesa ? (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                        <Smartphone className="w-3 h-3" />
                                                        M-Pesa
                                                    </span>
                                                ) : t.method ? (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                                                        <Wallet className="w-3 h-3 text-slate-400" />
                                                        {t.method}
                                                    </span>
                                                ) : (
                                                    <span className="text-[11px] text-slate-400 italic">Direct Billing</span>
                                                )}
                                            </td>
                                            <td className={`px-5 py-3 text-right font-black text-sm ${isPayment ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                                                {isPayment ? '+' : ''}{formatCurrency(t.amount)}
                                            </td>
                                            <td className="px-5 py-3 text-center">
                                                <div className="inline-flex items-center gap-1.5">
                                                    <button 
                                                        id={`btn-receipt-${t.id}`}
                                                        onClick={() => openReceipt(t)}
                                                        className="px-2.5 py-1 text-xs font-semibold text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-950/40 hover:bg-primary-100 dark:hover:bg-primary-900/60 rounded-lg transition-colors flex items-center gap-1"
                                                        title="Print or View Official Receipt"
                                                    >
                                                        <Receipt className="w-3 h-3" />
                                                        {isInvoice ? 'Invoice' : 'Receipt'}
                                                    </button>
                                                    {t.studentId && (
                                                        <button 
                                                            id={`btn-statement-${t.id}`}
                                                            onClick={() => {
                                                                const s = students.find((st: any) => st.id === t.studentId) || {
                                                                    id: t.studentId,
                                                                    name: t.studentName || 'Scholar',
                                                                    admissionNumber: t.studentAdmissionNumber || 'ADM',
                                                                    class: t.studentClass || 'N/A'
                                                                } as Student;
                                                                setSelectedStudentForStatement(s);
                                                                setIsStatementModalOpen(true);
                                                            }}
                                                            className="px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1"
                                                            title="Print Scholar Statement of Account"
                                                        >
                                                            <FileText className="w-3 h-3 text-slate-500" />
                                                            <span>Statement</span>
                                                        </button>
                                                    )}
                                                    <button 
                                                        id={`btn-edit-transaction-${t.id}`}
                                                        onClick={() => openEditModal(t)}
                                                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                                        title="Edit Transaction"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Controls */}
            <div className="pt-2">
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>

            {/* ========================================================= */}
            {/* RECORD TRANSACTION MODAL */}
            {/* ========================================================= */}
            <Modal 
                isOpen={isRecordModalOpen} 
                onClose={() => setIsRecordModalOpen(false)} 
                title={selectedTransaction ? 'Edit Ledger Entry' : 'Record Ledger Transaction'} 
                size="lg"
                footer={
                    <div className="flex justify-between items-center w-full gap-3">
                        {/* If M-Pesa is selected and Daraja is ready, show quick STK Push trigger */}
                        {entryMode === TransactionType.Payment && paymentForm.method === PaymentMethod.MPesa && isMpesaConfigured && (
                            <button 
                                id="btn-trigger-stk-push"
                                type="button" 
                                onClick={handleStkPush} 
                                disabled={isPaying || !paymentForm.studentId || !paymentForm.amount}
                                className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-xl font-semibold text-xs shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                            >
                                {isPaying ? <Spinner /> : (
                                    <>
                                        <Smartphone className="w-3.5 h-3.5 mr-1.5" />
                                        Send STK Push to Guardian
                                    </>
                                )}
                            </button>
                        )}
                        {!isMpesaConfigured && <div />}

                        <div className="flex items-center gap-2">
                            <button 
                                id="btn-record-cancel"
                                type="button" 
                                onClick={() => setIsRecordModalOpen(false)} 
                                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                            >
                                Discard
                            </button>
                            <button 
                                id="btn-record-submit"
                                type="button" 
                                onClick={handleSaveTransaction} 
                                disabled={createMutation.isPending || updateMutation.isPending}
                                className="inline-flex items-center px-6 py-2.5 bg-primary-600 text-white rounded-xl font-semibold text-xs shadow-sm hover:bg-primary-700 disabled:opacity-50 transition-colors"
                            >
                                {createMutation.isPending || updateMutation.isPending ? <Spinner /> : (
                                    selectedTransaction ? 'Update Entry' : 'Post to Ledger'
                                )}
                            </button>
                        </div>
                    </div>
                }
            >
                <form onSubmit={handleSaveTransaction} className="space-y-5">
                    {/* Dual Mode Switcher (Payment vs Invoice) */}
                    {!selectedTransaction && (
                        <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                            <button 
                                type="button"
                                onClick={() => {
                                    setEntryMode(TransactionType.Payment);
                                    setPaymentForm(prev => ({ ...prev, type: TransactionType.Payment, description: 'Tuition Fee Payment' }));
                                }}
                                className={`py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 ${
                                    entryMode === TransactionType.Payment 
                                        ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs' 
                                        : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                <ArrowDownLeft className="w-3.5 h-3.5" />
                                Receive Fee Payment
                            </button>
                            <button 
                                type="button"
                                onClick={() => {
                                    setEntryMode(TransactionType.Invoice);
                                    setPaymentForm(prev => ({ ...prev, type: TransactionType.Invoice, description: 'Tuition Billing Fee' }));
                                }}
                                className={`py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 ${
                                    entryMode === TransactionType.Invoice 
                                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs' 
                                        : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                <ArrowUpRight className="w-3.5 h-3.5" />
                                Issue Fee Invoice
                            </button>
                        </div>
                    )}

                    {/* Scholar Selector with Live Balance Context */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                            Target Scholar / Account *
                        </label>
                        <select 
                            id="select-transaction-student"
                            value={paymentForm.studentId || ''} 
                            onChange={e => setPaymentForm({ ...paymentForm, studentId: e.target.value })} 
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-hidden focus:border-primary-500"
                            required
                        >
                            <option value="">Select Scholar...</option>
                            {students.map((s: any) => (
                                <option key={s.id} value={s.id}>
                                    {s.name} (#{s.admissionNumber}) - Class: {s.class || 'N/A'} [Bal: {formatCurrency(s.balance || 0)}]
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Active Scholar Balance Preview */}
                    {activeScholar && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                            <div>
                                <span className="font-bold text-slate-900 dark:text-white">{activeScholar.name}</span>
                                <span className="text-slate-400 dark:text-slate-500 ml-2">Class: {activeScholar.class}</span>
                            </div>
                            <div>
                                <span className="text-slate-400 mr-2">Current Balance:</span>
                                <span className={`font-black ${(activeScholar.balance || 0) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                    {formatCurrency(activeScholar.balance || 0)}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                Transaction Amount ({schoolInfo?.currency || 'KES'}) *
                            </label>
                            <input 
                                id="input-transaction-amount"
                                type="number" 
                                step="0.01" 
                                min="1" 
                                placeholder="0.00" 
                                value={paymentForm.amount || ''} 
                                onChange={e => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })} 
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:outline-hidden focus:border-primary-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                Posting Date *
                            </label>
                            <input 
                                id="input-transaction-date"
                                type="date" 
                                value={paymentForm.date ? paymentForm.date.split('T')[0] : ''} 
                                onChange={e => setPaymentForm({ ...paymentForm, date: e.target.value })} 
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-hidden focus:border-primary-500"
                                required
                            />
                        </div>

                        {entryMode === TransactionType.Payment && (
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                    Payment Channel / Method
                                </label>
                                <select 
                                    id="select-transaction-method"
                                    value={paymentForm.method || PaymentMethod.Cash} 
                                    onChange={e => setPaymentForm({ ...paymentForm, method: e.target.value as PaymentMethod })} 
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-hidden focus:border-primary-500"
                                >
                                    <option value={PaymentMethod.MPesa}>M-Pesa Mobile Money</option>
                                    <option value={PaymentMethod.Cash}>Cash Payment</option>
                                    <option value={PaymentMethod.Check}>Cheque / Direct Bank</option>
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                Reference / Serial Code
                            </label>
                            <input 
                                id="input-transaction-code"
                                type="text" 
                                placeholder="e.g. QDF8932XX or Bank Slip #" 
                                value={paymentForm.transactionCode || ''} 
                                onChange={e => setPaymentForm({ ...paymentForm, transactionCode: e.target.value })} 
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-semibold focus:outline-hidden focus:border-primary-500 uppercase"
                            />
                        </div>

                        <div className="col-span-1 sm:col-span-2">
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                Description / Fee Item Title
                            </label>
                            <input 
                                id="input-transaction-description"
                                type="text" 
                                placeholder="e.g. Term 1 Tuition Fee, Science Lab Kit, Boarding Fee" 
                                value={paymentForm.description || ''} 
                                onChange={e => setPaymentForm({ ...paymentForm, description: e.target.value })} 
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-hidden focus:border-primary-500"
                            />
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Sub-Modals */}
            <GenerateInvoicesModal 
                isOpen={isGenerateInvoicesModalOpen} 
                onClose={() => setIsGenerateInvoicesModalOpen(false)} 
            />

            <ReceiptModal 
                isOpen={isReceiptModalOpen} 
                onClose={() => setIsReceiptModalOpen(false)} 
                transaction={selectedTransaction} 
            />

            <FeeLedgerPrintModal
                isOpen={isLedgerPrintModalOpen}
                onClose={() => setIsLedgerPrintModalOpen(false)}
                transactions={allTransactions.length > 0 ? allTransactions : rawTransactions}
                schoolInfo={schoolInfo}
                title="Institutional Fee Collection Ledger"
            />

            <StatementModal
                isOpen={isStatementModalOpen}
                onClose={() => {
                    setIsStatementModalOpen(false);
                    setSelectedStudentForStatement(null);
                }}
                student={selectedStudentForStatement}
                transactions={allTransactions.filter((t: any) => t.studentId === selectedStudentForStatement?.id)}
                schoolInfo={schoolInfo}
                darajaSettings={darajaSettings}
            />
        </div>
    );
};

export default FeeManagementView;
