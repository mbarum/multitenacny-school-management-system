import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
    Download, 
    FileSpreadsheet, 
    FileText, 
    Database, 
    ShieldCheck, 
    HardDriveDownload, 
    Users, 
    CreditCard, 
    UserCheck, 
    Search, 
    Eye, 
    CheckCircle2, 
    Clock, 
    Filter, 
    ArrowDownToLine, 
    RefreshCw,
    Calendar,
    Layers,
    AlertTriangle
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import * as api from '../../services/api';
import type { Student, Transaction, Staff, SchoolClass } from '../../types';
import Spinner from '../common/Spinner';
import Modal from '../common/Modal';
import {
    generateStudentsCSV,
    generateFeesCSV,
    generateStaffCSV,
    generateMasterBackupCSV,
    generateStudentsPDF,
    generateFeesPDF,
    generateStaffPDF,
    generateMasterBackupPDF,
    triggerDownload,
    type BackupMetadata
} from '../../services/exportService';

const BACKUP_HISTORY_STORAGE_KEY = 'saaslink_admin_backup_history';

const DataExportBackupView: React.FC = () => {
    const { schoolInfo, addNotification, formatCurrency } = useData();

    // Queries to load complete institutional dataset
    const { data: studentsData, isLoading: isLoadingStudents, refetch: refetchStudents } = useQuery({
        queryKey: ['export-students'],
        queryFn: () => api.getStudents({ pagination: 'false' }).then((res: any) => Array.isArray(res) ? res : res.data || [])
    });

    const { data: transactionsData, isLoading: isLoadingTransactions, refetch: refetchTransactions } = useQuery({
        queryKey: ['export-transactions'],
        queryFn: () => api.getTransactions({ pagination: 'false' }).then((res: any) => Array.isArray(res) ? res : res.data || [])
    });

    const { data: staffData, isLoading: isLoadingStaff, refetch: refetchStaff } = useQuery({
        queryKey: ['export-staff'],
        queryFn: () => api.getStaff().then((res: any) => Array.isArray(res) ? res : res.data || [])
    });

    const { data: classesData = [] } = useQuery({
        queryKey: ['classes'],
        queryFn: () => api.getClasses().then((res: any) => Array.isArray(res) ? res : res.data || [])
    });

    const students: Student[] = studentsData || [];
    const transactions: Transaction[] = transactionsData || [];
    const staff: Staff[] = staffData || [];
    const classes: SchoolClass[] = classesData;

    // Filters for customized export
    const [studentClassFilter, setStudentClassFilter] = useState('ALL');
    const [studentStatusFilter, setStudentStatusFilter] = useState('ALL');

    const [feeTypeFilter, setFeeTypeFilter] = useState('ALL');
    const [feeStartDate, setFeeStartDate] = useState('');
    const [feeEndDate, setFeeEndDate] = useState('');

    const [staffRoleFilter, setStaffRoleFilter] = useState('ALL');

    // Preview modal state
    const [previewModal, setPreviewModal] = useState<{
        isOpen: boolean;
        title: string;
        domain: 'students' | 'fees' | 'staff';
        data: any[];
    }>({
        isOpen: false,
        title: '',
        domain: 'students',
        data: []
    });

    // Local audit history of downloads
    const [backupHistory, setBackupHistory] = useState<BackupMetadata[]>(() => {
        try {
            const raw = localStorage.getItem(BACKUP_HISTORY_STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    });

    const recordBackupAction = (meta: Omit<BackupMetadata, 'id' | 'timestamp'>) => {
        const entry: BackupMetadata = {
            id: `bk-${Date.now()}`,
            timestamp: new Date().toISOString(),
            ...meta
        };
        const updated = [entry, ...backupHistory.slice(0, 19)];
        setBackupHistory(updated);
        try {
            localStorage.setItem(BACKUP_HISTORY_STORAGE_KEY, JSON.stringify(updated));
        } catch {
            // Ignore storage quota errors
        }
    };

    // Filtered data calculation
    const filteredStudents = useMemo(() => {
        return students.filter(s => {
            const matchesClass = studentClassFilter === 'ALL' || s.class === studentClassFilter || s.classId === studentClassFilter;
            const matchesStatus = studentStatusFilter === 'ALL' || (s.status || 'Active').toLowerCase() === studentStatusFilter.toLowerCase();
            return matchesClass && matchesStatus;
        });
    }, [students, studentClassFilter, studentStatusFilter]);

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const matchesType = feeTypeFilter === 'ALL' || t.type === feeTypeFilter;
            const matchesStart = !feeStartDate || (t.date && t.date >= feeStartDate);
            const matchesEnd = !feeEndDate || (t.date && t.date <= feeEndDate);
            return matchesType && matchesStart && matchesEnd;
        });
    }, [transactions, feeTypeFilter, feeStartDate, feeEndDate]);

    const filteredStaff = useMemo(() => {
        const safeStaff = (Array.isArray(staff) ? staff : []).filter((st): st is Staff => Boolean(st && typeof st === 'object' && st.id));
        return safeStaff.filter(st => {
            const matchesRole = staffRoleFilter === 'ALL' || st.role === staffRoleFilter || st.userRole === staffRoleFilter;
            return matchesRole;
        });
    }, [staff, staffRoleFilter]);

    // Export Handlers
    const handleExportStudentsCSV = () => {
        const csvStr = generateStudentsCSV(filteredStudents, schoolInfo);
        const filename = `${schoolInfo?.schoolCode || 'School'}_Students_Backup_${new Date().toISOString().slice(0, 10)}.csv`;
        const blob = new Blob(['\uFEFF' + csvStr], { type: 'text/csv;charset=utf-8;' });
        triggerDownload(blob, filename);
        recordBackupAction({
            domain: 'students',
            format: 'csv',
            recordCount: filteredStudents.length,
            filename,
            fileSizeKb: Math.round(blob.size / 1024) || 1
        });
        addNotification(`Scholar Registry (${filteredStudents.length} records) exported as CSV.`, 'success');
    };

    const handleExportStudentsPDF = () => {
        const doc = generateStudentsPDF(filteredStudents, schoolInfo);
        const filename = `${schoolInfo?.schoolCode || 'School'}_Students_Backup_${new Date().toISOString().slice(0, 10)}.pdf`;
        doc.save(filename);
        recordBackupAction({
            domain: 'students',
            format: 'pdf',
            recordCount: filteredStudents.length,
            filename,
            fileSizeKb: 45
        });
        addNotification(`Scholar Registry (${filteredStudents.length} records) exported as PDF document.`, 'success');
    };

    const handleExportFeesCSV = () => {
        const csvStr = generateFeesCSV(filteredTransactions, schoolInfo);
        const filename = `${schoolInfo?.schoolCode || 'School'}_Fees_Ledger_Backup_${new Date().toISOString().slice(0, 10)}.csv`;
        const blob = new Blob(['\uFEFF' + csvStr], { type: 'text/csv;charset=utf-8;' });
        triggerDownload(blob, filename);
        recordBackupAction({
            domain: 'fees',
            format: 'csv',
            recordCount: filteredTransactions.length,
            filename,
            fileSizeKb: Math.round(blob.size / 1024) || 1
        });
        addNotification(`Financial Ledger (${filteredTransactions.length} records) exported as CSV.`, 'success');
    };

    const handleExportFeesPDF = () => {
        const doc = generateFeesPDF(filteredTransactions, schoolInfo);
        const filename = `${schoolInfo?.schoolCode || 'School'}_Fees_Ledger_Backup_${new Date().toISOString().slice(0, 10)}.pdf`;
        doc.save(filename);
        recordBackupAction({
            domain: 'fees',
            format: 'pdf',
            recordCount: filteredTransactions.length,
            filename,
            fileSizeKb: 50
        });
        addNotification(`Financial Ledger (${filteredTransactions.length} records) exported as PDF document.`, 'success');
    };

    const handleExportStaffCSV = () => {
        const csvStr = generateStaffCSV(filteredStaff, schoolInfo);
        const filename = `${schoolInfo?.schoolCode || 'School'}_Staff_Roster_Backup_${new Date().toISOString().slice(0, 10)}.csv`;
        const blob = new Blob(['\uFEFF' + csvStr], { type: 'text/csv;charset=utf-8;' });
        triggerDownload(blob, filename);
        recordBackupAction({
            domain: 'staff',
            format: 'csv',
            recordCount: filteredStaff.length,
            filename,
            fileSizeKb: Math.round(blob.size / 1024) || 1
        });
        addNotification(`Staff Roster (${filteredStaff.length} records) exported as CSV.`, 'success');
    };

    const handleExportStaffPDF = () => {
        const doc = generateStaffPDF(filteredStaff, schoolInfo);
        const filename = `${schoolInfo?.schoolCode || 'School'}_Staff_Roster_Backup_${new Date().toISOString().slice(0, 10)}.pdf`;
        doc.save(filename);
        recordBackupAction({
            domain: 'staff',
            format: 'pdf',
            recordCount: filteredStaff.length,
            filename,
            fileSizeKb: 35
        });
        addNotification(`Staff Roster (${filteredStaff.length} records) exported as PDF document.`, 'success');
    };

    const handleExportMasterCSV = () => {
        const csvStr = generateMasterBackupCSV(students, transactions, staff, schoolInfo);
        const filename = `${schoolInfo?.schoolCode || 'School'}_Master_Database_Backup_${new Date().toISOString().slice(0, 10)}.csv`;
        const blob = new Blob(['\uFEFF' + csvStr], { type: 'text/csv;charset=utf-8;' });
        triggerDownload(blob, filename);
        recordBackupAction({
            domain: 'all',
            format: 'csv',
            recordCount: students.length + transactions.length + staff.length,
            filename,
            fileSizeKb: Math.round(blob.size / 1024) || 1
        });
        addNotification('Master School Database archive exported as CSV.', 'success');
    };

    const handleExportMasterPDF = () => {
        const doc = generateMasterBackupPDF(students, transactions, staff, schoolInfo);
        const filename = `${schoolInfo?.schoolCode || 'School'}_Master_Database_Backup_${new Date().toISOString().slice(0, 10)}.pdf`;
        doc.save(filename);
        recordBackupAction({
            domain: 'all',
            format: 'pdf',
            recordCount: students.length + transactions.length + staff.length,
            filename,
            fileSizeKb: 110
        });
        addNotification('Master School Database archive exported as comprehensive PDF.', 'success');
    };

    const handleExportAllZipOrBatch = () => {
        // Trigger all three CSVs in sequence for individual file backups
        handleExportStudentsCSV();
        setTimeout(() => handleExportFeesCSV(), 400);
        setTimeout(() => handleExportStaffCSV(), 800);
        addNotification('Triggered batch download of all individual CSV archives.', 'info');
    };

    const isGlobalLoading = isLoadingStudents || isLoadingTransactions || isLoadingStaff;

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Top Overview & Master Backup Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 md:p-8 text-white shadow-xl border border-slate-700/60">
                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div className="space-y-2 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs font-bold tracking-wide uppercase">
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                            Official Administrative Data Archive & Compliance
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                            School Records Data Export & Local Backup
                        </h2>
                        <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                            Generate offline CSV spreadsheets and formal PDF document archives for institutional audit, regulatory recordkeeping, and local disaster recovery.
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-semibold text-slate-300">
                            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg">
                                <Users className="w-3.5 h-3.5 text-primary-400" />
                                {students.length} Scholars
                            </span>
                            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg">
                                <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                                {transactions.length} Fee Entries
                            </span>
                            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg">
                                <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                                {staff.length} Staff Personnel
                            </span>
                        </div>
                    </div>

                    {/* Quick Master Backup Actions */}
                    <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 w-full lg:w-auto shrink-0">
                        <button
                            id="btn-export-master-pdf"
                            onClick={handleExportMasterPDF}
                            disabled={isGlobalLoading}
                            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                        >
                            <FileText className="w-4 h-4" />
                            Download Master PDF Archive
                        </button>
                        <button
                            id="btn-export-master-csv"
                            onClick={handleExportMasterCSV}
                            disabled={isGlobalLoading}
                            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                        >
                            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                            Download Master Consolidated CSV
                        </button>
                    </div>
                </div>

                <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-12 translate-y-12">
                    <Database className="w-80 h-80 text-white" />
                </div>
            </div>

            {/* Three Core Domain Backup Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. SCHOLARS DIRECTORY CARD */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between shadow-xs hover:border-primary-500/40 transition-all">
                    <div className="space-y-4">
                        <div className="flex items-start justify-between">
                            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
                                <Users className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {filteredStudents.length} of {students.length} Records
                            </span>
                        </div>

                        <div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                Student Registry Records
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                Complete nominal roll with admission numbers, class placement, guardian contact telephone & email, emergency info, and fee balance status.
                            </p>
                        </div>

                        {/* Filter Bar */}
                        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                Filter by Class
                            </label>
                            <select
                                id="select-export-student-class"
                                value={studentClassFilter}
                                onChange={e => setStudentClassFilter(e.target.value)}
                                className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-primary-500"
                            >
                                <option value="ALL">All Classes ({students.length} Scholars)</option>
                                {classes.map(c => (
                                    <option key={c.id} value={c.name}>{c.name}</option>
                                ))}
                            </select>

                            <div className="flex gap-2 pt-1">
                                <select
                                    id="select-export-student-status"
                                    value={studentStatusFilter}
                                    onChange={e => setStudentStatusFilter(e.target.value)}
                                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-primary-500"
                                >
                                    <option value="ALL">All Statuses</option>
                                    <option value="Active">Active Enrolled</option>
                                    <option value="Graduated">Graduated</option>
                                    <option value="Suspended">Suspended</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Download Controls */}
                    <div className="pt-6 mt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                id="btn-export-students-csv-card"
                                onClick={handleExportStudentsCSV}
                                disabled={filteredStudents.length === 0}
                                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold transition-all disabled:opacity-50"
                            >
                                <FileSpreadsheet className="w-4 h-4" />
                                Export CSV
                            </button>
                            <button
                                id="btn-export-students-pdf-card"
                                onClick={handleExportStudentsPDF}
                                disabled={filteredStudents.length === 0}
                                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold transition-all disabled:opacity-50"
                            >
                                <FileText className="w-4 h-4" />
                                Export PDF
                            </button>
                        </div>
                        <button
                            id="btn-preview-students-data"
                            onClick={() => setPreviewModal({
                                isOpen: true,
                                title: `Preview Student Records (${filteredStudents.length})`,
                                domain: 'students',
                                data: filteredStudents
                            })}
                            className="w-full inline-flex items-center justify-center gap-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 text-xs font-semibold py-1 transition-colors"
                        >
                            <Eye className="w-3.5 h-3.5" />
                            Preview Records Before Download
                        </button>
                    </div>
                </div>

                {/* 2. FEES & FINANCIAL LEDGER CARD */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between shadow-xs hover:border-emerald-500/40 transition-all">
                    <div className="space-y-4">
                        <div className="flex items-start justify-between">
                            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
                                <CreditCard className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {filteredTransactions.length} of {transactions.length} Entries
                            </span>
                        </div>

                        <div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                Fees & Financial Ledger
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                Complete transactional records, M-Pesa & bank receipts, tuition invoices, student accounts, manual adjustments, and audit payment methods.
                            </p>
                        </div>

                        {/* Filter Bar */}
                        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                Transaction Type
                            </label>
                            <select
                                id="select-export-fee-type"
                                value={feeTypeFilter}
                                onChange={e => setFeeTypeFilter(e.target.value)}
                                className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-primary-500"
                            >
                                <option value="ALL">All Entries (Payments & Invoices)</option>
                                <option value="Payment">Payments & Collections Only</option>
                                <option value="Invoice">Term Invoices Only</option>
                                <option value="ManualCredit">Manual Credits</option>
                                <option value="ManualDebit">Manual Debits</option>
                            </select>

                            <div className="grid grid-cols-2 gap-2 pt-1">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">From Date</label>
                                    <input 
                                        id="input-export-fee-start"
                                        type="date" 
                                        value={feeStartDate} 
                                        onChange={e => setFeeStartDate(e.target.value)} 
                                        className="w-full text-[11px] font-medium p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">To Date</label>
                                    <input 
                                        id="input-export-fee-end"
                                        type="date" 
                                        value={feeEndDate} 
                                        onChange={e => setFeeEndDate(e.target.value)} 
                                        className="w-full text-[11px] font-medium p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Download Controls */}
                    <div className="pt-6 mt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                id="btn-export-fees-csv-card"
                                onClick={handleExportFeesCSV}
                                disabled={filteredTransactions.length === 0}
                                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold transition-all disabled:opacity-50"
                            >
                                <FileSpreadsheet className="w-4 h-4" />
                                Export CSV
                            </button>
                            <button
                                id="btn-export-fees-pdf-card"
                                onClick={handleExportFeesPDF}
                                disabled={filteredTransactions.length === 0}
                                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold transition-all disabled:opacity-50"
                            >
                                <FileText className="w-4 h-4" />
                                Export PDF
                            </button>
                        </div>
                        <button
                            id="btn-preview-fees-data"
                            onClick={() => setPreviewModal({
                                isOpen: true,
                                title: `Preview Financial Ledger Entries (${filteredTransactions.length})`,
                                domain: 'fees',
                                data: filteredTransactions
                            })}
                            className="w-full inline-flex items-center justify-center gap-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 text-xs font-semibold py-1 transition-colors"
                        >
                            <Eye className="w-3.5 h-3.5" />
                            Preview Records Before Download
                        </button>
                    </div>
                </div>

                {/* 3. STAFF & PERSONNEL CARD */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between shadow-xs hover:border-amber-500/40 transition-all">
                    <div className="space-y-4">
                        <div className="flex items-start justify-between">
                            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50">
                                <UserCheck className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {filteredStaff.length} of {staff.length} Personnel
                            </span>
                        </div>

                        <div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                Staff & Personnel Roster
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                Faculty & administration directory, designations, official email contacts, basic remuneration values, banking data, and statutory KRA/NSSF tax identifiers.
                            </p>
                        </div>

                        {/* Filter Bar */}
                        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                Filter by Designation / Role
                            </label>
                            <select
                                id="select-export-staff-role"
                                value={staffRoleFilter}
                                onChange={e => setStaffRoleFilter(e.target.value)}
                                className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-primary-500"
                            >
                                <option value="ALL">All Roles ({staff.length} Staff)</option>
                                <option value="Teacher">Teaching Faculty</option>
                                <option value="Admin">Administration</option>
                                <option value="Accountant">Finance / Bursar</option>
                                <option value="Receptionist">Front Office</option>
                            </select>

                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
                                <span className="text-slate-500">Monthly Payroll Commitment:</span>
                                <span className="font-bold text-slate-900 dark:text-white">
                                    {formatCurrency(filteredStaff.reduce((s, st) => s + (st.salary || 0), 0))}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Download Controls */}
                    <div className="pt-6 mt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                id="btn-export-staff-csv-card"
                                onClick={handleExportStaffCSV}
                                disabled={filteredStaff.length === 0}
                                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold transition-all disabled:opacity-50"
                            >
                                <FileSpreadsheet className="w-4 h-4" />
                                Export CSV
                            </button>
                            <button
                                id="btn-export-staff-pdf-card"
                                onClick={handleExportStaffPDF}
                                disabled={filteredStaff.length === 0}
                                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold transition-all disabled:opacity-50"
                            >
                                <FileText className="w-4 h-4" />
                                Export PDF
                            </button>
                        </div>
                        <button
                            id="btn-preview-staff-data"
                            onClick={() => setPreviewModal({
                                isOpen: true,
                                title: `Preview Staff Roster (${filteredStaff.length})`,
                                domain: 'staff',
                                data: filteredStaff
                            })}
                            className="w-full inline-flex items-center justify-center gap-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 text-xs font-semibold py-1 transition-colors"
                        >
                            <Eye className="w-3.5 h-3.5" />
                            Preview Records Before Download
                        </button>
                    </div>
                </div>
            </div>

            {/* Local Backup Audit & Compliance History */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Clock className="w-4 h-4 text-primary-600" />
                            Recent Local Backup Activity
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Audit log of records exported to local storage during administrative sessions.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            id="btn-batch-download-csv"
                            onClick={handleExportAllZipOrBatch}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                        >
                            <ArrowDownToLine className="w-3.5 h-3.5 text-primary-600" />
                            Download All 3 CSVs Sequentially
                        </button>
                    </div>
                </div>

                {backupHistory.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                        No backup exports recorded yet in this session. Select an export format above to generate a CSV or PDF backup file.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider">
                                <tr>
                                    <th className="py-2.5 px-4 rounded-l-lg">Time</th>
                                    <th className="py-2.5 px-4">Dataset Domain</th>
                                    <th className="py-2.5 px-4">Format</th>
                                    <th className="py-2.5 px-4">Record Count</th>
                                    <th className="py-2.5 px-4">Filename</th>
                                    <th className="py-2.5 px-4 rounded-r-lg text-right">Integrity Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                                {backupHistory.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                        <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </td>
                                        <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200 capitalize">
                                            {item.domain === 'all' ? 'Master All Records' : `${item.domain} Records`}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                                item.format === 'csv' 
                                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' 
                                                    : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                                            }`}>
                                                {item.format === 'csv' ? <FileSpreadsheet className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                                                {item.format}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                                            {item.recordCount.toLocaleString()} items
                                        </td>
                                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500 truncate max-w-xs">
                                            {item.filename}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                Archived
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Security & Data Backup Best Practices Card */}
            <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 flex items-start gap-3.5 text-xs">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-amber-900 dark:text-amber-200">
                    <p className="font-bold">Institutional Data Security & Local Archival Guidelines</p>
                    <p className="text-amber-800/90 dark:text-amber-300/80 leading-relaxed text-[11px]">
                        Exported CSV and PDF files contain sensitive scholar personal identification and salary compensation data. In accordance with National Data Protection and GDPR standards, ensure exported files are stored on encrypted institutional flash storage or secure local backup servers with restricted administrative access.
                    </p>
                </div>
            </div>

            {/* Interactive Data Preview Modal */}
            <Modal
                isOpen={previewModal.isOpen}
                onClose={() => setPreviewModal(prev => ({ ...prev, isOpen: false }))}
                title={previewModal.title}
                size="xl"
            >
                <div className="space-y-4">
                    <div className="text-xs text-slate-500">
                        Displaying first 50 sample records ready for export:
                    </div>

                    <div className="max-h-96 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                        {previewModal.domain === 'students' && (
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 sticky top-0 font-bold uppercase">
                                    <tr>
                                        <th className="p-2.5">Adm No</th>
                                        <th className="p-2.5">Name</th>
                                        <th className="p-2.5">Class</th>
                                        <th className="p-2.5">Guardian</th>
                                        <th className="p-2.5">Contact</th>
                                        <th className="p-2.5 text-right">Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {previewModal.data.slice(0, 50).map((s: Student) => (
                                        <tr key={s.id}>
                                            <td className="p-2.5 font-mono font-bold">{s.admissionNumber}</td>
                                            <td className="p-2.5 font-semibold">{s.name}</td>
                                            <td className="p-2.5">{s.class || s.classId}</td>
                                            <td className="p-2.5">{s.guardianName || '—'}</td>
                                            <td className="p-2.5">{s.guardianContact || '—'}</td>
                                            <td className="p-2.5 text-right font-bold text-slate-900 dark:text-white">
                                                {formatCurrency(s.balance || 0)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {previewModal.domain === 'fees' && (
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 sticky top-0 font-bold uppercase">
                                    <tr>
                                        <th className="p-2.5">Date</th>
                                        <th className="p-2.5">Scholar Name</th>
                                        <th className="p-2.5">Type</th>
                                        <th className="p-2.5">Method</th>
                                        <th className="p-2.5">Reference</th>
                                        <th className="p-2.5 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {previewModal.data.slice(0, 50).map((t: Transaction) => (
                                        <tr key={t.id}>
                                            <td className="p-2.5 font-mono">{t.date}</td>
                                            <td className="p-2.5 font-semibold">{t.studentName || 'General'}</td>
                                            <td className="p-2.5">{t.type}</td>
                                            <td className="p-2.5">{t.method || '—'}</td>
                                            <td className="p-2.5 font-mono">{t.transactionCode || t.checkNumber || '—'}</td>
                                            <td className="p-2.5 text-right font-bold text-slate-900 dark:text-white">
                                                {formatCurrency(t.amount || 0)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {previewModal.domain === 'staff' && (
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 sticky top-0 font-bold uppercase">
                                    <tr>
                                        <th className="p-2.5">Staff ID</th>
                                        <th className="p-2.5">Full Name</th>
                                        <th className="p-2.5">Role</th>
                                        <th className="p-2.5">Email</th>
                                        <th className="p-2.5">Bank</th>
                                        <th className="p-2.5 text-right">Basic Salary</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {previewModal.data.slice(0, 50).map((st: Staff) => (
                                        <tr key={st.id}>
                                            <td className="p-2.5 font-mono font-bold">{st.id}</td>
                                            <td className="p-2.5 font-semibold">{st.name}</td>
                                            <td className="p-2.5">{st.role}</td>
                                            <td className="p-2.5 text-slate-500">{st.email}</td>
                                            <td className="p-2.5">{st.bankName || '—'}</td>
                                            <td className="p-2.5 text-right font-bold text-slate-900 dark:text-white">
                                                {formatCurrency(st.salary || 0)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            onClick={() => setPreviewModal(prev => ({ ...prev, isOpen: false }))}
                            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold"
                        >
                            Close Preview
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default DataExportBackupView;
