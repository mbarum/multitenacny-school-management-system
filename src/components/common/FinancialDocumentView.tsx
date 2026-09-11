import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { 
    CheckCircle2, 
    FileText, 
    Phone, 
    Mail, 
    MapPin, 
    Building, 
    CreditCard, 
    Smartphone, 
    Banknote, 
    Calendar, 
    ShieldCheck, 
    Download, 
    Printer,
    Info,
    Clock
} from 'lucide-react';
import type { FinancialDocument } from '../../utils/invoiceReceiptGenerator';
import html2canvas from 'html2canvas';

interface FinancialDocumentViewProps {
    document: FinancialDocument;
    onPrint?: () => void;
    onDownloadPdf?: () => void;
    showActionsToolbar?: boolean;
}

export const FinancialDocumentView: React.FC<FinancialDocumentViewProps> = ({
    document: doc,
    onPrint,
    onDownloadPdf,
    showActionsToolbar = true
}) => {
    const [qrDataUrl, setQrDataUrl] = useState<string>('');
    const [isDownloadingImage, setIsDownloadingImage] = useState(false);
    const documentRef = useRef<HTMLDivElement>(null);

    const isReceipt = doc.type === 'RECEIPT';

    useEffect(() => {
        let isMounted = true;
        if (doc.verificationQrPayload) {
            QRCode.toDataURL(doc.verificationQrPayload, {
                errorCorrectionLevel: 'M',
                margin: 1,
                width: 160,
                color: {
                    dark: isReceipt ? '#065F46' : '#1E3A8A',
                    light: '#FFFFFF'
                }
            }).then(url => {
                if (isMounted) setQrDataUrl(url);
            }).catch(err => {
                console.warn('QR code generation error:', err);
            });
        }
        return () => { isMounted = false; };
    }, [doc.verificationQrPayload, isReceipt]);

    const handleDownloadPng = async () => {
        if (!documentRef.current) return;
        try {
            setIsDownloadingImage(true);
            const canvas = await html2canvas(documentRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
                windowWidth: 1200
            });
            const imgData = canvas.toDataURL('image/png');
            const link = window.document.createElement('a');
            link.download = `${doc.type}_${doc.documentNumber}_${doc.student.admissionNumber}.png`;
            link.href = imgData;
            link.click();
        } catch (error) {
            console.error('Failed to export document image:', error);
        } finally {
            setIsDownloadingImage(false);
        }
    };

    return (
        <div className="flex flex-col items-center w-full">
            {/* Action Bar (Hidden in Print) */}
            {showActionsToolbar && (
                <div className="no-print w-full max-w-[850px] mb-4 flex flex-wrap items-center justify-between gap-3 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-md">
                    <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${isReceipt ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            {isReceipt ? <CheckCircle2 className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-wider">
                                {isReceipt ? 'Official Payment Receipt' : 'Academic Fee Invoice'}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono">
                                Ref: {doc.documentNumber} • {doc.student.name}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {onDownloadPdf && (
                            <button
                                id="btn-doc-download-pdf"
                                type="button"
                                onClick={onDownloadPdf}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
                                title="Download high-resolution A4 vector PDF"
                            >
                                <Download className="w-3.5 h-3.5" />
                                <span>Download PDF</span>
                            </button>
                        )}

                        <button
                            id="btn-doc-download-png"
                            type="button"
                            onClick={handleDownloadPng}
                            disabled={isDownloadingImage}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
                            title="Save as PNG image"
                        >
                            <Download className="w-3.5 h-3.5 text-slate-400" />
                            <span>{isDownloadingImage ? 'Generating...' : 'Save PNG'}</span>
                        </button>

                        <button
                            id="btn-doc-print-native"
                            type="button"
                            onClick={onPrint || (() => window.print())}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
                            title="Print formatted A4 sheet"
                        >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print A4</span>
                        </button>
                    </div>
                </div>
            )}

            {/* A4 Document Container */}
            <div 
                ref={documentRef}
                id="printable-financial-document"
                className="financial-a4-sheet bg-white text-slate-800 w-full max-w-[800px] p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xl relative flex flex-col justify-between select-text"
                style={{
                    boxSizing: 'border-box',
                    fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
                }}
            >
                {/* Print-specific style rules */}
                <style>{`
                    @media print {
                        @page {
                            size: A4 portrait;
                            margin: 6mm 8mm;
                        }
                        html, body {
                            background: white !important;
                            color: black !important;
                            padding: 0 !important;
                            margin: 0 !important;
                            height: 100% !important;
                        }
                        .no-print, nav, aside, header, .no-print-backdrop {
                            display: none !important;
                        }
                        .financial-a4-sheet {
                            border: none !important;
                            box-shadow: none !important;
                            border-radius: 0 !important;
                            padding: 4mm 6mm !important;
                            margin: 0 auto !important;
                            max-width: 100% !important;
                            width: 100% !important;
                            min-height: auto !important;
                            height: auto !important;
                            page-break-inside: avoid !important;
                            break-inside: avoid !important;
                        }
                        tr, .break-inside-avoid {
                            page-break-inside: avoid !important;
                            break-inside: avoid !important;
                        }
                    }
                `}</style>

                {/* Top Accent Strip */}
                <div className={`absolute top-0 left-0 right-0 h-2.5 rounded-t-2xl sm:rounded-t-3xl ${isReceipt ? 'bg-emerald-600' : 'bg-primary-700'}`} />

                <div>
                    {/* Header Section */}
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-3 pb-3.5 border-b border-slate-200">
                        {/* School Info */}
                        <div className="flex items-start gap-3">
                            {doc.school.logoUrl ? (
                                <img 
                                    src={doc.school.logoUrl} 
                                    alt={doc.school.name} 
                                    className="w-12 h-12 object-contain rounded-xl border border-slate-200 bg-white p-1 shrink-0"
                                />
                            ) : (
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-base text-white shrink-0 ${isReceipt ? 'bg-emerald-700' : 'bg-primary-700'}`}>
                                    {doc.school.schoolCode || doc.school.name.slice(0, 3).toUpperCase()}
                                </div>
                            )}

                            <div>
                                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight uppercase leading-tight">
                                    {doc.school.name}
                                </h1>
                                <p className="text-[11px] text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span>{doc.school.address}</span>
                                </p>
                                <div className="text-[11px] text-slate-500 font-medium mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
                                    <span className="flex items-center gap-1">
                                        <Phone className="w-3 h-3 text-slate-400" />
                                        {doc.school.phone}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Mail className="w-3 h-3 text-slate-400" />
                                        {doc.school.email}
                                    </span>
                                    {doc.school.taxPin && (
                                        <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                                            KRA PIN: {doc.school.taxPin}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Document Type Badge & Identifiers */}
                        <div className="text-left sm:text-right shrink-0 w-full sm:w-auto">
                            <div className="inline-flex items-center gap-1.5 mb-1">
                                <span className={`px-3 py-1 rounded-lg font-black text-xs uppercase tracking-wider text-white shadow-xs ${isReceipt ? 'bg-emerald-600' : 'bg-primary-700'}`}>
                                    {isReceipt ? 'Official Receipt' : 'Tuition Fee Invoice'}
                                </span>
                            </div>

                            <div className="space-y-0.5 text-xs">
                                <p className="font-mono font-bold text-slate-800">
                                    <span className="text-slate-400 font-normal uppercase text-[9px] tracking-wider mr-1">No:</span>
                                    {doc.documentNumber}
                                </p>
                                <p className="text-slate-600">
                                    <span className="text-slate-400 font-normal uppercase text-[9px] tracking-wider mr-1">Date:</span>
                                    {doc.date}
                                </p>
                                {doc.dueDate && (
                                    <p className="text-slate-600">
                                        <span className="text-slate-400 font-normal uppercase text-[9px] tracking-wider mr-1">Due Date:</span>
                                        <span className="font-bold text-red-600">{doc.dueDate}</span>
                                    </p>
                                )}
                                {doc.referenceCode && (
                                    <p className="font-mono text-emerald-700 font-bold">
                                        <span className="text-slate-400 font-normal uppercase text-[9px] tracking-wider mr-1">Txn Ref:</span>
                                        {doc.referenceCode}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Metadata Two-Column Card */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-3">
                        {/* Student Details Card */}
                        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">
                                {isReceipt ? 'Payment Received From (Scholar)' : 'Billed To (Scholar)'}
                            </p>
                            <h2 className="text-sm font-black text-slate-900">
                                {doc.student.name}
                            </h2>
                            <div className="mt-1.5 space-y-0.5 text-[11px] text-slate-600">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Admission No:</span>
                                    <span className="font-mono font-bold text-slate-800">{doc.student.admissionNumber}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Class / Stream:</span>
                                    <span className="font-bold text-slate-800">{doc.student.class}</span>
                                </div>
                                {doc.student.guardianName && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Parent / Guardian:</span>
                                        <span className="text-slate-700 truncate max-w-[170px]">{doc.student.guardianName} ({doc.student.guardianContact || 'N/A'})</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Status & Settlement Method Card */}
                        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-col justify-between">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">
                                    Transaction & Settlement Status
                                </p>
                                <div className="flex items-center gap-2">
                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider ${
                                        isReceipt 
                                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                                    }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${isReceipt ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                                        {doc.status}
                                    </span>
                                    <span className="text-[11px] font-semibold text-slate-500">
                                        Currency: <strong className="text-slate-800">{doc.currency}</strong>
                                    </span>
                                </div>
                            </div>

                            <div className="mt-2 pt-1.5 border-t border-slate-200/60 text-[11px] text-slate-600 space-y-0.5">
                                {isReceipt && doc.settlementMethod ? (
                                    <>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Payment Channel:</span>
                                            <span className="font-bold text-emerald-700">{doc.settlementMethod.method}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Receipt Ref:</span>
                                            <span className="font-mono font-bold text-slate-800">{doc.settlementMethod.referenceCode}</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Payment Term:</span>
                                            <span className="font-semibold text-slate-700">Due Upon Receipt</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Late Settlement:</span>
                                            <span className="text-slate-700">Subject to School Policy</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Line Items Table */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden my-3">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-wider">
                                    <th className="py-2 px-3 w-10 text-center">#</th>
                                    <th className="py-2 px-3">Item & Description</th>
                                    <th className="py-2 px-3 w-16 text-center">Qty</th>
                                    <th className="py-2 px-3 w-28 text-right">Unit Rate ({doc.currency})</th>
                                    <th className="py-2 px-3 w-32 text-right">Amount ({doc.currency})</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                                {doc.items.map((item, idx) => (
                                    <tr key={item.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                        <td className="py-2 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                                        <td className="py-2 px-3">
                                            <div className="font-bold text-slate-900">{item.description}</div>
                                            {item.category && (
                                                <div className="text-[9px] text-slate-400 font-normal uppercase tracking-wider">
                                                    Category: {item.category}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-2 px-3 text-center">{item.quantity}</td>
                                        <td className="py-2 px-3 text-right font-mono">{item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Financial Totals Strip */}
                        <div className="bg-slate-50/80 p-3 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-end sm:items-center gap-2">
                            <div className="text-[11px] text-slate-500 font-medium">
                                <span>Total items listed: <strong>{doc.items.length}</strong></span>
                            </div>

                            <div className="w-full sm:w-72 space-y-1 text-xs">
                                <div className="flex justify-between text-slate-600">
                                    <span>Subtotal:</span>
                                    <span className="font-mono font-bold">{doc.currency} {doc.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                </div>

                                {isReceipt ? (
                                    <>
                                        <div className="flex justify-between text-emerald-700 font-black text-xs pt-1 border-t border-slate-200">
                                            <span>Amount Settled:</span>
                                            <span className="font-mono">{doc.currency} {(doc.amountPaid || doc.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        {doc.balanceDue !== undefined && (
                                            <div className="flex justify-between text-slate-700 font-bold pt-0.5 text-xs">
                                                <span>Remaining Student Balance:</span>
                                                <span className={`font-mono ${doc.balanceDue > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                                    {doc.currency} {doc.balanceDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <div className="flex justify-between text-slate-900 font-black text-xs pt-1 border-t border-slate-200">
                                            <span>Total Invoice Amount:</span>
                                            <span className="font-mono text-primary-700">{doc.currency} {doc.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        {doc.balanceDue !== undefined && doc.balanceDue !== doc.total && (
                                            <div className="flex justify-between text-slate-600 font-bold pt-0.5 text-xs">
                                                <span>Net Account Balance:</span>
                                                <span className="font-mono">{doc.currency} {doc.balanceDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* PAYMENT METHODS SECTION - PROMINENT & COMPACT */}
                    <div className="my-3 p-3 rounded-xl border border-slate-200 bg-slate-50/60 break-inside-avoid">
                        <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-slate-200">
                            <CreditCard className={`w-3.5 h-3.5 ${isReceipt ? 'text-emerald-700' : 'text-primary-700'}`} />
                            <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-800">
                                {isReceipt ? 'Official Payment Channels (For Outstanding / Future Fees)' : 'How To Pay / Authorized Payment Methods'}
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
                            {/* Option 1: Lipa na M-Pesa */}
                            <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center gap-1 text-emerald-700 font-black text-[11px] mb-1.5">
                                        <Smartphone className="w-3.5 h-3.5" />
                                        <span>1. LIPA NA M-PESA</span>
                                    </div>
                                    <div className="space-y-0.5 mb-1.5">
                                        <div className="flex justify-between items-center text-[10px]">
                                            <span className="text-slate-500">Paybill:</span>
                                            <span className="font-mono font-black text-slate-900 text-[11px] px-1 bg-emerald-50 text-emerald-800 rounded">
                                                {doc.paymentChannels.mpesa.paybill}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px]">
                                            <span className="text-slate-500">Account:</span>
                                            <span className="font-mono font-black text-slate-900 text-[11px] px-1 bg-slate-100 rounded">
                                                {doc.paymentChannels.mpesa.accountNumber}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-[9px] text-slate-500 space-y-0.5 border-t border-slate-100 pt-1 font-medium leading-tight">
                                    <p>• Paybill &gt; {doc.paymentChannels.mpesa.paybill} &gt; Acc: {doc.paymentChannels.mpesa.accountNumber}</p>
                                    <p>• Enter amount &amp; PIN to confirm</p>
                                </div>
                            </div>

                            {/* Option 2: Direct Bank Transfer */}
                            <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center gap-1 text-primary-700 font-black text-[11px] mb-1.5">
                                        <Building className="w-3.5 h-3.5" />
                                        <span>2. DIRECT BANK DEPOSIT</span>
                                    </div>
                                    <div className="space-y-0.5 text-[10px] mb-1.5">
                                        <div className="truncate">
                                            <span className="text-slate-500">Bank:</span>{' '}
                                            <strong className="text-slate-800">{doc.paymentChannels.bank.bankName}</strong>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500">A/C:</span>
                                            <span className="font-mono font-black text-slate-900 text-[11px] px-1 bg-blue-50 text-blue-800 rounded">
                                                {doc.paymentChannels.bank.accountNumber}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-[9px] text-slate-500 border-t border-slate-100 pt-1 font-medium leading-tight">
                                    <p>Branch: {doc.paymentChannels.bank.branch}</p>
                                    <p>Ref: <strong className="font-mono text-slate-700">{doc.paymentChannels.bank.reference}</strong></p>
                                </div>
                            </div>

                            {/* Option 3: Cheques & Cash Desk */}
                            <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center gap-1 text-slate-800 font-black text-[11px] mb-1.5">
                                        <Banknote className="w-3.5 h-3.5 text-slate-600" />
                                        <span>3. CHEQUE & CASHIER</span>
                                    </div>
                                    <div className="text-[10px] text-slate-600 space-y-0.5 mb-1.5">
                                        <p className="truncate">Payable to: <strong className="text-slate-900">{doc.paymentChannels.cashCheque.payableTo}</strong></p>
                                        <p className="flex items-center gap-1 text-[9px] text-slate-500">
                                            <Clock className="w-3 h-3" />
                                            {doc.paymentChannels.cashCheque.hours}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-[9px] text-slate-500 border-t border-slate-100 pt-1 font-medium leading-tight">
                                    <p>• Write Admission No on back of cheque</p>
                                    <p>• Official printed receipt issued at desk</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Section: Verification QR, Signatory Line & School Stamp */}
                <div className="pt-3 border-t border-slate-200 break-inside-avoid">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        {/* QR Code Verification Block */}
                        <div className="flex items-center gap-2.5 w-full sm:w-auto">
                            {qrDataUrl ? (
                                <img 
                                    src={qrDataUrl} 
                                    alt="Verification QR" 
                                    className="w-14 h-14 rounded-lg border border-slate-200 p-0.5 bg-white shrink-0"
                                />
                            ) : (
                                <div className="w-14 h-14 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0">
                                    <ShieldCheck className="w-6 h-6 text-slate-400" />
                                </div>
                            )}

                            <div>
                                <p className="text-[9px] font-black uppercase tracking-wider text-slate-900 flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                    Digital Audit Verification
                                </p>
                                <p className="text-[9px] text-slate-500 leading-tight mt-0.5">
                                    Scan QR code to verify this financial record on the school portal registry.
                                </p>
                                <p className="text-[8px] font-mono text-slate-400 mt-0.5">
                                    Auth Code: {doc.documentNumber}
                                </p>
                            </div>
                        </div>

                        {/* Signatory & Stamp */}
                        <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                            {/* Circular Stamp Seal */}
                            <div className="relative w-14 h-14 rounded-full border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-center p-0.5 select-none pointer-events-none opacity-85">
                                <span className="text-[5px] font-black text-slate-400 uppercase tracking-widest">★ OFFICIAL ★</span>
                                <span className={`text-[8px] font-black ${isReceipt ? 'text-emerald-700' : 'text-primary-700'}`}>
                                    {doc.school.schoolCode || 'SEAL'}
                                </span>
                                <span className="text-[5px] font-bold text-slate-500 uppercase">BURSAR'S OFFICE</span>
                            </div>

                            {/* Signature Line */}
                            <div className="w-36 text-center">
                                <div className="h-7 flex items-end justify-center">
                                    <span className="font-serif italic text-xs text-slate-700 tracking-wide font-medium">
                                        Accounts &amp; Treasury
                                    </span>
                                </div>
                                <div className="w-full border-b border-slate-400 mt-0.5"></div>
                                <p className="text-[9px] font-bold text-slate-800 uppercase tracking-wider mt-1">
                                    Authorized Signature
                                </p>
                                <p className="text-[8px] text-slate-400">
                                    {doc.bursarName || 'Finance Controller'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Legal Notice */}
                    <div className="mt-2 pt-1.5 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center text-[9px] text-slate-400 gap-1">
                        <span>
                            This is an authenticated computer-generated financial document issued by {doc.school.name}.
                        </span>
                        <span className="font-mono text-[8px]">
                            Generated: {new Date().toLocaleDateString()} • Page 1 of 1
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default FinancialDocumentView;
