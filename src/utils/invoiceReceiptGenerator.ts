import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import type { SchoolInfo, Student, Transaction, FeeItem, SaasInvoice, SaasReceipt, PlatformPricing } from '../types';
import { TransactionType, PaymentMethod } from '../types';

export interface DocumentItem {
    id: string;
    description: string;
    category?: string;
    quantity: number;
    unitPrice: number;
    amount: number;
}

export interface PaymentChannels {
    mpesa: {
        paybill: string;
        accountNumber: string;
        businessName: string;
        instructions: string[];
    };
    bank: {
        bankName: string;
        accountName: string;
        accountNumber: string;
        branch: string;
        reference: string;
        swiftCode?: string;
    };
    cashCheque: {
        payableTo: string;
        officeLocation: string;
        hours: string;
    };
}

export interface FinancialDocument {
    type: 'INVOICE' | 'RECEIPT';
    documentNumber: string;
    referenceCode?: string;
    date: string;
    dueDate?: string;
    status: 'PAID' | 'DUE' | 'PARTIAL' | 'OVERDUE';
    currency: string;
    school: {
        name: string;
        address: string;
        phone: string;
        email: string;
        logoUrl?: string;
        schoolCode: string;
        taxPin?: string;
    };
    student: {
        id: string;
        name: string;
        admissionNumber: string;
        class: string;
        guardianName?: string;
        guardianContact?: string;
        guardianEmail?: string;
    };
    items: DocumentItem[];
    subtotal: number;
    adjustments?: number;
    total: number;
    amountPaid?: number;
    balanceDue?: number;
    settlementMethod?: {
        method: string;
        referenceCode?: string;
        bankName?: string;
        chequeNumber?: string;
        date: string;
        receivedBy?: string;
    };
    paymentChannels: PaymentChannels;
    notes?: string[];
    verificationQrPayload: string;
    bursarName?: string;
}

/**
 * Resolves standard payment channels for school fees
 */
export function resolvePaymentChannels(
    schoolInfo: SchoolInfo,
    studentAdm: string,
    darajaSettings?: any
): PaymentChannels {
    const paybill = darajaSettings?.paybillNumber || schoolInfo.mpesaPaybill || '522522';
    const admRef = studentAdm || 'ADM-GENERAL';
    const schoolName = schoolInfo.name || 'School Accounts';

    return {
        mpesa: {
            paybill,
            accountNumber: admRef,
            businessName: schoolName,
            instructions: [
                'Open M-PESA menu on your phone',
                'Select Lipa na M-PESA > Paybill',
                `Enter Business No: ${paybill}`,
                `Enter Account No: ${admRef}`,
                'Enter Amount & your M-PESA PIN to confirm'
            ]
        },
        bank: {
            bankName: schoolInfo.bankName || 'Equity Bank Kenya',
            accountName: schoolInfo.bankAccountName || `${schoolName} Fees Collection`,
            accountNumber: schoolInfo.bankAccountNumber || '0140293847291',
            branch: schoolInfo.bankBranch || 'Westlands Supreme Branch',
            reference: `${admRef} - ${schoolInfo.schoolCode || 'FEES'}`
        },
        cashCheque: {
            payableTo: schoolName,
            officeLocation: 'Bursar & Accounts Office, Administration Block',
            hours: 'Monday – Friday, 8:00 AM – 4:30 PM'
        }
    };
}

/**
 * Builds a normalized FinancialDocument from a Transaction record
 */
