import React, { useState, useMemo } from 'react';
import Modal from './Modal';
import { Student, Transaction, SchoolInfo, TransactionType } from '../../types';
import { Printer, Download, Calendar, Filter, DollarSign, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { printElement } from '../../utils/printUtility';
import { generateStudentStatementPDF } from '../../utils/statementPdfGenerator';

interface StatementModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: Student | null;
    transactions: Transaction[];
    schoolInfo: SchoolInfo | null;
    darajaSettings?: any;
}

const StatementModal: React.FC<StatementModalProps> = ({
    isOpen,
    onClose,
    student,
    transactions,
    schoolInfo,
    darajaSettings
}) => {
    if (!student) return null;

    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [filterPreset, setFilterPreset] = useState<'all' | 'term' | 'year' | '90days'>('all');
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

    const currency = schoolInfo?.currency || 'KES';
    const paybill = darajaSettings?.paybillNumber || schoolInfo?.mpesaPaybill || '522522';

    const formatCurrency = (amount: number) => {
        return `${currency} ${Number(amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // Preset handlers
    const applyPreset = (preset: 'all' | 'term' | 'year' | '90days') => {
        setFilterPreset(preset);
        const now = new Date();
        if (preset === 'all') {
            setStartDate('');
            setEndDate('');
        } else if (preset === 'year') {
            const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
            setStartDate(startOfYear);
            setEndDate(now.toISOString().split('T')[0]);
        } else if (preset === 'term') {
            // Approx 90 days / 3 months term
            const termStart = new Date(now.getFullYear(), now.getMonth() >= 4 ? (now.getMonth() >= 8 ? 8 : 4) : 0, 1).toISOString().split('T')[0];
            setStartDate(termStart);
            setEndDate(now.toISOString().split('T')[0]);
        } else if (preset === '90days') {
            const d = new Date();
            d.setDate(d.getDate() - 90);
            setStartDate(d.toISOString().split('T')[0]);
            setEndDate(now.toISOString().split('T')[0]);
        }
    };

    // Calculate opening balance, filtered transactions, and running balances
    const statementData = useMemo(() => {
        const sortedAll = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        let openingBal = 0;
        const periodTransactions: Transaction[] = [];

        sortedAll.forEach(t => {
            const txDate = t.date ? t.date.split('T')[0] : '';
            const isDebit = t.type === TransactionType.Invoice;
            const amt = Number(t.amount) || 0;

            if (startDate && txDate < startDate) {
                openingBal = isDebit ? openingBal + amt : openingBal - amt;
            } else if (!endDate || txDate <= endDate) {
                periodTransactions.push(t);
            }
        });

        let currentRunning = openingBal;
        const rowsWithBalance = periodTransactions.map(t => {
            const isDebit = t.type === TransactionType.Invoice;
            const amt = Number(t.amount) || 0;
            currentRunning = isDebit ? currentRunning + amt : currentRunning - amt;
            return {
                ...t,
                runningBalance: currentRunning
            };
        });

        const totalDebits = periodTransactions
            .filter(t => t.type === TransactionType.Invoice)
            .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

        const totalCredits = periodTransactions
            .filter(t => t.type === TransactionType.Payment)
            .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

        const closingBalance = currentRunning;

        return {
            openingBalance: openingBal,
            transactions: rowsWithBalance,
            totalDebits,
            totalCredits,
            closingBalance
        };
    }, [transactions, startDate, endDate]);

    const handlePrint = () => {
        printElement('printable-statement-document', {
            title: `Statement_${student.admissionNumber}_${student.name.replace(/\s+/g, '_')}`
        });
    };

    const handleDownloadPDF = () => {
        try {
            setIsDownloadingPdf(true);
            const doc = generateStudentStatementPDF({
                student,
                transactions: statementData.transactions,
                schoolInfo,
                startDate,
                endDate,
                openingBalance: statementData.openingBalance,
                closingBalance: statementData.closingBalance,
                darajaSettings
            });
            const filename = `Statement_${student.admissionNumber || 'SCHOLAR'}_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(filename);
        } catch (err) {
            console.error('Error generating Statement PDF:', err);
        } finally {
            setIsDownloadingPdf(false);
        }
    };

    const statementNumber = `STM-${student.admissionNumber || 'ADM'}-${new Date().getFullYear()}`;
    const generatedDateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Scholar Statement of Account"
            size="4xl"
            footer={
                <div className="flex flex-wrap items-center justify-between gap-3 w-full no-print">
                    <div className="text-xs text-slate-500 font-medium">
                        Showing {statementData.transactions.length} record(s) for {student.name}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            id="btn-download-statement-pdf"
                            type="button"
                            onClick={handleDownloadPDF}
                            disabled={isDownloadingPdf}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
                        >
                            <Download className="w-3.5 h-3.5 text-blue-600" />
                            <span>{isDownloadingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
                        </button>
                        <button
                            id="btn-print-statement-a4"
                            type="button"
                            onClick={handlePrint}
                            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-black rounded-xl shadow-xs transition-all active:scale-95"
                        >
                            <Printer className="w-4 h-4" />
                            <span>Print Statement</span>
                        </button>
                    </div>
                </div>
            }
        >
            <div className="space-y-4">
                {/* Filter Toolbar (No-Print) */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 no-print">
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 mr-1 flex items-center gap-1">
                            <Filter className="w-3.5 h-3.5 text-primary-600" />
                            Presets:
                        </span>
                        <button
                            type="button"
                            onClick={() => applyPreset('all')}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                                filterPreset === 'all'
                                    ? 'bg-primary-600 text-white shadow-xs'
                                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                            }`}
                        >
                            All Time
                        </button>
                        <button
                            type="button"
                            onClick={() => applyPreset('term')}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                                filterPreset === 'term'
                                    ? 'bg-primary-600 text-white shadow-xs'
                                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                            }`}
                        >
                            Current Term
                        </button>
                        <button
                            type="button"
                            onClick={() => applyPreset('year')}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                                filterPreset === 'year'
                                    ? 'bg-primary-600 text-white shadow-xs'
                                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                            }`}
                        >
                            Year {new Date().getFullYear()}
                        </button>
                        <button
                            type="button"
                            onClick={() => applyPreset('90days')}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                                filterPreset === '90days'
                                    ? 'bg-primary-600 text-white shadow-xs'
                                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                            }`}
                        >
                            Last 90 Days
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                            <label className="text-[11px] font-bold text-slate-500">From:</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={e => {
                                    setStartDate(e.target.value);
                                    setFilterPreset('all');
                                }}
                                className="px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                            />
                        </div>
                        <div className="flex items-center gap-1.5">
                            <label className="text-[11px] font-bold text-slate-500">To:</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={e => {
                                    setEndDate(e.target.value);
                                    setFilterPreset('all');
                                }}
                                className="px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                            />
                        </div>
                    </div>
                </div>

                {/* A4 Printable Document Paper */}
                <div className="w-full flex justify-center py-2 bg-slate-100/70 dark:bg-slate-950/40 rounded-2xl print:bg-transparent print:p-0">
                    <div
                        id="printable-statement-document"
                        className="w-full max-w-[210mm] bg-white text-slate-900 p-6 sm:p-10 shadow-sm border border-slate-200 rounded-xl print:shadow-none print:border-none print:p-0 print:m-0"
                        style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
                    >
                        {/* Top Letterhead */}
                        <div className="border-b-2 border-slate-900 pb-4 mb-5">
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                <div className="flex items-center gap-3.5">
                                    {schoolInfo?.logoUrl ? (
                                        <img
                                            src={schoolInfo.logoUrl}
                                            alt={schoolInfo.name}
                                            className="w-14 h-14 object-contain rounded-lg border border-slate-100 p-1"
                                            referrerPolicy="no-referrer"
                                        />
                                    ) : (
                                        <div className="w-14 h-14 bg-slate-900 text-white font-black text-xl flex items-center justify-center rounded-xl">
                                            {schoolInfo?.schoolCode || 'SCH'}
                                        </div>
                                    )}
                                    <div>
                                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
                                            {schoolInfo?.name || 'SaasLink Institutional Academy'}
                                        </h1>
                                        <p className="text-xs text-slate-600 font-medium mt-0.5">
                                            {schoolInfo?.address || 'P.O. Box 1024 - 00100, Nairobi, Kenya'} • Tel: {schoolInfo?.phone || '+254 700 000 000'}
                                        </p>
                                        <p className="text-[11px] text-slate-500 font-medium">
                                            Email: {schoolInfo?.email || 'accounts@school.ac.ke'} • School Code: {schoolInfo?.schoolCode || 'MOE-2026'}
                                        </p>
                                    </div>
                                </div>
                                <div className="sm:text-right">
                                    <span className="inline-block px-3 py-1 bg-primary-600 text-white text-[11px] font-black uppercase tracking-wider rounded-md">
                                        Statement of Account
                                    </span>
                                    <p className="text-xs text-slate-500 font-semibold mt-1.5">
                                        Date: {generatedDateStr}
                                    </p>
                                    <p className="text-[11px] text-slate-400 font-mono">
                                        Ref: {statementNumber}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Scholar Account Details & Status Banner */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 mb-5">
                            <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Scholar Information</div>
                                <h3 className="text-base font-black text-slate-900">{student.name}</h3>
                                <div className="text-xs text-slate-600 space-y-0.5 mt-1 font-medium">
                                    <div>Adm No: <span className="font-bold text-slate-900">{student.admissionNumber}</span> • Class: <span className="font-bold text-slate-900">{student.class}</span></div>
                                    <div>Status: <span className="font-semibold">{student.status || 'Active'}</span></div>
                                </div>
                            </div>
                            <div className="sm:text-right">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Guardian / Sponsor</div>
                                <div className="text-sm font-bold text-slate-800">{student.guardianName || 'Parent / Sponsor'}</div>
                                <div className="text-xs text-slate-600 font-medium mt-1">
                                    <div>Phone: {student.guardianContact || 'N/A'}</div>
                                    {student.guardianEmail && <div>Email: {student.guardianEmail}</div>}
                                </div>
                            </div>
                        </div>

                        {/* 4-Metric Financial Summary Strip */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                            <div className="p-3 bg-white border border-slate-200 rounded-xl">
                                <div className="text-[10px] font-bold text-slate-400 uppercase">Opening Balance</div>
                                <div className="text-sm font-black text-slate-800 mt-0.5">
                                    {formatCurrency(statementData.openingBalance)}
                                </div>
                            </div>
                            <div className="p-3 bg-white border border-slate-200 rounded-xl">
                                <div className="text-[10px] font-bold text-slate-400 uppercase">Total Invoiced (Debits)</div>
                                <div className="text-sm font-black text-slate-900 mt-0.5">
                                    {formatCurrency(statementData.totalDebits)}
                                </div>
                            </div>
                            <div className="p-3 bg-white border border-emerald-200 bg-emerald-50/40 rounded-xl">
                                <div className="text-[10px] font-bold text-emerald-700 uppercase">Total Paid (Credits)</div>
                                <div className="text-sm font-black text-emerald-700 mt-0.5">
                                    {formatCurrency(statementData.totalCredits)}
                                </div>
                            </div>
                            <div className={`p-3 rounded-xl border ${
                                statementData.closingBalance > 0
                                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                            }`}>
                                <div className="text-[10px] font-bold uppercase opacity-80">Closing Net Balance</div>
                                <div className="text-sm font-black mt-0.5">
                                    {formatCurrency(statementData.closingBalance)}
                                </div>
                            </div>
                        </div>

                        {/* Statement Itemized Ledger Table */}
                        <div className="overflow-x-auto border border-slate-200 rounded-lg mb-6">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="bg-slate-900 text-white font-bold text-[11px]">
                                        <th className="py-2.5 px-3">Date</th>
                                        <th className="py-2.5 px-3">Reference</th>
                                        <th className="py-2.5 px-3">Description</th>
                                        <th className="py-2.5 px-3 text-right">Debit (Invoiced)</th>
                                        <th className="py-2.5 px-3 text-right">Credit (Paid)</th>
                                        <th className="py-2.5 px-3 text-right">Running Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {/* Opening Balance Row */}
                                    <tr className="bg-slate-50/70 font-semibold text-slate-600">
                                        <td className="py-2 px-3">-</td>
                                        <td className="py-2 px-3 font-mono text-[10px]">B/F</td>
                                        <td className="py-2 px-3">Opening Balance (Brought Forward)</td>
                                        <td className="py-2 px-3 text-right">-</td>
                                        <td className="py-2 px-3 text-right">-</td>
                                        <td className="py-2 px-3 text-right font-bold text-slate-800">
                                            {formatCurrency(statementData.openingBalance)}
                                        </td>
                                    </tr>

                                    {statementData.transactions.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                                                No transactions recorded in this statement period.
                                            </td>
                                        </tr>
                                    ) : (
                                        statementData.transactions.map((t, idx) => {
                                            const isDebit = t.type === TransactionType.Invoice;
                                            const isEven = idx % 2 === 0;
                                            return (
                                                <tr key={t.id || idx} className={`${isEven ? 'bg-white' : 'bg-slate-50/40'} text-slate-800`}>
                                                    <td className="py-2 px-3 whitespace-nowrap font-medium text-slate-600">
                                                        {new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                    </td>
                                                    <td className="py-2 px-3 font-mono text-[10px] text-slate-500">
                                                        {t.transactionCode || t.id.slice(0, 10).toUpperCase()}
                                                    </td>
                                                    <td className="py-2 px-3 font-medium">
                                                        {t.description || (isDebit ? 'Tuition Fee Invoice' : 'Fee Payment Receipt')}
                                                        {t.method && <span className="ml-1.5 text-[10px] text-slate-400 font-normal">({t.method})</span>}
                                                    </td>
                                                    <td className="py-2 px-3 text-right font-bold text-slate-900">
                                                        {isDebit ? formatCurrency(t.amount) : '-'}
                                                    </td>
                                                    <td className="py-2 px-3 text-right font-bold text-emerald-700">
                                                        {!isDebit ? formatCurrency(t.amount) : '-'}
                                                    </td>
                                                    <td className="py-2 px-3 text-right font-bold text-slate-900">
                                                        {formatCurrency(t.runningBalance)}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                                        <td colSpan={3} className="py-2.5 px-3 text-right uppercase tracking-wider text-[11px]">
                                            Period Totals:
                                        </td>
                                        <td className="py-2.5 px-3 text-right text-slate-900 text-xs">
                                            {formatCurrency(statementData.totalDebits)}
                                        </td>
                                        <td className="py-2.5 px-3 text-right text-emerald-800 text-xs">
                                            {formatCurrency(statementData.totalCredits)}
                                        </td>
                                        <td className={`py-2.5 px-3 text-right text-xs font-black ${
                                            statementData.closingBalance > 0 ? 'text-rose-700' : 'text-emerald-700'
                                        }`}>
                                            {formatCurrency(statementData.closingBalance)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Payment Settlement Instructions */}
                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 mb-6 text-xs">
                            <div className="font-bold text-slate-900 uppercase text-[11px] mb-1.5">Official Fee Settlement Channels</div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                                <div>
                                    <span className="font-semibold text-emerald-700">M-Pesa Paybill:</span> {paybill} • <span className="font-semibold">Account:</span> <span className="font-mono font-bold text-slate-900">{student.admissionNumber}</span> (Scholar Adm No.)
                                </div>
                                <div>
                                    <span className="font-semibold text-blue-700">Bank Transfer:</span> Equity Bank Kenya • <span className="font-semibold">Account:</span> 0180293847291 • <span className="font-semibold">Branch:</span> Supreme
                                </div>
                            </div>
                        </div>

                        {/* Authorized Signatures & Verification */}
                        <div className="border-t border-slate-200 pt-6 mt-6 break-inside-avoid">
                            <p className="text-[11px] text-slate-500 italic mb-6">
                                This statement is an official certified excerpt of the student fee ledger maintained by {schoolInfo?.name || 'SaasLink Institutional Academy'}.
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs text-slate-600">
                                <div>
                                    <div className="border-b border-slate-400 pb-1 mb-1 font-bold text-slate-800">
                                        Accounts Officer / Bursar
                                    </div>
                                    <p className="text-[10px] text-slate-500">Signature & Stamp</p>
                                </div>
                                <div>
                                    <div className="border-b border-slate-400 pb-1 mb-1 font-bold text-slate-800">
                                        Principal / Headteacher
                                    </div>
                                    <p className="text-[10px] text-slate-500">Authorization & Date</p>
                                </div>
                                <div className="text-right sm:text-left">
                                    <div className="border-b border-slate-400 pb-1 mb-1 font-bold text-slate-800">
                                        Official School Seal
                                    </div>
                                    <p className="text-[10px] text-slate-500">Institutional Seal</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default StatementModal;
