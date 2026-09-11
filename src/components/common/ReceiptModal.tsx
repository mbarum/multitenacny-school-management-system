import React, { useMemo, useState } from 'react';
import Modal from './Modal';
import { Transaction, Student, TransactionType } from '../../types';
import { useData } from '../../contexts/DataContext';
import { 
    FinancialDocument, 
    buildDocumentFromTransaction, 
    downloadDocumentAsPDF 
} from '../../utils/invoiceReceiptGenerator';
import FinancialDocumentView from './FinancialDocumentView';
import { Download, Printer, FileText, CheckCircle2 } from 'lucide-react';

interface ReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction?: Transaction | null;
    document?: FinancialDocument | null;
    student?: Student | null;
    studentBalance?: number;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({ 
    isOpen, 
    onClose, 
    transaction, 
    document: customDocument, 
    student: customStudent,
    studentBalance 
}) => {
    const { schoolInfo, darajaSettings, students } = useData();
    const [isDownloading, setIsDownloading] = useState(false);
    const [documentTypeOverride, setDocumentTypeOverride] = useState<'INVOICE' | 'RECEIPT' | null>(null);

    // Resolve student record if not directly passed
    const resolvedStudent = useMemo(() => {
        if (customStudent) return customStudent;
        if (!transaction) return null;
        return students.find(s => s.id === transaction.studentId || s.name === transaction.studentName) || null;
    }, [customStudent, transaction, students]);

    // Build the FinancialDocument
    const financialDoc: FinancialDocument | null = useMemo(() => {
        if (customDocument) return customDocument;
        if (!transaction || !schoolInfo) return null;

        const doc = buildDocumentFromTransaction(
            transaction,
            schoolInfo,
            resolvedStudent,
            darajaSettings,
            studentBalance
        );

        if (documentTypeOverride && doc.type !== documentTypeOverride) {
            return {
                ...doc,
                type: documentTypeOverride,
                status: documentTypeOverride === 'RECEIPT' ? 'PAID' : 'DUE'
            };
        }

        return doc;
    }, [customDocument, transaction, schoolInfo, resolvedStudent, darajaSettings, studentBalance, documentTypeOverride]);

    if (!financialDoc) return null;

    const isReceipt = financialDoc.type === 'RECEIPT';

    const handleDownloadPdf = async () => {
        if (!financialDoc) return;
        try {
            setIsDownloading(true);
            await downloadDocumentAsPDF(financialDoc);
        } catch (error) {
            console.error('Failed to generate PDF document:', error);
        } finally {
            setIsDownloading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={isReceipt ? 'Official Payment Receipt' : 'Academic Fee Invoice'} 
            size="3xl"
            footer={
                <div className="flex flex-wrap items-center justify-between gap-3 w-full no-print">
                    {/* View Switcher (Invoice vs Receipt) */}
                    <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <button
                            id="btn-toggle-doc-receipt"
                            type="button"
                            onClick={() => setDocumentTypeOverride('RECEIPT')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                isReceipt 
                                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs' 
                                    : 'text-slate-500 hover:text-slate-900'
                            }`}
                        >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Receipt View</span>
                        </button>
                        <button
                            id="btn-toggle-doc-invoice"
                            type="button"
                            onClick={() => setDocumentTypeOverride('INVOICE')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                !isReceipt 
                                    ? 'bg-white dark:bg-slate-900 text-primary-700 dark:text-primary-400 shadow-xs' 
                                    : 'text-slate-500 hover:text-slate-900'
                            }`}
                        >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Invoice View</span>
                        </button>
                    </div>

                    {/* Download & Print Buttons */}
                    <div className="flex items-center gap-2">
                        <button 
                            id="btn-modal-download-pdf"
                            type="button"
                            onClick={handleDownloadPdf} 
                            disabled={isDownloading}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50"
                        >
                            <Download className="w-4 h-4" />
                            <span>{isDownloading ? 'Building PDF...' : 'Download PDF'}</span>
                        </button>

                        <button 
                            id="btn-modal-print-a4"
                            type="button"
                            onClick={handlePrint} 
                            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95"
                        >
                            <Printer className="w-4 h-4" />
                            <span>Print A4</span>
                        </button>
                    </div>
                </div>
            }
        >
            <div className="w-full flex justify-center py-2 sm:py-4 bg-slate-100/70 dark:bg-slate-950/50 rounded-2xl print:bg-transparent print:p-0">
                <FinancialDocumentView 
                    document={financialDoc}
                    onPrint={handlePrint}
                    onDownloadPdf={handleDownloadPdf}
                    showActionsToolbar={false}
                />
            </div>
        </Modal>
    );
};

export default ReceiptModal;