export function buildDocumentFromTransaction(
    transaction: Transaction,
    schoolInfo: SchoolInfo,
    student?: Student | null,
    darajaSettings?: any,
    studentBalance?: number
): FinancialDocument {
    const isInvoice = transaction.type === TransactionType.Invoice || transaction.type === TransactionType.ManualDebit;
    const currency = schoolInfo.currency || 'KES';
    const studentAdm = student?.admissionNumber || transaction.studentId?.substring(0, 8).toUpperCase() || 'STU-001';
    const studentClass = student?.class || 'Assigned Stream';
    const guardianName = student?.guardianName || 'Parent / Guardian';
    const guardianContact = student?.guardianContact || '+254 700 000 000';
    const channels = resolvePaymentChannels(schoolInfo, studentAdm, darajaSettings);

    const docDate = transaction.date ? new Date(transaction.date) : new Date();
    const formattedDate = docDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    
    // 30 days due date for invoices
    const dueObj = new Date(docDate);
    dueObj.setDate(dueObj.getDate() + 30);
    const formattedDueDate = dueObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    const docNum = isInvoice
        ? (transaction.transactionCode ? `INV-${transaction.transactionCode.replace(/[^a-zA-Z0-9]/g, '').slice(-8)}` : `INV-${transaction.id.slice(-6).toUpperCase()}`)
        : (transaction.transactionCode ? `REC-${transaction.transactionCode}` : `REC-${transaction.id.slice(-6).toUpperCase()}`);

    const itemDescription = transaction.description || (isInvoice ? 'Tuition & Academic Term Charges' : 'Fee Remittance / Settlement');

    const qrPayload = JSON.stringify({
        doc: isInvoice ? 'INVOICE' : 'RECEIPT',
        number: docNum,
        adm: studentAdm,
        student: student?.name || transaction.studentName,
        amount: transaction.amount,
        currency,
        date: transaction.date,
        code: transaction.transactionCode || 'CONFIRMED',
        school: schoolInfo.schoolCode || 'SCH'
    });

    if (isInvoice) {
        return {
            type: 'INVOICE',
            documentNumber: docNum,
            referenceCode: transaction.transactionCode,
            date: formattedDate,
            dueDate: formattedDueDate,
            status: 'DUE',
            currency,
            school: {
                name: schoolInfo.name || 'Springfield Elementary School',
                address: schoolInfo.address || 'P.O. Box 40100, Academic Way, Nairobi',
                phone: schoolInfo.phone || '+254 700 000 000',
                email: schoolInfo.email || 'bursar@springfield.edu',
                logoUrl: schoolInfo.logoUrl,
                schoolCode: schoolInfo.schoolCode || 'SPE',
                taxPin: schoolInfo.taxPin || 'P051239845X'
            },
            student: {
                id: transaction.studentId,
                name: student?.name || transaction.studentName || 'Student Name',
                admissionNumber: studentAdm,
                class: studentClass,
                guardianName,
                guardianContact
            },
            items: [
                {
                    id: 'item-1',
                    description: itemDescription,
                    quantity: 1,
                    unitPrice: transaction.amount,
                    amount: transaction.amount
                }
            ],
            subtotal: transaction.amount,
            total: transaction.amount,
            balanceDue: studentBalance !== undefined ? studentBalance : transaction.amount,
            paymentChannels: channels,
            notes: [
                'Please quote the student admission number as the account/reference for all remittances.',
                'Payments are deemed complete only upon receipt of an automated M-PESA confirmation or stamped bank deposit slip.',
                'For fee inquiries, reach out to the Finance and Bursary Department during official working hours.'
            ],
            verificationQrPayload: qrPayload,
            bursarName: 'Finance & Accounts Office'
        };
    }

    // Official Receipt
    return {
        type: 'RECEIPT',
        documentNumber: docNum,
        referenceCode: transaction.transactionCode,
        date: formattedDate,
        status: 'PAID',
        currency,
        school: {
            name: schoolInfo.name || 'Springfield Elementary School',
            address: schoolInfo.address || 'P.O. Box 40100, Academic Way, Nairobi',
            phone: schoolInfo.phone || '+254 700 000 000',
            email: schoolInfo.email || 'bursar@springfield.edu',
            logoUrl: schoolInfo.logoUrl,
            schoolCode: schoolInfo.schoolCode || 'SPE',
            taxPin: schoolInfo.taxPin || 'P051239845X'
        },
        student: {
            id: transaction.studentId,
            name: student?.name || transaction.studentName || 'Student Name',
            admissionNumber: studentAdm,
            class: studentClass,
            guardianName,
            guardianContact
        },
        items: [
            {
                id: 'pay-1',
                description: itemDescription,
                quantity: 1,
                unitPrice: transaction.amount,
                amount: transaction.amount
            }
        ],
        subtotal: transaction.amount,
        total: transaction.amount,
        amountPaid: transaction.amount,
        balanceDue: studentBalance !== undefined ? Math.max(0, studentBalance) : 0,
        settlementMethod: {
            method: transaction.method || PaymentMethod.Cash,
            referenceCode: transaction.transactionCode || 'TXN-SETTLED',
            bankName: transaction.checkBank,
            chequeNumber: transaction.checkNumber,
            date: formattedDate,
            receivedBy: 'Automated Financial Ledger'
        },
        paymentChannels: channels,
        notes: [
            'Official institutional acknowledgement of fee settlement.',
            'Keep this electronic receipt for your permanent records and audits.',
            'Remaining balances (if any) may be cleared via the official payment channels below.'
        ],
        verificationQrPayload: qrPayload,
        bursarName: 'Finance & Accounts Office'
    };
}

