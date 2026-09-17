import { jsPDF } from 'jspdf';
import type { SchoolInfo, Student, Transaction } from '../types';
import { TransactionType } from '../types';

export interface StatementPDFOptions {
    student: Student;
    transactions: Transaction[];
    schoolInfo: SchoolInfo | null;
    startDate?: string;
    endDate?: string;
    openingBalance?: number;
    closingBalance?: number;
    darajaSettings?: any;
}

export function generateStudentStatementPDF(options: StatementPDFOptions): jsPDF {
    const {
        student,
        transactions,
        schoolInfo,
        startDate,
        endDate,
        openingBalance = 0,
        closingBalance = student.balance ?? 0,
        darajaSettings
    } = options;

    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 14;
    const contentWidth = pageWidth - (margin * 2);
    let currentY = 14;

    const schoolName = (schoolInfo?.name || 'SaasLink Academy').toUpperCase();
    const schoolAddress = schoolInfo?.address || 'P.O. Box 1024 - 00100, Nairobi, Kenya';
    const schoolPhone = schoolInfo?.phone || '+254 700 000 000';
    const schoolEmail = schoolInfo?.email || 'bursar@school.ac.ke';
    const schoolCode = schoolInfo?.schoolCode || 'SCH-001';
    const currency = schoolInfo?.currency || 'KES';
    const paybill = darajaSettings?.paybillNumber || schoolInfo?.mpesaPaybill || '522522';

    // 1. Institution Header Strip
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(margin, currentY, contentWidth, 2, 'F');
    currentY += 6;

    // School Name & Branding
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(schoolName, margin, currentY);

    // Document Title on the right
    doc.setFontSize(11);
    doc.setTextColor(2, 132, 199); // primary-600
    doc.text('STATEMENT OF ACCOUNT', pageWidth - margin, currentY, { align: 'right' });
    currentY += 5;

    // Contact info
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`${schoolAddress} • Tel: ${schoolPhone} • Email: ${schoolEmail}`, margin, currentY);

    const statementNo = `STM-${student.admissionNumber || 'ADM'}-${new Date().getFullYear()}`;
    doc.text(`Ref: ${statementNo}`, pageWidth - margin, currentY, { align: 'right' });
    currentY += 6;

    // Thin separator
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 6;

    // 2. Scholar & Statement Period Details (2-column layout)
    const colWidth = (contentWidth - 6) / 2;
    const detailsBoxY = currentY;

    // Left Column: Student Details
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, detailsBoxY, colWidth, 28, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, detailsBoxY, colWidth, 28, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('SCHOLAR ACCOUNT DETAILS', margin + 4, detailsBoxY + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(student.name, margin + 4, detailsBoxY + 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(`Adm No: ${student.admissionNumber || 'N/A'}    |    Class: ${student.class || 'N/A'}`, margin + 4, detailsBoxY + 16);
    doc.text(`Guardian: ${student.guardianName || 'Parent / Sponsor'}`, margin + 4, detailsBoxY + 21);
    doc.text(`Contact: ${student.guardianContact || 'N/A'}`, margin + 4, detailsBoxY + 25);

    // Right Column: Statement Metadata & Status
    const rightColX = margin + colWidth + 6;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(rightColX, detailsBoxY, colWidth, 28, 2, 2, 'F');
    doc.roundedRect(rightColX, detailsBoxY, colWidth, 28, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('STATEMENT SUMMARY', rightColX + 4, detailsBoxY + 5);

    const issueDateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const periodStr = startDate && endDate 
        ? `${new Date(startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} to ${new Date(endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
        : 'Complete Ledger History';

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(`Statement Date: ${issueDateStr}`, rightColX + 4, detailsBoxY + 11);
    doc.text(`Period Covered: ${periodStr}`, rightColX + 4, detailsBoxY + 16);

    // Closing Balance callout
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('CLOSING BALANCE DUE:', rightColX + 4, detailsBoxY + 22);
    doc.setFontSize(10);
    if (closingBalance > 0) {
        doc.setTextColor(220, 38, 38); // red-600
        doc.text(`${currency} ${closingBalance.toLocaleString()}`, rightColX + colWidth - 4, detailsBoxY + 22, { align: 'right' });
    } else {
        doc.setTextColor(16, 185, 129); // emerald-600
        doc.text(closingBalance === 0 ? 'CLEARED (0.00)' : `${currency} ${Math.abs(closingBalance).toLocaleString()} (CR)`, rightColX + colWidth - 4, detailsBoxY + 22, { align: 'right' });
    }

    currentY = detailsBoxY + 34;

    // 3. Four-Metric KPI Cards
    const cardWidth = (contentWidth - 9) / 4;
    const cardHeight = 14;

    const totalDebits = transactions
        .filter(t => t.type === TransactionType.Invoice)
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const totalCredits = transactions
        .filter(t => t.type === TransactionType.Payment)
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const stats = [
        { label: 'OPENING BALANCE', value: `${currency} ${openingBalance.toLocaleString()}`, color: [71, 85, 105] },
        { label: 'TOTAL INVOICED', value: `${currency} ${totalDebits.toLocaleString()}`, color: [15, 23, 42] },
        { label: 'TOTAL PAID', value: `${currency} ${totalCredits.toLocaleString()}`, color: [16, 185, 129] },
        { label: 'NET BALANCE', value: `${currency} ${closingBalance.toLocaleString()}`, color: closingBalance > 0 ? [220, 38, 38] : [16, 185, 129] }
    ];

    stats.forEach((stat, idx) => {
        const x = margin + idx * (cardWidth + 3);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(x, currentY, cardWidth, cardHeight, 1.5, 1.5, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(x, currentY, cardWidth, cardHeight, 1.5, 1.5, 'S');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text(stat.label, x + 3, currentY + 4.5);

        doc.setFontSize(9);
        doc.setTextColor(stat.color[0], stat.color[1], stat.color[2]);
        doc.text(stat.value, x + 3, currentY + 10.5);
    });

    currentY += cardHeight + 6;

    // 4. Ledger Table Header
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(margin, currentY, contentWidth, 7, 'F');

    const cols = [
        { header: 'DATE', x: margin + 3, align: 'left' as const },
        { header: 'REFERENCE', x: margin + 28, align: 'left' as const },
        { header: 'DESCRIPTION', x: margin + 65, align: 'left' as const },
        { header: `DEBIT (${currency})`, x: margin + 128, align: 'right' as const },
        { header: `CREDIT (${currency})`, x: margin + 158, align: 'right' as const },
        { header: `BALANCE (${currency})`, x: margin + contentWidth - 3, align: 'right' as const }
    ];

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    cols.forEach(col => {
        doc.text(col.header, col.x, currentY + 4.8, { align: col.align });
    });
    currentY += 7;

    // Sort transactions chronologically
    const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let runningBalance = openingBalance;

    sorted.forEach((t, i) => {
        const isInvoice = t.type === TransactionType.Invoice;
        const amount = Number(t.amount) || 0;
        runningBalance = isInvoice ? runningBalance + amount : runningBalance - amount;

        // Check for page break
        if (currentY > pageHeight - 45) {
            doc.addPage('a4', 'portrait');
            currentY = margin;

            // Redraw Header on new page
            doc.setFillColor(30, 41, 59);
            doc.rect(margin, currentY, contentWidth, 7, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.5);
            doc.setTextColor(255, 255, 255);
            cols.forEach(col => {
                doc.text(col.header, col.x, currentY + 4.8, { align: col.align });
            });
            currentY += 7;
        }

        // Row background alternating
        const isEven = i % 2 === 0;
        doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
        doc.rect(margin, currentY, contentWidth, 6.5, 'F');
        doc.setDrawColor(241, 245, 249);
        doc.line(margin, currentY + 6.5, margin + contentWidth, currentY + 6.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(51, 65, 85);

        const dateStr = new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const refStr = t.transactionCode || t.id.slice(0, 10).toUpperCase();
        const descStr = (t.description || (isInvoice ? 'Tuition Fee Charge' : 'Fee Payment')).slice(0, 35);

        doc.text(dateStr, cols[0].x, currentY + 4.5);
        doc.text(refStr, cols[1].x, currentY + 4.5);
        doc.text(descStr, cols[2].x, currentY + 4.5);

        if (isInvoice) {
            doc.setTextColor(15, 23, 42);
            doc.text(amount.toLocaleString(), cols[3].x, currentY + 4.5, { align: 'right' });
            doc.setTextColor(148, 163, 184);
            doc.text('-', cols[4].x, currentY + 4.5, { align: 'right' });
        } else {
            doc.setTextColor(148, 163, 184);
            doc.text('-', cols[3].x, currentY + 4.5, { align: 'right' });
            doc.setTextColor(16, 185, 129);
            doc.text(amount.toLocaleString(), cols[4].x, currentY + 4.5, { align: 'right' });
        }

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(runningBalance.toLocaleString(), cols[5].x, currentY + 4.5, { align: 'right' });

        currentY += 6.5;
    });

    // Totals row
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, currentY, contentWidth, 7, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, currentY, contentWidth, 7, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('TOTALS & CLOSING POSITION', margin + 3, currentY + 4.8);
    doc.text(totalDebits.toLocaleString(), cols[3].x, currentY + 4.8, { align: 'right' });
    doc.setTextColor(16, 185, 129);
    doc.text(totalCredits.toLocaleString(), cols[4].x, currentY + 4.8, { align: 'right' });
    doc.setTextColor(closingBalance > 0 ? 220 : 16, closingBalance > 0 ? 38 : 185, closingBalance > 0 ? 38 : 129);
    doc.text(closingBalance.toLocaleString(), cols[5].x, currentY + 4.8, { align: 'right' });

    currentY += 12;

    // 5. Payment Details & Settlement Channels
    if (currentY > pageHeight - 40) {
        doc.addPage('a4', 'portrait');
        currentY = margin;
    }

    const footerBoxHeight = 22;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, currentY, contentWidth, footerBoxHeight, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, currentY, contentWidth, footerBoxHeight, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('OFFICIAL PAYMENT CHANNELS', margin + 4, currentY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text(`• M-Pesa Paybill: ${paybill}   |   Account No: ${student.admissionNumber || 'ADM'} (Scholar Admission Number)`, margin + 4, currentY + 11);
    doc.text(`• Bank: Equity Bank Kenya   |   Account Name: ${schoolName}   |   Account: 0180293847291`, margin + 4, currentY + 16);

    currentY += footerBoxHeight + 8;

    // Signatures
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);

    doc.line(margin, currentY + 8, margin + 45, currentY + 8);
    doc.text('Prepared by: Bursar / Accounts', margin, currentY + 12);

    doc.line(pageWidth - margin - 45, currentY + 8, pageWidth - margin, currentY + 8);
    doc.text('Authorized Stamp & Signature', pageWidth - margin - 45, currentY + 12);

    return doc;
}
