import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import type { Student, Staff, SchoolInfo } from '../types';
import { GradingSystem } from '../types';

export const FALLBACK_SCHOOL_INFO: SchoolInfo = {
    id: 'sch-default',
    name: 'Excellence Academy',
    address: 'P.O. Box 40100, Academic Lane',
    phone: '+254 700 000 000',
    email: 'admin@school.ac.ke',
    schoolCode: 'SCH-01',
    gradingSystem: GradingSystem.CBC,
};

/**
 * Standard ISO/IEC 7810 ID-1 (CR80) card dimensions in millimeters
 */
export const CARD_WIDTH_MM = 85.6;
export const CARD_HEIGHT_MM = 54.0;
export const CARD_ASPECT_RATIO = CARD_WIDTH_MM / CARD_HEIGHT_MM; // ~1.585

export interface CardTheme {
    id: string;
    name: string;
    primaryHex: string;
    secondaryHex: string;
    textHex: string;
    badgeBg: string;
}

export const CARD_THEMES: Record<string, CardTheme> = {
    navy: {
        id: 'navy',
        name: 'School Navy',
        primaryHex: '#1e3a8a',
        secondaryHex: '#1e40af',
        textHex: '#ffffff',
        badgeBg: 'bg-blue-900',
    },
    emerald: {
        id: 'emerald',
        name: 'Emerald Green',
        primaryHex: '#065f46',
        secondaryHex: '#047857',
        textHex: '#ffffff',
        badgeBg: 'bg-emerald-800',
    },
    crimson: {
        id: 'crimson',
        name: 'Royal Maroon',
        primaryHex: '#881337',
        secondaryHex: '#9f1239',
        textHex: '#ffffff',
        badgeBg: 'bg-rose-900',
    },
    slate: {
        id: 'slate',
        name: 'Slate Charcoal',
        primaryHex: '#1e293b',
        secondaryHex: '#334155',
        textHex: '#ffffff',
        badgeBg: 'bg-slate-900',
    },
    purple: {
        id: 'purple',
        name: 'Imperial Purple',
        primaryHex: '#581c87',
        secondaryHex: '#6b21a8',
        textHex: '#ffffff',
        badgeBg: 'bg-purple-900',
    },
};

/**
 * Generate a deterministic SVG data URI for a clean initials avatar.
 * Guarantees zero CORS or canvas tainting issues during PDF/PNG exports.
 */
export function generateInitialsAvatar(name: string, bgHex: string = '#1e3a8a'): string {
    const cleanName = (name || 'Scholar').trim();
    const initials = cleanName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0]?.toUpperCase() || '')
        .join('') || 'SC';

    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
        <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="${bgHex}" />
                <stop offset="100%" stop-color="#0f172a" />
            </linearGradient>
        </defs>
        <rect width="200" height="200" fill="url(#grad)" rx="20" />
        <circle cx="100" cy="100" r="75" fill="rgba(255,255,255,0.08)" />
        <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" 
              font-family="system-ui, -apple-system, sans-serif" font-size="64" font-weight="bold" letter-spacing="2">
            ${initials}
        </text>
    </svg>`;

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Generate a deterministic Code-39 / Code-128 style barcode SVG
 */
export function generateBarcodeSVG(code: string, width = 280, height = 48): string {
    const cleanCode = (code || 'SCHOLAR-ID').toUpperCase();
    const bars: { width: number; isBlack: boolean }[] = [];
    
    // Start guard pattern
    bars.push({ width: 3, isBlack: true }, { width: 2, isBlack: false }, { width: 3, isBlack: true });

    for (let i = 0; i < cleanCode.length; i++) {
        const charCode = cleanCode.charCodeAt(i);
        const p1 = (charCode % 3) + 1;
        const p2 = ((charCode >> 1) % 3) + 1;
        const p3 = ((charCode >> 2) % 3) + 1;
        const p4 = ((charCode >> 3) % 2) + 1;

        bars.push(
            { width: p1, isBlack: true },
            { width: p2, isBlack: false },
            { width: p3, isBlack: true },
            { width: p4, isBlack: false }
        );
    }

    // Stop guard pattern
    bars.push({ width: 3, isBlack: true }, { width: 2, isBlack: false }, { width: 3, isBlack: true });

    const totalUnits = bars.reduce((acc, b) => acc + b.width, 0);
    const unitScale = width / Math.max(totalUnits, 1);

    let currentX = 0;
    const rects = bars.map((bar) => {
        const barW = bar.width * unitScale;
        const x = currentX;
        currentX += barW;
        if (bar.isBlack) {
            return `<rect x="${x.toFixed(1)}" y="0" width="${barW.toFixed(1)}" height="${height}" fill="#0f172a" />`;
        }
        return '';
    }).filter(Boolean).join('');

    return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        ${rects}
    </svg>`;
}

