import { jsPDF } from 'jspdf';
import type { Student, Transaction, Staff, SchoolInfo } from '../types';

// =================================================================================
// Types & Interfaces
// =================================================================================

export type ExportDomain = 'students' | 'fees' | 'staff' | 'all';
export type ExportFormat = 'csv' | 'pdf';

export interface ExportFilterOptions {
    classId?: string;
    status?: string;
    transactionType?: string;
    startDate?: string;
    endDate?: string;
    roleFilter?: string;
}

export interface BackupMetadata {
    id: string;
    timestamp: string;
    domain: ExportDomain;
    format: ExportFormat;
    recordCount: number;
    filename: string;
    fileSizeKb: number;
}

// =================================================================================
// CSV Utilities
// =================================================================================

export function escapeCSVCell(val: any): string {
    if (val === null || val === undefined) return '""';
    const str = String(val);
    return `"${str.replace(/"/g, '""')}"`;
}

export function triggerDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// =================================================================================
// CSV Generators
// =================================================================================

export function generateStudentsCSV(students: Student[], schoolInfo?: SchoolInfo | null): string {
    const headers = [
        'Admission Number',
        'Scholar Name',
        'Class / Form',
        'Status',
        'Date of Birth',
        'Fee Balance (KES)',
        'Guardian Name',
        'Guardian Phone',
        'Guardian Email',
        'Guardian Address',
        'Emergency Contact'
    ];

    const rows = students.map(s => [
        escapeCSVCell(s.admissionNumber || ''),
        escapeCSVCell(s.name || ''),
        escapeCSVCell(s.class || s.classId || ''),
        escapeCSVCell(s.status || 'Active'),
        escapeCSVCell(s.dateOfBirth || ''),
        escapeCSVCell(s.balance ?? 0),
        escapeCSVCell(s.guardianName || ''),
        escapeCSVCell(s.guardianContact || ''),
        escapeCSVCell(s.guardianEmail || ''),
        escapeCSVCell(s.guardianAddress || ''),
        escapeCSVCell(s.emergencyContact || '')
    ]);

    const headerBlock = [
        `# School: ${schoolInfo?.name || 'School Management System'} (Code: ${schoolInfo?.schoolCode || 'N/A'})`,
        `# Export Type: Scholar Registry Local Backup`,
        `# Generated At: ${new Date().toISOString()}`,
        `# Total Records: ${students.length}`,
        ''
    ].join('\n');

    return headerBlock + headers.join(',') + '\n' + rows.map(r => r.join(',')).join('\n');
}

export function generateFeesCSV(transactions: Transaction[], schoolInfo?: SchoolInfo | null): string {
    const headers = [
        'Transaction ID',
        'Date',
        'Scholar Name',
        'Student ID',
        'Transaction Type',
        'Payment Method',
        'Transaction Code / Ref',
        'Description',
        'Amount (KES)'
    ];

    const rows = transactions.map(t => [
        escapeCSVCell(t.id || ''),
        escapeCSVCell(t.date || ''),
        escapeCSVCell(t.studentName || ''),
        escapeCSVCell(t.studentId || ''),
        escapeCSVCell(t.type || ''),
        escapeCSVCell(t.method || 'N/A'),
        escapeCSVCell(t.transactionCode || t.checkNumber || ''),
        escapeCSVCell(t.description || ''),
        escapeCSVCell(t.amount ?? 0)
    ]);

    const headerBlock = [
        `# School: ${schoolInfo?.name || 'School Management System'} (Code: ${schoolInfo?.schoolCode || 'N/A'})`,
        `# Export Type: Fee Ledger & Financial Audit Local Backup`,
        `# Generated At: ${new Date().toISOString()}`,
        `# Total Records: ${transactions.length}`,
        ''
    ].join('\n');

    return headerBlock + headers.join(',') + '\n' + rows.map(r => r.join(',')).join('\n');
}

