import React, { useMemo } from 'react';
import Modal from './Modal';
import { Transaction, SchoolInfo, TransactionType, PaymentMethod } from '../../types';
import { Printer, Download, FileSpreadsheet, X, CheckCircle2, DollarSign, Smartphone, Landmark, Wallet } from 'lucide-react';
import { printElement } from '../../utils/printUtility';
import { generateFeesPDF, generateFeesCSV, triggerDownload } from '../../services/exportService';

interface FeeLedgerPrintModalProps {
    isOpen: boolean;
    onClose: () => void;
    transactions: Transaction[];
    schoolInfo: SchoolInfo | null;
    title?: string;
    filterSummary?: {
        classFilter?: string;
        typeFilter?: string;
        dateRange?: string;
        searchQuery?: string;
    };
}

const FeeLedgerPrintModal: React.FC<FeeLedgerPrintModalProps> = ({
    isOpen,
    onClose,
    transactions,
    schoolInfo,
    title,
    filterSummary
}) => {
    const currency = schoolInfo?.currency || 'KES';

    const formatCurrency = (val: number) => {
        return `${currency} ${Number(val || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const metrics = useMemo(() => {
        const totalInvoiced = transactions
            .filter(t => t.type === TransactionType.Invoice)
            .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

        const totalCollected = transactions
            .filter(t => t.type === TransactionType.Payment)
            .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

        const mpesaTotal = transactions
            .filter(t => t.type === TransactionType.Payment && (t.method === PaymentMethod.MPesa || (!t.method && t.transactionCode?.startsWith('MP-'))))
            .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

        const bankTotal = transactions
            .filter(t => t.type === TransactionType.Payment && ((t.method as any) === 'Bank' || t.method === PaymentMethod.Check))
            .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

        const cashTotal = transactions
            .filter(t => t.type === TransactionType.Payment && t.method === PaymentMethod.Cash)
            .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

        const netDifference = totalInvoiced - totalCollected;

        return {
            totalInvoiced,
            totalCollected,
            mpesaTotal,
            bankTotal,
            cashTotal,
            netDifference,
            count: transactions.length
        };
    }, [transactions]);

    const handlePrint = () => {
        printElement('printable-fee-ledger', {
            title: `${schoolInfo?.name || 'School'}_Institutional_Fee_Ledger_${new Date().toISOString().split('T')[0]}`
        });
    };

    const handleDownloadPDF = () => {
        const doc = generateFeesPDF(transactions, schoolInfo);
        const filename = `${schoolInfo?.schoolCode || 'School'}_Fees_Ledger_${new Date().toISOString().slice(0, 10)}.pdf`;
        doc.save(filename);
    };

    const handleExportCSV = () => {
        const csv = generateFeesCSV(transactions, schoolInfo);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        triggerDownload(blob, `Institutional_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Institutional Fee Ledger Audit Statement"
            size="4xl"
            footer={
                <div className="flex flex-wrap items-center justify-between gap-3 w-full no-print">
                    <div className="text-xs font-semibold text-slate-500">
                        {transactions.length} Ledger entries selected for print & archival
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            id="btn-print-modal-csv"
                            type="button"
                            onClick={handleExportCSV}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 transition-all active:scale-95"
                        >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Export CSV</span>
                        </button>
                        <button
                            id="btn-print-modal-pdf"
                            type="button"
                            onClick={handleDownloadPDF}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 transition-all active:scale-95"
                        >
                            <Download className="w-3.5 h-3.5 text-blue-600" />
                            <span>Download PDF</span>
                        </button>
                        <button
                            id="btn-print-modal-execute"
                            type="button"
                            onClick={handlePrint}
                            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-black rounded-xl shadow-xs transition-all active:scale-95"
                        >
                            <Printer className="w-4 h-4" />
                            <span>Print Ledger</span>
                        </button>
                    </div>
                </div>
            }
        >
            <div className="w-full flex justify-center py-2 bg-slate-100/70 dark:bg-slate-950/40 rounded-2xl print:bg-transparent print:p-0">
                <div
                    id="printable-fee-ledger"
                    className="w-full max-w-[210mm] bg-white text-slate-900 p-6 sm:p-10 shadow-sm border border-slate-200 rounded-xl print:shadow-none print:border-none print:p-0 print:m-0"
                    style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
                >
                    {/* Header Strip */}
                    <div className="border-b-2 border-slate-900 pb-4 mb-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
                                <span className="inline-block px-3 py-1 bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider rounded-md">
                                    Official Fee Ledger
                                </span>
                                <p className="text-xs text-slate-500 font-semibold mt-1.5">
                                    Generated: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </p>
                                <p className="text-[11px] text-slate-400 font-mono">
                                    Ref: LED-{new Date().getFullYear()}-{Math.floor(1000 + Math.random() * 9000)}
                                </p>
                            </div>
                        </div>

                        {/* Filter Scope Tags */}
                        {filterSummary && (
                            <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                                <span className="font-bold text-slate-900">Ledger Scope:</span>
                                {filterSummary.classFilter && (
                                    <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-medium">
                                        Class: {filterSummary.classFilter}
                                    </span>
                                )}
                                {filterSummary.typeFilter && (
                                    <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-medium">
                                        Type: {filterSummary.typeFilter}
                                    </span>
                                )}
                                {filterSummary.dateRange && (
                                    <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-medium">
                                        Date: {filterSummary.dateRange}
                                    </span>
                                )}
                                <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-semibold ml-auto">
                                    Total Records: {transactions.length}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Financial KPI Summary Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Invoiced (Debits)</div>
                            <div className="text-base font-black text-slate-900 mt-1">{formatCurrency(metrics.totalInvoiced)}</div>
                        </div>
                        <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
                            <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Total Collected (Credits)</div>
                            <div className="text-base font-black text-emerald-800 mt-1">{formatCurrency(metrics.totalCollected)}</div>
                        </div>
                        <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-200">
                            <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">M-Pesa Collections</div>
                            <div className="text-base font-black text-blue-800 mt-1">{formatCurrency(metrics.mpesaTotal)}</div>
                        </div>
                        <div className={`p-3.5 rounded-xl border ${metrics.netDifference > 0 ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
                            <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">Net Balance Variance</div>
                            <div className="text-base font-black mt-1">{formatCurrency(metrics.netDifference)}</div>
                        </div>
                    </div>

                    {/* Itemized Table */}
                    <div className="overflow-x-auto border border-slate-200 rounded-lg mb-6">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-slate-900 text-white font-bold text-[11px]">
                                    <th className="py-2.5 px-3">Date</th>
                                    <th className="py-2.5 px-3">Ref Code</th>
                                    <th className="py-2.5 px-3">Scholar Name</th>
                                    <th className="py-2.5 px-3">Class</th>
                                    <th className="py-2.5 px-3">Type</th>
                                    <th className="py-2.5 px-3">Method</th>
                                    <th className="py-2.5 px-3 text-right">Debit (Dr)</th>
                                    <th className="py-2.5 px-3 text-right">Credit (Cr)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                                            No ledger transactions found matching the selected filter scope.
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((t, idx) => {
                                        const isInvoice = t.type === TransactionType.Invoice;
                                        const isEven = idx % 2 === 0;
                                        return (
                                            <tr key={t.id || idx} className={`${isEven ? 'bg-white' : 'bg-slate-50/60'} text-slate-800`}>
                                                <td className="py-2 px-3 whitespace-nowrap font-medium text-slate-600">
                                                    {new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                </td>
                                                <td className="py-2 px-3 font-mono text-[10px] text-slate-500">
                                                    {t.transactionCode || t.id.slice(0, 10).toUpperCase()}
                                                </td>
                                                <td className="py-2 px-3 font-semibold text-slate-900">
                                                    {t.studentName || 'Unassigned'}
                                                </td>
                                                <td className="py-2 px-3 text-slate-600">
                                                    {(t as any).studentClass || (t as any).class || '-'}
                                                </td>
                                                <td className="py-2 px-3">
                                                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                                        isInvoice ? 'bg-slate-100 text-slate-700' : 'bg-emerald-100 text-emerald-800'
                                                    }`}>
                                                        {isInvoice ? 'Invoice' : 'Payment'}
                                                    </span>
                                                </td>
                                                <td className="py-2 px-3 text-slate-600 text-[11px]">
                                                    {t.method || (isInvoice ? 'Tuition Bill' : '-')}
                                                </td>
                                                <td className="py-2 px-3 text-right font-bold text-slate-900">
                                                    {isInvoice ? formatCurrency(t.amount) : '-'}
                                                </td>
                                                <td className="py-2 px-3 text-right font-bold text-emerald-700">
                                                    {!isInvoice ? formatCurrency(t.amount) : '-'}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                            <tfoot>
                                <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                                    <td colSpan={6} className="py-2.5 px-3 text-right uppercase tracking-wider text-[11px]">
                                        Grand Totals:
                                    </td>
                                    <td className="py-2.5 px-3 text-right text-slate-900 text-xs">
                                        {formatCurrency(metrics.totalInvoiced)}
                                    </td>
                                    <td className="py-2.5 px-3 text-right text-emerald-800 text-xs">
                                        {formatCurrency(metrics.totalCollected)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Breakdown by Settlement Channel */}
                    <div className="grid grid-cols-3 gap-3 mb-8 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                        <div className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
                            <div>
                                <div className="text-[10px] text-slate-500 font-bold uppercase">M-Pesa Settlements</div>
                                <div className="font-bold text-slate-900">{formatCurrency(metrics.mpesaTotal)}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Landmark className="w-4 h-4 text-blue-600 shrink-0" />
                            <div>
                                <div className="text-[10px] text-slate-500 font-bold uppercase">Bank Direct Deposits</div>
                                <div className="font-bold text-slate-900">{formatCurrency(metrics.bankTotal)}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Wallet className="w-4 h-4 text-slate-600 shrink-0" />
                            <div>
                                <div className="text-[10px] text-slate-500 font-bold uppercase">Cash / Counter Receipts</div>
                                <div className="font-bold text-slate-900">{formatCurrency(metrics.cashTotal)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Certification & Authorization Block */}
                    <div className="border-t border-slate-200 pt-6 mt-6 break-inside-avoid">
                        <p className="text-[11px] text-slate-500 italic mb-6">
                            This is an official financial ledger audit report generated by the SaasLink Institutional School Management System. 
                            All figures reflect recorded student billing invoices, cash, bank, and reconciled M-Pesa fee receipts.
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs text-slate-600">
                            <div>
                                <div className="border-b border-slate-400 pb-1 mb-1 font-bold text-slate-800">
                                    Accounts Officer / Bursar
                                </div>
                                <p className="text-[10px] text-slate-500">Signature & Date</p>
                            </div>
                            <div>
                                <div className="border-b border-slate-400 pb-1 mb-1 font-bold text-slate-800">
                                    Principal / Head of Institution
                                </div>
                                <p className="text-[10px] text-slate-500">Authorization & Date</p>
                            </div>
                            <div className="text-right sm:text-left">
                                <div className="border-b border-slate-400 pb-1 mb-1 font-bold text-slate-800">
                                    Official Rubber Stamp Seal
                                </div>
                                <p className="text-[10px] text-slate-500">Institution Verification</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default FeeLedgerPrintModal;