/**
 * Generate a scannable, standardized QR code data URL for student identity verification
 */
export async function generateStudentQRCode(
    person: Student | Staff,
    isStudent: boolean,
    schoolInfo?: SchoolInfo | null
): Promise<string> {
    const safeInfo = schoolInfo || FALLBACK_SCHOOL_INFO;
    try {
        const payload = isStudent
            ? JSON.stringify({
                type: 'STUDENT_ID',
                adm: (person as Student).admissionNumber,
                name: person.name,
                class: (person as Student).class,
                school: safeInfo.name,
                schoolCode: safeInfo.schoolCode || 'SCH',
                emergency: (person as Student).emergencyContact || (person as Student).guardianContact,
                issued: new Date().getFullYear(),
            })
            : JSON.stringify({
                type: 'STAFF_ID',
                id: (person as Staff).id.substring(0, 8).toUpperCase(),
                name: person.name,
                role: (person as Staff).role,
                school: safeInfo.name,
                schoolCode: safeInfo.schoolCode || 'SCH',
                issued: new Date().getFullYear(),
            });

        return await QRCode.toDataURL(payload, {
            width: 280,
            margin: 1,
            color: {
                dark: '#0f172a',
                light: '#ffffff',
            },
            errorCorrectionLevel: 'M',
        });
    } catch (err) {
        console.warn('Failed to generate QR code data URL:', err);
        return '';
    }
}

/**
 * Downloads a data URL or blob to the client with a descriptive filename
 */