export function generateStaffCSV(staff: Staff[], schoolInfo?: SchoolInfo | null): string {
    const headers = [
        'Staff ID',
        'Full Name',
        'Official Email',
        'Role / Designation',
        'System Access Role',
        'Basic Monthly Salary (KES)',
        'Date of Joining',
        'Bank Name',
        'Account Number',
        'KRA PIN',
        'NSSF Number',
        'SHA / NHIF Number'
    ];

    const rows = staff.map(st => [
        escapeCSVCell(st.id || ''),
        escapeCSVCell(st.name || ''),
        escapeCSVCell(st.email || ''),
        escapeCSVCell(st.role || ''),
        escapeCSVCell(st.userRole || ''),
        escapeCSVCell(st.salary ?? 0),
        escapeCSVCell(st.joinDate || ''),
        escapeCSVCell(st.bankName || ''),
        escapeCSVCell(st.accountNumber || ''),
        escapeCSVCell(st.kraPin || ''),
        escapeCSVCell(st.nssfNumber || ''),
        escapeCSVCell(st.shaNumber || '')
    ]);

    const headerBlock = [
        `# School: ${schoolInfo?.name || 'School Management System'} (Code: ${schoolInfo?.schoolCode || 'N/A'})`,
        `# Export Type: Staff Roster & Human Resource Local Backup`,
        `# Generated At: ${new Date().toISOString()}`,
        `# Total Records: ${staff.length}`,
        ''
    ].join('\n');

    return headerBlock + headers.join(',') + '\n' + rows.map(r => r.join(',')).join('\n');
}

export function generateMasterBackupCSV(
    students: Student[],
    transactions: Transaction[],
    staff: Staff[],
    schoolInfo?: SchoolInfo | null
): string {
    const timestamp = new Date().toISOString();
    const sections = [
        `# ==============================================================================`,
        `# INSTITUTIONAL MASTER DATABASE BACKUP`,
        `# Institution: ${schoolInfo?.name || 'School Management System'}`,
        `# Registration Code: ${schoolInfo?.schoolCode || 'N/A'}`,
        `# Created: ${timestamp}`,
        `# Summary: Students (${students.length}), Transactions (${transactions.length}), Staff (${staff.length})`,
        `# ==============================================================================`,
        '',
        `### SECTION 1: SCHOLAR DIRECTORY RECORDS`,
        generateStudentsCSV(students, schoolInfo),
        '',
        `### SECTION 2: FINANCIAL TRANSACTIONS & FEE LEDGER`,
        generateFeesCSV(transactions, schoolInfo),
        '',
        `### SECTION 3: STAFF & PERSONNEL ROSTER`,
        generateStaffCSV(staff, schoolInfo)
    ];

    return sections.join('\n');
}

// =================================================================================
// PDF Generators (Built with jsPDF Landscape Layout for High Density)
// =================================================================================

interface PDFCol {
    header: string;
    width: number;
    align?: 'left' | 'right' | 'center';
}