/**
 * Builds an itemized Term Invoice for a Student from Fee Structure
 */
export function buildStudentTermInvoice(
    student: Student,
    feeItems: FeeItem[],
    schoolInfo: SchoolInfo,
    darajaSettings?: any,
    currentBalance?: number,
    termLabel: string = 'Current Academic Term'
): FinancialDocument {
    const currency = schoolInfo.currency || 'KES';
    const studentAdm = student.admissionNumber || student.id.slice(0, 8).toUpperCase();
    const channels = resolvePaymentChannels(schoolInfo, studentAdm, darajaSettings);

    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const dueObj = new Date(now);
    dueObj.setDate(dueObj.getDate() + 21);
    const formattedDueDate = dueObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    const docNum = `INV-${studentAdm}-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Map fee structure items applicable to student's class
    const items: DocumentItem[] = [];
    feeItems.forEach((f, idx) => {
        const classPricing = f.classSpecificFees?.find(cf => cf.classId === student.classId);
        const feeAmount = classPricing ? classPricing.amount : 0;
        if (feeAmount > 0) {
            items.push({
                id: `fee-${idx}`,
                description: `${f.name} (${termLabel})`,
                category: f.category,
                quantity: 1,
                unitPrice: feeAmount,
                amount: feeAmount
            });
        }
    });

    // Fallback if no specific class fees configured
    if (items.length === 0) {
        items.push({
            id: 'fee-default',
            description: `Tuition & Academic Term Levies (${termLabel})`,
            quantity: 1,
            unitPrice: currentBalance && currentBalance > 0 ? currentBalance : 45000,
            amount: currentBalance && currentBalance > 0 ? currentBalance : 45000
        });
    }

    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);

    const qrPayload = JSON.stringify({
        doc: 'INVOICE',
        number: docNum,
        adm: studentAdm,
        student: student.name,
        amount: subtotal,
        currency,
        date: now.toISOString(),
        school: schoolInfo.schoolCode || 'SCH'
    });

    return {
        type: 'INVOICE',
        documentNumber: docNum,
        date: formattedDate,
        dueDate: formattedDueDate,
        status: 'DUE',
        currency,
        school: {
            name: schoolInfo.name || 'Springfield Elementary School',
            address: schoolInfo.address || 'P.O. Box 40100, Academic Way, Nairobi',
            phone: schoolInfo.phone || '+254 700 000 000',
            email: schoolInfo.email || 'bursar@springfield.edu',
            logoUrl: schoolInfo.logoUrl,
            schoolCode: schoolInfo.schoolCode || 'SPE',
            taxPin: schoolInfo.taxPin || 'P051239845X'
        },
        student: {
            id: student.id,
            name: student.name,
            admissionNumber: studentAdm,
            class: student.class,
            guardianName: student.guardianName || 'Parent / Guardian',
            guardianContact: student.guardianContact || '+254 700 000 000'
        },
        items,
        subtotal,
        total: subtotal,
        balanceDue: currentBalance !== undefined ? currentBalance : subtotal,
        paymentChannels: channels,
        notes: [
            'All school fee payments must quote the student admission number as the account reference.',
            'Cheques must be cleared at least 7 days before the commencement of the academic term.',
            'Direct electronic settlements via Lipa Na M-PESA are posted to student ledgers in real time.'
        ],
        verificationQrPayload: qrPayload,
        bursarName: 'Finance & Accounts Office'
    };
}

/**
 * Generates an A4 Vector PDF using jsPDF directly and triggers a download.
 */
export async function generateDocumentPDF(doc: FinancialDocument): Promise<jsPDF> {
    // Standard ISO A4 Dimensions: 210mm x 297mm
    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;

    const isReceipt = doc.type === 'RECEIPT';
    const primaryColor = isReceipt ? [16, 115, 75] : [30, 58, 138]; // Emerald for Receipt, Navy for Invoice
    const darkSlate = [15, 23, 42];
    const mutedGray = [100, 116, 139];
    const lightBg = [248, 250, 252];
    const borderColor = [226, 232, 240];

    // Top Brand Accent Bar
    pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.rect(0, 0, pageWidth, 5, 'F');

    let cursorY = 16;

    // 1. Institution Header
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    pdf.text(doc.school.name.toUpperCase(), margin, cursorY);

    cursorY += 5;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(mutedGray[0], mutedGray[1], mutedGray[2]);
    pdf.text(doc.school.address, margin, cursorY);
    cursorY += 4;
    pdf.text(`Tel: ${doc.school.phone}  |  Email: ${doc.school.email}`, margin, cursorY);
    cursorY += 4;
    pdf.text(`Reg Code: ${doc.school.schoolCode}${doc.school.taxPin ? `  |  KRA PIN: ${doc.school.taxPin}` : ''}`, margin, cursorY);

    // Document Type Banner / Badge (Right-aligned)
    const badgeWidth = 62;
    const badgeHeight = 20;
    const badgeX = pageWidth - margin - badgeWidth;
    const badgeY = 12;

    pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 2, 2, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(255, 255, 255);
    const titleText = isReceipt ? 'OFFICIAL RECEIPT' : 'FEES INVOICE';
    pdf.text(titleText, badgeX + badgeWidth / 2, badgeY + 7, { align: 'center' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.text(doc.documentNumber, badgeX + badgeWidth / 2, badgeY + 12, { align: 'center' });

    pdf.setFontSize(7.5);
    pdf.text(`Status: ${doc.status}`, badgeX + badgeWidth / 2, badgeY + 16.5, { align: 'center' });

    cursorY = 36;
    // Horizontal divider
    pdf.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    pdf.setLineWidth(0.4);
    pdf.line(margin, cursorY, pageWidth - margin, cursorY);

    cursorY += 6;

    // 2. Metadata Grid (Bill To & Meta Details)
    const colWidth = (contentWidth - 6) / 2;
    const metaCardHeight = 32;

    // Left Card: Student / Recipient
    pdf.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    pdf.roundedRect(margin, cursorY, colWidth, metaCardHeight, 2, 2, 'F');
    pdf.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    pdf.roundedRect(margin, cursorY, colWidth, metaCardHeight, 2, 2, 'S');

    let studentY = cursorY + 5;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.text(isReceipt ? 'ISSUED TO (SCHOLAR):' : 'BILLED TO (SCHOLAR):', margin + 4, studentY);

    studentY += 5;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    pdf.text(doc.student.name, margin + 4, studentY);

    studentY += 4.5;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(mutedGray[0], mutedGray[1], mutedGray[2]);
    pdf.text(`Admission No: ${doc.student.admissionNumber}   |   Class: ${doc.student.class}`, margin + 4, studentY);

    studentY += 4.5;
    pdf.text(`Guardian: ${doc.student.guardianName || 'N/A'} (${doc.student.guardianContact || 'N/A'})`, margin + 4, studentY);

    // Right Card: Document Meta
    const rightCardX = margin + colWidth + 6;
    pdf.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    pdf.roundedRect(rightCardX, cursorY, colWidth, metaCardHeight, 2, 2, 'F');
    pdf.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    pdf.roundedRect(rightCardX, cursorY, colWidth, metaCardHeight, 2, 2, 'S');

    let metaY = cursorY + 5;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.text('TRANSACTION DETAILS:', rightCardX + 4, metaY);

    metaY += 5;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    pdf.text(`Issue Date: ${doc.date}`, rightCardX + 4, metaY);

    if (doc.dueDate) {
        metaY += 4.5;
        pdf.text(`Due Date: ${doc.dueDate}`, rightCardX + 4, metaY);
    }

    if (isReceipt && doc.settlementMethod) {
        metaY += 4.5;
        pdf.text(`Settlement Channel: ${doc.settlementMethod.method}`, rightCardX + 4, metaY);
        metaY += 4.5;
        pdf.text(`Ref / Code: ${doc.settlementMethod.referenceCode || 'N/A'}`, rightCardX + 4, metaY);
    } else {
        metaY += 4.5;
        pdf.text(`Terms: Net 30 Days`, rightCardX + 4, metaY);
        metaY += 4.5;
        pdf.text(`Currency: ${doc.currency}`, rightCardX + 4, metaY);
    }

    cursorY += metaCardHeight + 8;

    // 3. Itemized Table
    const tableHeaderHeight = 7;
    pdf.setFillColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    pdf.rect(margin, cursorY, contentWidth, tableHeaderHeight, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(255, 255, 255);
    pdf.text('#', margin + 3, cursorY + 4.8);
    pdf.text('DESCRIPTION / FEE LEVY', margin + 12, cursorY + 4.8);
    pdf.text('QTY', margin + contentWidth - 65, cursorY + 4.8, { align: 'right' });
    pdf.text(`RATE (${doc.currency})`, margin + contentWidth - 32, cursorY + 4.8, { align: 'right' });
    pdf.text(`AMOUNT (${doc.currency})`, margin + contentWidth - 4, cursorY + 4.8, { align: 'right' });

    cursorY += tableHeaderHeight;

    // Rows
    doc.items.forEach((item, index) => {
        const rowHeight = 7.5;
        const isEven = index % 2 === 0;

        pdf.setFillColor(isEven ? 255 : 249, isEven ? 255 : 250, isEven ? 255 : 252);
        pdf.rect(margin, cursorY, contentWidth, rowHeight, 'F');

        pdf.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
        pdf.setLineWidth(0.2);
        pdf.line(margin, cursorY + rowHeight, margin + contentWidth, cursorY + rowHeight);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
        pdf.text(String(index + 1), margin + 3, cursorY + 5);
        pdf.text(item.description, margin + 12, cursorY + 5);
        pdf.text(String(item.quantity), margin + contentWidth - 65, cursorY + 5, { align: 'right' });
        pdf.text(item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 }), margin + contentWidth - 32, cursorY + 5, { align: 'right' });
        pdf.setFont('helvetica', 'bold');
        pdf.text(item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 }), margin + contentWidth - 4, cursorY + 5, { align: 'right' });

        cursorY += rowHeight;
    });

    cursorY += 3;

    // Totals Box
    const totalsBoxWidth = 85;
    const totalsBoxX = margin + contentWidth - totalsBoxWidth;

    const renderTotalRow = (label: string, value: string, isBold: boolean = false, isAccent: boolean = false) => {
        pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
        pdf.setFontSize(8.5);
        if (isAccent) {
            pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        } else {
            pdf.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
        }
        pdf.text(label, totalsBoxX, cursorY);
        pdf.text(value, margin + contentWidth - 4, cursorY, { align: 'right' });
        cursorY += 5;
    };

    renderTotalRow('Subtotal:', `${doc.currency} ${doc.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    
    if (isReceipt) {
        renderTotalRow('Total Settled:', `${doc.currency} ${(doc.amountPaid || doc.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, true, true);
        if (doc.balanceDue !== undefined) {
            renderTotalRow('Current Net Balance:', `${doc.currency} ${doc.balanceDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, true);
        }
    } else {
        renderTotalRow('Total Amount Due:', `${doc.currency} ${doc.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, true, true);
        if (doc.balanceDue !== undefined && doc.balanceDue !== doc.total) {
            renderTotalRow('Total Outstanding Ledger:', `${doc.currency} ${doc.balanceDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, true);
        }
    }

    cursorY += 4;

    // 4. Dedicated PAYMENT METHODS Block
    const paymentBoxHeight = 44;
    pdf.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    pdf.roundedRect(margin, cursorY, contentWidth, paymentBoxHeight, 2, 2, 'F');
    pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(margin, cursorY, contentWidth, paymentBoxHeight, 2, 2, 'S');

    // Title of Payment Box
    let payY = cursorY + 5;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.text(isReceipt ? 'OFFICIAL PAYMENT CHANNELS (FOR BALANCE / FUTURE REMITTANCES):' : 'HOW TO PAY / AUTHORIZED PAYMENT CHANNELS:', margin + 4, payY);

    payY += 5;
    const payColW = (contentWidth - 8) / 3;

    // Channel 1: Lipa Na M-Pesa
    const c1X = margin + 4;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    pdf.text('1. LIPA NA M-PESA', c1X, payY);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(mutedGray[0], mutedGray[1], mutedGray[2]);
    pdf.text(`Paybill Business No:`, c1X, payY + 4);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    pdf.text(doc.paymentChannels.mpesa.paybill, c1X + 30, payY + 4);

    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(mutedGray[0], mutedGray[1], mutedGray[2]);
    pdf.text(`Account No:`, c1X, payY + 8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    pdf.text(doc.paymentChannels.mpesa.accountNumber, c1X + 30, payY + 8);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.8);
    pdf.setTextColor(mutedGray[0], mutedGray[1], mutedGray[2]);
    pdf.text('• Lipa na M-Pesa > Paybill', c1X, payY + 12.5);
    pdf.text(`• Enter Bus. No ${doc.paymentChannels.mpesa.paybill}`, c1X, payY + 16.5);
    pdf.text(`• Account: ${doc.paymentChannels.mpesa.accountNumber}`, c1X, payY + 20.5);
    pdf.text('• Enter PIN & confirm', c1X, payY + 24.5);

    // Channel 2: Direct Bank Transfer
    const c2X = margin + 4 + payColW;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    pdf.text('2. BANK TRANSFER / SLIP', c2X, payY);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(mutedGray[0], mutedGray[1], mutedGray[2]);
    pdf.text(`Bank: ${doc.paymentChannels.bank.bankName}`, c2X, payY + 4);
    pdf.text(`A/C Name: ${doc.paymentChannels.bank.accountName.slice(0, 24)}`, c2X, payY + 8);
    
    pdf.text(`A/C No:`, c2X, payY + 12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    pdf.text(doc.paymentChannels.bank.accountNumber, c2X + 13, payY + 12);

    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(mutedGray[0], mutedGray[1], mutedGray[2]);
    pdf.text(`Branch: ${doc.paymentChannels.bank.branch}`, c2X, payY + 16);
    if (doc.paymentChannels.bank.swiftCode) {
        pdf.text(`SWIFT/BIC: ${doc.paymentChannels.bank.swiftCode}`, c2X, payY + 20);
        pdf.text(`Ref: ${doc.paymentChannels.bank.reference}`, c2X, payY + 24);
    } else {
        pdf.text(`Ref: ${doc.paymentChannels.bank.reference}`, c2X, payY + 20);
    }

    // Channel 3: Cheque & Cash Desk
    const c3X = margin + 4 + payColW * 2;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    pdf.text('3. CHEQUE & CASHIER', c3X, payY);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(mutedGray[0], mutedGray[1], mutedGray[2]);
    pdf.text(`Payable to: ${doc.paymentChannels.cashCheque.payableTo.slice(0, 22)}`, c3X, payY + 4);
    pdf.text(`Location: ${doc.paymentChannels.cashCheque.officeLocation.slice(0, 24)}`, c3X, payY + 8);
    pdf.text(`Hours: ${doc.paymentChannels.cashCheque.hours}`, c3X, payY + 12);
    pdf.setFontSize(6.8);
    pdf.text('• Write student admission no on back of cheque', c3X, payY + 18);
    pdf.text('• Present deposit slips at accounts desk for receipting', c3X, payY + 22);

    cursorY += paymentBoxHeight + 8;

    // 5. Verification Block: QR Code, Signatory & Official Stamp
    const qrSize = 25;
    try {
        const qrDataUrl = await QRCode.toDataURL(doc.verificationQrPayload, {
            errorCorrectionLevel: 'M',
            margin: 1,
            width: 120
        });
        pdf.addImage(qrDataUrl, 'PNG', margin, cursorY, qrSize, qrSize);
    } catch {
        // Fallback placeholder box if QR fails
        pdf.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
        pdf.rect(margin, cursorY, qrSize, qrSize);
    }

    // QR Description
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    pdf.text('DIGITAL VERIFICATION', margin + qrSize + 4, cursorY + 6);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.setTextColor(mutedGray[0], mutedGray[1], mutedGray[2]);
    pdf.text('Scan this QR code with any camera to verify authenticity', margin + qrSize + 4, cursorY + 10);
    pdf.text(`Doc Ref: ${doc.documentNumber}`, margin + qrSize + 4, cursorY + 14);
    pdf.text(`Verified by: ${doc.school.name}`, margin + qrSize + 4, cursorY + 18);

    // Signatory / Stamp Area on Right
    const signX = pageWidth - margin - 60;
    pdf.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    pdf.setLineWidth(0.4);
    pdf.line(signX, cursorY + 16, signX + 60, cursorY + 16);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    pdf.text('AUTHORIZED SIGNATURE & STAMP', signX + 30, cursorY + 20, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.setTextColor(mutedGray[0], mutedGray[1], mutedGray[2]);
    pdf.text('Bursar / Financial Controller', signX + 30, cursorY + 24, { align: 'center' });

    // Circular Seal Stamp Effect
    const sealCenterX = signX - 16;
    const sealCenterY = cursorY + 12;
    pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.setLineWidth(0.5);
    pdf.circle(sealCenterX, sealCenterY, 11, 'S');
    pdf.circle(sealCenterX, sealCenterY, 9.5, 'S');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(5);
    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.text('★ VALIDATED ★', sealCenterX, sealCenterY - 3.5, { align: 'center' });
    pdf.setFontSize(5.5);
    pdf.text(doc.school.schoolCode || 'OFFICIAL', sealCenterX, sealCenterY + 1, { align: 'center' });
    pdf.setFontSize(4.5);
    pdf.text('FINANCE DEPT', sealCenterX, sealCenterY + 5, { align: 'center' });

    // 6. Bottom Document Footer
    const footerY = pageHeight - 10;
    pdf.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    pdf.setLineWidth(0.3);
    pdf.line(margin, footerY - 3, pageWidth - margin, footerY - 3);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.setTextColor(mutedGray[0], mutedGray[1], mutedGray[2]);
    pdf.text(`This is a verified computer-generated ${isReceipt ? 'official receipt' : 'fee invoice'} issued by ${doc.school.name}.`, margin, footerY);
    pdf.text(`Generated on ${new Date().toLocaleString()}  |  Page 1 of 1`, pageWidth - margin, footerY, { align: 'right' });

    return pdf;
}

/**
 * Downloads the document directly as an A4 PDF
 */
export async function downloadDocumentAsPDF(doc: FinancialDocument): Promise<void> {
    const pdf = await generateDocumentPDF(doc);
    const cleanDocNum = doc.documentNumber.replace(/[^a-zA-Z0-9-_]/g, '_');
    const cleanRecipientName = (doc.student?.name || 'Customer').replace(/[^a-zA-Z0-9-_]/g, '_');
    pdf.save(`${doc.type}_${cleanDocNum}_${cleanRecipientName}.pdf`);
}

/**
 * Builds a FinancialDocument for a SaaS Platform Subscription Invoice
 */
export function buildSaasSubscriptionInvoice(
    invoice: SaasInvoice,
    pricing?: PlatformPricing,
    platformBrandName: string = 'SaaSLink Education Cloud'
): FinancialDocument {
    const isPaid = invoice.status === 'PAID';
    const isOverdue = invoice.status === 'OVERDUE';
    const docStatus: FinancialDocument['status'] = isPaid ? 'PAID' : isOverdue ? 'OVERDUE' : 'DUE';

    const items: DocumentItem[] = [
        {
            id: `item-${invoice.id}-1`,
            description: `${invoice.plan} SaaS School Management Platform License (${invoice.billingCycle})`,
            category: 'Platform Subscription',
            quantity: 1,
            unitPrice: invoice.amount,
            amount: invoice.amount
        }
    ];

    const paymentChannels: PaymentChannels = {
        mpesa: {
            paybill: '522522',
            accountNumber: `SAAS-${invoice.schoolCode || invoice.invoiceNumber.slice(-6)}`,
            businessName: `${platformBrandName} Subscriptions`,
            instructions: [
                'Open M-PESA menu on your phone and select Lipa Na M-PESA',
                'Select Paybill and enter Business Number 522522',
                `Enter Account Number SAAS-${invoice.schoolCode || invoice.invoiceNumber.slice(-6)}`,
                `Enter Exact Amount KES ${invoice.amount.toLocaleString()}`,
                'Enter your M-PESA PIN and press OK to confirm',
                'Your account license will instantly update upon confirmation'
            ]
        },
        bank: {
            bankName: pricing?.wireBankName || 'NCBA Bank Kenya PLC',
            accountName: pricing?.wireAccountName || 'SaasLink Technologies Ltd - Cloud Operations',
            accountNumber: pricing?.wireAccountNumber || '1004928371',
            branch: pricing?.wireBankBranch || 'Upper Hill Corporate Branch, Nairobi',
            swiftCode: pricing?.wireSwiftCode || 'NCBAKENA',
            reference: invoice.invoiceNumber
        },
        cashCheque: {
            payableTo: 'SaaSLink Global Technologies Ltd',
            officeLocation: 'The Mirage Towers, 7th Floor, Chiromo Rd, Westlands, Nairobi',
            hours: 'Monday - Friday: 8:00 AM - 5:00 PM'
        }
    };

    const verificationQrPayload = JSON.stringify({
        type: 'SAAS_INVOICE',
        inv: invoice.invoiceNumber,
        school: invoice.schoolName,
        schoolCode: invoice.schoolCode,
        plan: invoice.plan,
        amount: invoice.amount,
        status: invoice.status,
        dueDate: invoice.dueDate
    });

    return {
        type: 'INVOICE',
        documentNumber: invoice.invoiceNumber,
        referenceCode: invoice.transactionRef,
        date: invoice.issueDate,
        dueDate: invoice.dueDate,
        status: docStatus,
        currency: invoice.currency || 'KES',
        school: {
            name: platformBrandName,
            address: 'The Mirage Towers, 7th Floor, Westlands, Nairobi, Kenya',
            phone: '+254 700 000 100',
            email: 'billing@saaslink.cloud',
            schoolCode: 'SAAS-HQ',
            taxPin: 'P051982736Z',
            logoUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=120'
        },
        student: {
            id: invoice.schoolId,
            name: invoice.schoolName,
            admissionNumber: invoice.schoolCode || invoice.schoolId,
            class: `Subscription Plan: ${invoice.plan} (${invoice.billingCycle})`,
            guardianName: 'School Administrator / Bursar Office',
            guardianContact: invoice.recipientPhone,
            guardianEmail: invoice.recipientEmail
        },
        items,
        subtotal: invoice.amount,
        total: invoice.amount,
        amountPaid: isPaid ? invoice.amount : 0,
        balanceDue: isPaid ? 0 : invoice.amount,
        paymentChannels,
        notes: [
            invoice.notes || `This invoice provisions access for ${invoice.schoolName} to the SaaSLink Education Cloud.`,
            'Terms: Subscriptions must be renewed within 14 days of expiry to prevent automatic system lockout.',
            'Electronic document verified by SaaSLink Cloud Billing Systems.'
        ],
        verificationQrPayload,
        bursarName: 'Chief Billing Officer'
    };
}

/**
 * Builds a FinancialDocument for a SaaS Platform Subscription Official Payment Receipt
 */
export function buildSaasSubscriptionReceipt(
    receipt: SaasReceipt,
    pricing?: PlatformPricing,
    platformBrandName: string = 'SaaSLink Education Cloud'
): FinancialDocument {
    const items: DocumentItem[] = [
        {
            id: `item-${receipt.id}-1`,
            description: `${receipt.plan} SaaS School Management Platform Subscription Renewal`,
            category: 'Platform Subscription Payment',
            quantity: 1,
            unitPrice: receipt.amount,
            amount: receipt.amount
        }
    ];

    const paymentChannels: PaymentChannels = {
        mpesa: {
            paybill: '522522',
            accountNumber: `SAAS-${receipt.schoolId}`,
            businessName: `${platformBrandName} Subscriptions`,
            instructions: ['Settled via official payment channel']
        },
        bank: {
            bankName: 'NCBA Bank Kenya PLC',
            accountName: 'SaaSLink Global Technologies Ltd',
            accountNumber: '1004928371',
            branch: 'Upper Hill Corporate Branch, Nairobi',
            reference: receipt.receiptNumber
        },
        cashCheque: {
            payableTo: 'SaaSLink Global Technologies Ltd',
            officeLocation: 'The Mirage Towers, 7th Floor, Westlands, Nairobi',
            hours: 'Monday - Friday: 8:00 AM - 5:00 PM'
        }
    };

    const verificationQrPayload = JSON.stringify({
        type: 'SAAS_RECEIPT',
        rec: receipt.receiptNumber,
        inv: receipt.invoiceNumber,
        school: receipt.schoolName,
        plan: receipt.plan,
        amount: receipt.amount,
        txn: receipt.transactionCode,
        date: receipt.paymentDate,
        provisionedUntil: receipt.provisionedUntil
    });

    return {
        type: 'RECEIPT',
        documentNumber: receipt.receiptNumber,
        referenceCode: receipt.transactionCode,
        date: receipt.paymentDate,
        status: 'PAID',
        currency: receipt.currency || 'KES',
        school: {
            name: platformBrandName,
            address: 'The Mirage Towers, 7th Floor, Westlands, Nairobi, Kenya',
            phone: '+254 700 000 100',
            email: 'billing@saaslink.cloud',
            schoolCode: 'SAAS-HQ',
            taxPin: 'P051982736Z',
            logoUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=120'
        },
        student: {
            id: receipt.schoolId,
            name: receipt.schoolName,
            admissionNumber: receipt.schoolId,
            class: `Licensed Tier: ${receipt.plan} (Valid until ${receipt.provisionedUntil || 'Next Term'})`,
            guardianName: 'School Accounts Office',
            guardianContact: 'Verified Registered Contact',
            guardianEmail: 'billing@' + receipt.schoolName.toLowerCase().replace(/[^a-z0-9]/g, '') + '.edu'
        },
        items,
        subtotal: receipt.amount,
        total: receipt.amount,
        amountPaid: receipt.amount,
        balanceDue: 0,
        settlementMethod: {
            method: receipt.paymentMethod,
            referenceCode: receipt.transactionCode,
            date: receipt.paymentDate,
            receivedBy: receipt.verifiedBy || 'Platform Super Administrator'
        },
        paymentChannels,
        notes: [
            `Official receipt for settlement of ${receipt.invoiceNumber}.`,
            `Platform access provisioned in full through ${receipt.provisionedUntil || 'subscription term end'}.`,
            'Thank you for partnering with SaaSLink Education Cloud.'
        ],
        verificationQrPayload,
        bursarName: receipt.verifiedBy || 'Head of Platform Operations'
    };
}