export function triggerFileDownload(dataUrl: string, filename: string): void {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Export a single ID card to PDF with A4 Printable Sheet (with crop marks) or direct CR80 Card Size
 */
export function exportSingleCardPDF({
    frontDataUrl,
    backDataUrl,
    person,
    isStudent,
    schoolInfo,
    format = 'a4-sheet',
}: {
    frontDataUrl: string;
    backDataUrl: string;
    person: Student | Staff;
    isStudent: boolean;
    schoolInfo?: SchoolInfo | null;
    format?: 'a4-sheet' | 'cr80-card';
}): void {
    const safeSchoolInfo = schoolInfo || FALLBACK_SCHOOL_INFO;
    const sanitizedName = person.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const identifier = isStudent 
        ? (person as Student).admissionNumber || 'ADM' 
        : (person as Staff).id.substring(0, 6).toUpperCase();

    if (format === 'cr80-card') {
        // Exact CR80 dimensions (85.6mm x 54mm) for card printers
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: [CARD_HEIGHT_MM, CARD_WIDTH_MM], // height, width for landscape
        });

        // Page 1: Front
        pdf.addImage(frontDataUrl, 'PNG', 0, 0, CARD_WIDTH_MM, CARD_HEIGHT_MM);

        // Page 2: Back
        pdf.addPage([CARD_HEIGHT_MM, CARD_WIDTH_MM], 'landscape');
        pdf.addImage(backDataUrl, 'PNG', 0, 0, CARD_WIDTH_MM, CARD_HEIGHT_MM);

        pdf.save(`${sanitizedName}_${identifier}_CR80_ID_Card.pdf`);
        return;
    }

    // A4 Printable Sheet (210mm x 297mm)
    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    const pageWidth = 210;
    const marginX = 20;

    // Header Banner
    pdf.setFillColor(30, 58, 138); // Primary blue
    pdf.rect(0, 0, pageWidth, 24, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.text(safeSchoolInfo.name.toUpperCase(), pageWidth / 2, 11, { align: 'center' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.text('OFFICIAL IDENTITY CARD • PRODUCTION & PRINTING SHEET', pageWidth / 2, 18, { align: 'center' });

    // Scholar / Personnel Identity Summary Box
    pdf.setFillColor(248, 250, 252);
    pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(marginX, 32, pageWidth - 2 * marginX, 22, 2, 2, 'FD');

    pdf.setTextColor(15, 23, 42);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text(`${isStudent ? 'Scholar' : 'Staff'}: ${person.name}`, marginX + 6, 40);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(71, 85, 105);
    const subInfo = isStudent
        ? `Admission: ${(person as Student).admissionNumber}   |   Class: ${(person as Student).class}   |   Emergency: ${(person as Student).emergencyContact || 'N/A'}`
        : `Staff ID: STF-${(person as Staff).id.substring(0, 6).toUpperCase()}   |   Role: ${(person as Staff).role}   |   Joined: ${(person as Staff).joinDate || 'N/A'}`;
    pdf.text(subInfo, marginX + 6, 48);

    // Section Title
    pdf.setTextColor(30, 58, 138);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('READY-TO-PRINT CARD PLATES (CR80 STANDARD: 85.60 × 53.98 MM)', marginX, 64);

    // Front Card Placement
    const cardY1 = 70;
    const cardX1 = (pageWidth - CARD_WIDTH_MM) / 2;

    // Front Card Label
    pdf.setTextColor(100, 116, 139);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.text('CARD FRONT', cardX1, cardY1 - 2);

    // Front Card Image
    pdf.addImage(frontDataUrl, 'PNG', cardX1, cardY1, CARD_WIDTH_MM, CARD_HEIGHT_MM);

    // Front Cut marks (crop marks)
    drawCropMarks(pdf, cardX1, cardY1, CARD_WIDTH_MM, CARD_HEIGHT_MM);

    // Back Card Placement
    const cardY2 = cardY1 + CARD_HEIGHT_MM + 16;
    pdf.setTextColor(100, 116, 139);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.text('CARD BACK', cardX1, cardY2 - 2);

    // Back Card Image
    pdf.addImage(backDataUrl, 'PNG', cardX1, cardY2, CARD_WIDTH_MM, CARD_HEIGHT_MM);

    // Back Cut marks
    drawCropMarks(pdf, cardX1, cardY2, CARD_WIDTH_MM, CARD_HEIGHT_MM);

    // Printing Instructions Box at Bottom
    const noteY = cardY2 + CARD_HEIGHT_MM + 16;
    pdf.setFillColor(241, 245, 249);
    pdf.setDrawColor(203, 213, 225);
    pdf.roundedRect(marginX, noteY, pageWidth - 2 * marginX, 28, 2, 2, 'FD');

    pdf.setTextColor(30, 41, 59);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.text('PRINTING & LAMINATION INSTRUCTIONS:', marginX + 6, noteY + 6);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(71, 85, 105);
    pdf.text('1. In your printer settings, set Scale to "100%" or "Actual Size" (DO NOT select "Fit to Page").', marginX + 6, noteY + 12);
    pdf.text('2. Use standard 250–300 GSM photo cardstock or synthetic PVC ID paper for best results.', marginX + 6, noteY + 17);
    pdf.text('3. Cut precisely along the dashed corner crop guidelines, then fold or insert into standard CR80 badge sleeves.', marginX + 6, noteY + 22);

    // Footer
    pdf.setFontSize(7);
    pdf.setTextColor(148, 163, 184);
    const dateStr = new Date().toLocaleString();
    pdf.text(`Generated by ${safeSchoolInfo.name} Management System • ${dateStr}`, pageWidth / 2, 290, { align: 'center' });

    pdf.save(`${sanitizedName}_${identifier}_ID_Card.pdf`);
}

/**
 * Draw professional dashed crop / trim marks around an ID card boundary
 */
function drawCropMarks(pdf: jsPDF, x: number, y: number, width: number, height: number, lineLen = 4): void {
    pdf.setDrawColor(180, 190, 205);
    pdf.setLineWidth(0.25);

    // Top-left
    pdf.line(x - lineLen, y, x, y);
    pdf.line(x, y - lineLen, x, y);

    // Top-right
    pdf.line(x + width, y, x + width + lineLen, y);
    pdf.line(x + width, y - lineLen, x + width, y);

    // Bottom-left
    pdf.line(x - lineLen, y + height, x, y + height);
    pdf.line(x, y + height, x, y + height + lineLen);

    // Bottom-right
    pdf.line(x + width, y + height, x + width + lineLen, y + height);
    pdf.line(x + width, y + height, x + width, y + height + lineLen);

    // Subtle dashed border
    pdf.setDrawColor(220, 226, 235);
    pdf.setLineDashPattern([1.5, 1.5], 0);
    pdf.rect(x, y, width, height, 'S');
    pdf.setLineDashPattern([], 0); // Reset
}

/**
 * Export a batch of student ID cards to a multi-page A4 PDF (8 cards per page, 2 cols x 4 rows)
 */
export function exportBatchCardsPDF({
    cards,
    schoolInfo,
    className,
}: {
    cards: { student: Student; frontDataUrl: string }[];
    schoolInfo?: SchoolInfo | null;
    className?: string;
}): void {
    if (!cards || cards.length === 0) return;
    const safeSchoolInfo = schoolInfo || FALLBACK_SCHOOL_INFO;

    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const cardsPerPage = 8; // 2 cols x 4 rows
    const totalPages = Math.ceil(cards.length / cardsPerPage);

    const colWidth = CARD_WIDTH_MM; // 85.6 mm
    const rowHeight = CARD_HEIGHT_MM; // 54.0 mm
    const colGap = 12;
    const rowGap = 10;
    const startX = (pageWidth - (colWidth * 2 + colGap)) / 2; // ~13.4 mm
    const startY = 28; // Below header

    for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
        if (pageIdx > 0) {
            pdf.addPage('a4', 'portrait');
        }

        // Page Header
        pdf.setFillColor(30, 58, 138);
        pdf.rect(0, 0, pageWidth, 18, 'F');

        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10.5);
        pdf.text(safeSchoolInfo.name.toUpperCase(), 14, 8);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7.5);
        const sub = `SCHOLAR IDENTITY BADGES SHEET • ${className ? `CLASS: ${className.toUpperCase()}` : 'ALL CLASSES'} • PAGE ${pageIdx + 1} OF ${totalPages}`;
        pdf.text(sub, 14, 14);

        pdf.setFont('helvetica', 'bold');
        pdf.text(`TOTAL: ${cards.length} SCHOLARS`, pageWidth - 14, 11, { align: 'right' });

        // Render cards for this page
        const pageCards = cards.slice(pageIdx * cardsPerPage, (pageIdx + 1) * cardsPerPage);

        pageCards.forEach((cardItem, index) => {
            const col = index % 2;
            const row = Math.floor(index / 2);

            const x = startX + col * (colWidth + colGap);
            const y = startY + row * (rowHeight + rowGap);

            // Draw Card Front
            pdf.addImage(cardItem.frontDataUrl, 'PNG', x, y, colWidth, rowHeight);

            // Draw crop lines
            drawCropMarks(pdf, x, y, colWidth, rowHeight, 3);

            // Student Name tag underneath
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(6.5);
            pdf.setTextColor(51, 65, 85);
            const label = `${cardItem.student.admissionNumber} • ${cardItem.student.name.substring(0, 22)}`;
            pdf.text(label, x + colWidth / 2, y + rowHeight + 3.2, { align: 'center' });
        });

        // Page Footer
        pdf.setFontSize(6.5);
        pdf.setTextColor(148, 163, 184);
        pdf.text(
            `Print at 100% scale on A4 cardstock. Cut along guidelines. Generated: ${new Date().toLocaleDateString()}`,
            pageWidth / 2,
            pageHeight - 6,
            { align: 'center' }
        );
    }

    const classSlug = (className || 'All_Classes').replace(/[^a-zA-Z0-9_-]/g, '_');
    pdf.save(`Batch_Student_IDs_${classSlug}_${new Date().toISOString().split('T')[0]}.pdf`);
}