function drawPDFPageHeader(
    doc: jsPDF,
    schoolName: string,
    schoolCode: string,
    reportTitle: string,
    pageNumber: number,
    totalPages: number
) {
    // Top banner accent
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 297, 24, 'F');

    // Title & institution
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text(schoolName.toUpperCase(), 14, 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225); // slate-300
    doc.text(`Official Institutional Backup • Code: ${schoolCode || 'N/A'}`, 14, 18);

    // Right header badge
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(reportTitle.toUpperCase(), 283, 11, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${pageNumber} of ${totalPages} • ${new Date().toLocaleString()}`, 283, 18, { align: 'right' });
}

function drawPDFPageFooter(doc: jsPDF, pageNumber: number, totalPages: number) {
    const y = 202;
    doc.setDrawColor(226, 232, 240);
    doc.line(14, y, 283, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('CONFIDENTIAL & PROPRIETARY • FOR AUTHORIZED ADMINISTRATIVE USE ONLY • LOCAL BACKUP ARCHIVE', 14, y + 4.5);
    doc.text(`Page ${pageNumber} of ${totalPages}`, 283, y + 4.5, { align: 'right' });
}

function renderTable(
    doc: jsPDF,
    columns: PDFCol[],
    rows: (string | number)[][],
    schoolName: string,
    schoolCode: string,
    reportTitle: string,
    summaryStats?: { label: string; value: string }[]
) {
    const startX = 14;
    const headerY = 32;
    const rowHeight = 7.5;
    const pageMaxY = 195;

    // Estimate pages
    const rowsPerPageFirst = Math.floor((pageMaxY - (headerY + 18)) / rowHeight);
    const rowsPerPageSubsequent = Math.floor((pageMaxY - 32) / rowHeight);
    const remainingRows = Math.max(0, rows.length - rowsPerPageFirst);
    const totalPages = 1 + (remainingRows > 0 ? Math.ceil(remainingRows / rowsPerPageSubsequent) : 0);

    let currentPage = 1;
    let currentY = headerY;

    // Page 1 Header
    drawPDFPageHeader(doc, schoolName, schoolCode, reportTitle, currentPage, totalPages);

    // Summary statistics chips on Page 1
    if (summaryStats && summaryStats.length > 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(startX, currentY, 269, 13, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.rect(startX, currentY, 269, 13, 'S');

        let statX = startX + 6;
        summaryStats.forEach(stat => {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.5);
            doc.setTextColor(100, 116, 139);
            doc.text(stat.label.toUpperCase(), statX, currentY + 5);

            doc.setFontSize(9);
            doc.setTextColor(15, 23, 42);
            doc.text(stat.value, statX, currentY + 10);
            statX += 58;
        });

        currentY += 17;
    }

    // Function to draw table header row
    const drawTableHeaderRow = (y: number) => {
        doc.setFillColor(30, 41, 59); // slate-800
        doc.rect(startX, y, 269, 8, 'F');

        let colX = startX;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);

        columns.forEach(col => {
            const align = col.align || 'left';
            const textX = align === 'right' ? colX + col.width - 2 : align === 'center' ? colX + (col.width / 2) : colX + 2;
            doc.text(col.header, textX, y + 5.5, { align });
            colX += col.width;
        });
        return y + 8;
    };

    currentY = drawTableHeaderRow(currentY);

    // Render Rows
    rows.forEach((row, rowIndex) => {
        if (currentY + rowHeight > pageMaxY) {
            drawPDFPageFooter(doc, currentPage, totalPages);
            doc.addPage('a4', 'landscape');
            currentPage++;
            drawPDFPageHeader(doc, schoolName, schoolCode, reportTitle, currentPage, totalPages);
            currentY = drawTableHeaderRow(30);
        }

        // Row background
        const isEven = rowIndex % 2 === 0;
        doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
        doc.rect(startX, currentY, 269, rowHeight, 'F');

        doc.setDrawColor(241, 245, 249);
        doc.line(startX, currentY + rowHeight, startX + 269, currentY + rowHeight);

        // Row cells
        let colX = startX;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(30, 41, 59);

        columns.forEach((col, colIdx) => {
            const val = String(row[colIdx] ?? '');
            const align = col.align || 'left';
            const textX = align === 'right' ? colX + col.width - 2 : align === 'center' ? colX + (col.width / 2) : colX + 2;
            
            // Truncate text if it exceeds column width
            const maxChars = Math.floor(col.width / 1.7);
            const displayVal = val.length > maxChars ? val.substring(0, maxChars - 2) + '..' : val;
            
            doc.text(displayVal, textX, currentY + 5, { align });
            colX += col.width;
        });

        currentY += rowHeight;
    });

    drawPDFPageFooter(doc, currentPage, totalPages);
}

export function generateStudentsPDF(students: Student[], schoolInfo?: SchoolInfo | null): jsPDF {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const schoolName = schoolInfo?.name || 'School Management System';
    const schoolCode = schoolInfo?.schoolCode || 'SCH-001';

    const columns: PDFCol[] = [
        { header: '#', width: 10, align: 'center' },
        { header: 'Adm No', width: 24 },
        { header: 'Full Name', width: 50 },
        { header: 'Class', width: 22 },
        { header: 'Status', width: 20 },
        { header: 'DoB', width: 22 },
        { header: 'Guardian Name', width: 44 },
        { header: 'Guardian Phone', width: 33 },
        { header: 'Fee Due (KES)', width: 24, align: 'right' }
    ];

    const totalBalance = students.reduce((sum, s) => sum + (s.balance || 0), 0);
    const activeCount = students.filter(s => (s.status || '').toLowerCase() === 'active').length;

    const summaryStats = [
        { label: 'Total Enrolled', value: `${students.length} Scholars` },
        { label: 'Active Status', value: `${activeCount} Active` },
        { label: 'Outstanding Balance', value: `KES ${totalBalance.toLocaleString()}` },
        { label: 'Backup Archive ID', value: `STU-${Date.now().toString().slice(-6)}` }
    ];

    const rows = students.map((s, idx) => [
        idx + 1,
        s.admissionNumber || '',
        s.name || '',
        s.class || s.classId || '',
        s.status || 'Active',
        s.dateOfBirth || '',
        s.guardianName || '',
        s.guardianContact || '',
        Number(s.balance || 0).toLocaleString()
    ]);

    renderTable(doc, columns, rows, schoolName, schoolCode, 'Scholar Registry Local Backup', summaryStats);
    return doc;
}

export function generateFeesPDF(transactions: Transaction[], schoolInfo?: SchoolInfo | null): jsPDF {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const schoolName = schoolInfo?.name || 'School Management System';
    const schoolCode = schoolInfo?.schoolCode || 'SCH-001';

    const columns: PDFCol[] = [
        { header: '#', width: 10, align: 'center' },
        { header: 'Date', width: 22 },
        { header: 'Scholar Name', width: 48 },
        { header: 'Type', width: 25 },
        { header: 'Method', width: 24 },
        { header: 'Reference Code', width: 36 },
        { header: 'Description / Purpose', width: 70 },
        { header: 'Amount (KES)', width: 34, align: 'right' }
    ];

    const totalRevenue = transactions
        .filter(t => t.type === 'Payment' || t.type === 'ManualCredit')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalInvoices = transactions
        .filter(t => t.type === 'Invoice' || t.type === 'ManualDebit')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

    const summaryStats = [
        { label: 'Total Ledger Entries', value: `${transactions.length} Records` },
        { label: 'Total Collected', value: `KES ${totalRevenue.toLocaleString()}` },
        { label: 'Total Invoiced', value: `KES ${totalInvoices.toLocaleString()}` },
        { label: 'Backup Archive ID', value: `FEE-${Date.now().toString().slice(-6)}` }
    ];

    const rows = transactions.map((t, idx) => [
        idx + 1,
        t.date || '',
        t.studentName || 'General Student',
        t.type || '',
        t.method || 'N/A',
        t.transactionCode || t.checkNumber || '—',
        t.description || 'Fee Transaction',
        Number(t.amount || 0).toLocaleString()
    ]);

    renderTable(doc, columns, rows, schoolName, schoolCode, 'Fees & Financial Ledger Backup', summaryStats);
    return doc;
}

export function generateStaffPDF(staff: Staff[], schoolInfo?: SchoolInfo | null): jsPDF {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const schoolName = schoolInfo?.name || 'School Management System';
    const schoolCode = schoolInfo?.schoolCode || 'SCH-001';

    const columns: PDFCol[] = [
        { header: '#', width: 10, align: 'center' },
        { header: 'Staff ID', width: 24 },
        { header: 'Full Name', width: 46 },
        { header: 'Role / Designation', width: 38 },
        { header: 'System Role', width: 24 },
        { header: 'Joined', width: 22 },
        { header: 'Bank Name', width: 32 },
        { header: 'Account No.', width: 33 },
        { header: 'Salary (KES)', width: 40, align: 'right' }
    ];

    const totalPayroll = staff.reduce((sum, s) => sum + (s.salary || 0), 0);

    const summaryStats = [
        { label: 'Total Personnel', value: `${staff.length} Staff` },
        { label: 'Monthly Payroll', value: `KES ${totalPayroll.toLocaleString()}` },
        { label: 'Average Remuneration', value: staff.length > 0 ? `KES ${Math.round(totalPayroll / staff.length).toLocaleString()}` : '0' },
        { label: 'Backup Archive ID', value: `STF-${Date.now().toString().slice(-6)}` }
    ];

    const rows = staff.map((st, idx) => [
        idx + 1,
        st.id || '',
        st.name || '',
        st.role || '',
        st.userRole || '',
        st.joinDate || '',
        st.bankName || '—',
        st.accountNumber || '—',
        Number(st.salary || 0).toLocaleString()
    ]);

    renderTable(doc, columns, rows, schoolName, schoolCode, 'Staff & Human Resource Roster Backup', summaryStats);
    return doc;
}

export function generateMasterBackupPDF(
    students: Student[],
    transactions: Transaction[],
    staff: Staff[],
    schoolInfo?: SchoolInfo | null
): jsPDF {
    // Generate multi-section comprehensive document
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const schoolName = schoolInfo?.name || 'School Management System';
    const schoolCode = schoolInfo?.schoolCode || 'SCH-001';
    const dateStr = new Date().toLocaleDateString();

    // Cover page / Executive summary
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 297, 210, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(255, 255, 255);
    doc.text(schoolName.toUpperCase(), 24, 45);

    doc.setFontSize(14);
    doc.setTextColor(56, 189, 248); // sky-400
    doc.text('INSTITUTIONAL MASTER DATABASE BACKUP ARCHIVE', 24, 56);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(203, 213, 225);
    doc.text(`Official Local Backup • Generated on ${dateStr} • School Code: ${schoolCode}`, 24, 66);

    // Summary boxes
    const cardData = [
        { label: 'SCHOLAR REGISTRY', val: `${students.length} Scholars`, sub: 'Complete student directory & fee balances' },
        { label: 'FEES & LEDGER', val: `${transactions.length} Transactions`, sub: 'Collections, billing, & financial logs' },
        { label: 'STAFF & HUMAN RESOURCE', val: `${staff.length} Personnel`, sub: 'Faculty, payroll & administration roster' }
    ];

    let cardX = 24;
    cardData.forEach(card => {
        doc.setFillColor(30, 41, 59); // slate-800
        doc.rect(cardX, 85, 78, 48, 'F');
        doc.setDrawColor(51, 65, 85);
        doc.rect(cardX, 85, 78, 48, 'S');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(148, 163, 184);
        doc.text(card.label, cardX + 8, 98);

        doc.setFontSize(16);
        doc.setTextColor(255, 255, 255);
        doc.text(card.val, cardX + 8, 112);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(card.sub, cardX + 8, 124);

        cardX += 86;
    });

    // Confidentiality Notice
    doc.setFillColor(30, 41, 59);
    doc.rect(24, 150, 250, 32, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(239, 68, 68);
    doc.text('SECURITY & REGULATORY COMPLIANCE NOTICE:', 32, 162);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text('This document contains confidential institutional records including student identification, guardian contacts, financial transactions,', 32, 170);
    doc.text('and staff remuneration details. Store securely on encrypted local backup media in compliance with national Data Protection regulations.', 32, 176);

    // Section 1: Students
    doc.addPage('a4', 'landscape');
    const studentCols: PDFCol[] = [
        { header: '#', width: 10, align: 'center' },
        { header: 'Adm No', width: 24 },
        { header: 'Full Name', width: 52 },
        { header: 'Class', width: 24 },
        { header: 'Status', width: 22 },
        { header: 'DoB', width: 24 },
        { header: 'Guardian Name', width: 44 },
        { header: 'Guardian Phone', width: 35 },
        { header: 'Fee Balance', width: 34, align: 'right' }
    ];
    const studentRows = students.map((s, idx) => [
        idx + 1,
        s.admissionNumber || '',
        s.name || '',
        s.class || s.classId || '',
        s.status || 'Active',
        s.dateOfBirth || '',
        s.guardianName || '',
        s.guardianContact || '',
        Number(s.balance || 0).toLocaleString()
    ]);
    renderTable(doc, studentCols, studentRows, schoolName, schoolCode, 'Section 1: Scholar Registry Records');

    // Section 2: Fees
    doc.addPage('a4', 'landscape');
    const feeCols: PDFCol[] = [
        { header: '#', width: 10, align: 'center' },
        { header: 'Date', width: 22 },
        { header: 'Scholar Name', width: 50 },
        { header: 'Type', width: 25 },
        { header: 'Method', width: 24 },
        { header: 'Reference', width: 38 },
        { header: 'Description', width: 66 },
        { header: 'Amount (KES)', width: 34, align: 'right' }
    ];
    const feeRows = transactions.map((t, idx) => [
        idx + 1,
        t.date || '',
        t.studentName || 'General Student',
        t.type || '',
        t.method || 'N/A',
        t.transactionCode || t.checkNumber || '—',
        t.description || 'Fee Transaction',
        Number(t.amount || 0).toLocaleString()
    ]);
    renderTable(doc, feeCols, feeRows, schoolName, schoolCode, 'Section 2: Fees & Financial Ledger Records');

    // Section 3: Staff
    doc.addPage('a4', 'landscape');
    const staffCols: PDFCol[] = [
        { header: '#', width: 10, align: 'center' },
        { header: 'Staff ID', width: 24 },
        { header: 'Full Name', width: 48 },
        { header: 'Role / Designation', width: 38 },
        { header: 'System Role', width: 24 },
        { header: 'Joined', width: 22 },
        { header: 'Bank Name', width: 32 },
        { header: 'Account No.', width: 33 },
        { header: 'Salary (KES)', width: 38, align: 'right' }
    ];
    const staffRows = staff.map((st, idx) => [
        idx + 1,
        st.id || '',
        st.name || '',
        st.role || '',
        st.userRole || '',
        st.joinDate || '',
        st.bankName || '—',
        st.accountNumber || '—',
        Number(st.salary || 0).toLocaleString()
    ]);
    renderTable(doc, staffCols, staffRows, schoolName, schoolCode, 'Section 3: Staff & Human Resource Records');

    return doc;
}
