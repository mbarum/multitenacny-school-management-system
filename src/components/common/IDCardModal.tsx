import React, { useState, useEffect, useRef } from 'react';
import type { Student, Staff, SchoolInfo } from '../../types';
import html2canvas from 'html2canvas';
import { 
    CARD_THEMES, 
    CardTheme, 
    exportSingleCardPDF, 
    triggerFileDownload,
    FALLBACK_SCHOOL_INFO,
    CARD_WIDTH_MM,
    CARD_HEIGHT_MM
} from '../../utils/idCardGenerator';
import { IDCardFrontView, IDCardBackView } from './IDCardRenderer';
import { 
    RotateCw, 
    Download, 
    Printer, 
    X, 
    Layers, 
    Check, 
    FileText, 
    Image, 
    Sparkles, 
    Eye,
    Palette,
    Info,
    CreditCard
} from 'lucide-react';
import Spinner from './Spinner';

interface IDCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: { type: 'student' | 'staff'; data: Student | Staff } | null;
    schoolInfo?: SchoolInfo | null;
}

const IDCardModal: React.FC<IDCardModalProps> = ({ isOpen, onClose, data, schoolInfo }) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const [viewMode, setViewMode] = useState<'flip' | 'dual' | 'preview'>('flip');
    const [selectedTheme, setSelectedTheme] = useState<CardTheme>(CARD_THEMES.navy);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingAction, setProcessingAction] = useState<string>('');
    const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);

    const exportFrontRef = useRef<HTMLDivElement>(null);
    const exportBackRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            setIsFlipped(false);
            setViewMode('flip');
            setDownloadMenuOpen(false);
        }
    }, [isOpen]);

    if (!isOpen || !data) return null;

    const isStudent = data.type === 'student';
    const person = data.data;
    const academicYear = `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`;
    const safeSchoolInfo = schoolInfo || FALLBACK_SCHOOL_INFO;

    /**
     * Render high-resolution canvas captures of both front and back
     */
    const captureCanvases = async (): Promise<{ frontDataUrl: string; backDataUrl: string } | null> => {
        if (!exportFrontRef.current || !exportBackRef.current) return null;

        const frontEl = exportFrontRef.current;
        const backEl = exportBackRef.current;

        // Ensure elements are rendered and fonts ready
        await document.fonts?.ready;
        await new Promise((r) => setTimeout(r, 150));

        const canvasOptions = {
            scale: 2.5, // Crisp 300DPI equivalent
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
        };

        const frontCanvas = await html2canvas(frontEl, canvasOptions);
        const backCanvas = await html2canvas(backEl, canvasOptions);

        return {
            frontDataUrl: frontCanvas.toDataURL('image/png'),
            backDataUrl: backCanvas.toDataURL('image/png'),
        };
    };

    /**
     * Download PDF (Standard A4 printable sheet or CR80 card)
     */
    const handleDownloadPDF = async (format: 'a4-sheet' | 'cr80-card') => {
        setIsProcessing(true);
        setProcessingAction(format === 'a4-sheet' ? 'Generating A4 PDF...' : 'Generating CR80 PDF...');
        setDownloadMenuOpen(false);

        try {
            const captures = await captureCanvases();
            if (!captures) throw new Error('Capture failed');

            exportSingleCardPDF({
                frontDataUrl: captures.frontDataUrl,
                backDataUrl: captures.backDataUrl,
                person,
                isStudent,
                schoolInfo: safeSchoolInfo,
                format,
            });
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF document. Please try again.');
        } finally {
            setIsProcessing(false);
            setProcessingAction('');
        }
    };

    /**
     * Download individual card images (PNG)
     */
    const handleDownloadImage = async (target: 'front' | 'back' | 'both') => {
        setIsProcessing(true);
        setProcessingAction('Rendering PNG image...');
        setDownloadMenuOpen(false);

        try {
            const captures = await captureCanvases();
            if (!captures) throw new Error('Capture failed');

            const sanitizedName = person.name.replace(/[^a-zA-Z0-9_-]/g, '_');
            const id = isStudent
                ? (person as Student).admissionNumber || 'ADM'
                : (person as Staff).id.substring(0, 6).toUpperCase();

            if (target === 'front') {
                triggerFileDownload(captures.frontDataUrl, `${sanitizedName}_${id}_ID_Front.png`);
            } else if (target === 'back') {
                triggerFileDownload(captures.backDataUrl, `${sanitizedName}_${id}_ID_Back.png`);
            } else {
                // Combine both images side by side on a clean canvas
                const imgFront = new window.Image();
                const imgBack = new window.Image();
                
                await Promise.all([
                    new Promise((resolve) => { imgFront.onload = resolve; imgFront.src = captures.frontDataUrl; }),
                    new Promise((resolve) => { imgBack.onload = resolve; imgBack.src = captures.backDataUrl; })
                ]);

                const combinedCanvas = document.createElement('canvas');
                const gap = 40;
                combinedCanvas.width = imgFront.width + imgBack.width + gap;
                combinedCanvas.height = Math.max(imgFront.height, imgBack.height);
                const ctx = combinedCanvas.getContext('2d');
                if (ctx) {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height);
                    ctx.drawImage(imgFront, 0, 0);
                    ctx.drawImage(imgBack, imgFront.width + gap, 0);
                    triggerFileDownload(combinedCanvas.toDataURL('image/png'), `${sanitizedName}_${id}_ID_Badge_Full.png`);
                }
            }
        } catch (error) {
            console.error('Error downloading image:', error);
            alert('Failed to export image. Please try again.');
        } finally {
            setIsProcessing(false);
            setProcessingAction('');
        }
    };

    /**
     * Trigger browser print dialog with dedicated print sheet
     */
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-3 sm:p-6 backdrop-blur-md overflow-y-auto">
            {/* Global Print Stylesheet for flawless isolation */}
            <style>{`
                .preserve-3d { transform-style: preserve-3d; }
                .perspective { perspective: 1200px; }
                .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
                .rotate-y-180 { transform: rotateY(180deg); }

                @media print {
                    /* Hide everything in the body except the dedicated print sheet */
                    body * {
                        visibility: hidden !important;
                    }
                    #print-id-card-stage, #print-id-card-stage * {
                        visibility: visible !important;
                    }
                    #print-id-card-stage {
                        position: fixed !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100vw !important;
                        height: 100vh !important;
                        margin: 0 !important;
                        padding: 15mm 20mm !important;
                        background: #ffffff !important;
                        display: flex !important;
                        flex-direction: column !important;
                        align-items: center !important;
                        justify-content: flex-start !important;
                        z-index: 9999999 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    @page {
                        size: A4 portrait;
                        margin: 10mm;
                    }
                }
            `}</style>

            {/* Modal Dialog Card */}
            <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[95vh]">
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 backdrop-blur-sm shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-600/20 border border-primary-500/30 flex items-center justify-center text-primary-400">
                            <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                                    {isStudent ? 'Scholar Identity Card' : 'Staff Identification Card'}
                                </h2>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-500/20 text-primary-300 border border-primary-500/30 uppercase">
                                    CR80 Standard
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 font-medium truncate max-w-xs sm:max-w-md">
                                {person.name} • {isStudent ? (person as Student).admissionNumber : 'Staff'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                            title="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Subheader Toolbar: View Modes & Theme Picker */}
                <div className="px-6 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
                    {/* View mode toggle */}
                    <div className="inline-flex rounded-xl bg-slate-800/80 p-1 border border-slate-700/60">
                        <button
                            onClick={() => setViewMode('flip')}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                                viewMode === 'flip'
                                    ? 'bg-primary-600 text-white shadow-xs'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <RotateCw className="w-3.5 h-3.5" />
                            3D Interactive
                        </button>
                        <button
                            onClick={() => setViewMode('dual')}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                                viewMode === 'dual'
                                    ? 'bg-primary-600 text-white shadow-xs'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <Layers className="w-3.5 h-3.5" />
                            Both Sides
                        </button>
                        <button
                            onClick={() => setViewMode('preview')}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                                viewMode === 'preview'
                                    ? 'bg-primary-600 text-white shadow-xs'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <Eye className="w-3.5 h-3.5" />
                            Print Sheet Preview
                        </button>
                    </div>

                    {/* Theme selector */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                            <Palette className="w-3.5 h-3.5" />
                            Theme:
                        </span>
                        <div className="flex items-center gap-1.5">
                            {Object.values(CARD_THEMES).map((thm) => (
                                <button
                                    key={thm.id}
                                    onClick={() => setSelectedTheme(thm)}
                                    className={`w-6 h-6 rounded-full transition-transform border-2 ${
                                        selectedTheme.id === thm.id
                                            ? 'scale-110 border-white shadow-md'
                                            : 'border-transparent opacity-70 hover:opacity-100'
                                    }`}
                                    style={{ backgroundColor: thm.primaryHex }}
                                    title={thm.name}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Card Stage Area */}
                <div className="flex-1 p-6 flex flex-col items-center justify-center overflow-y-auto min-h-[380px] bg-slate-950/40">
                    {/* View Mode: 3D FLIP */}
                    {viewMode === 'flip' && (
                        <div className="flex flex-col items-center">
                            <div className="perspective">
                                <div
                                    className={`relative w-[540px] h-[340px] transition-transform duration-700 preserve-3d ${
                                        isFlipped ? 'rotate-y-180' : ''
                                    }`}
                                >
                                    {/* Front */}
                                    <div className="absolute inset-0 backface-hidden">
                                        <IDCardFrontView
                                            person={person}
                                            isStudent={isStudent}
                                            schoolInfo={schoolInfo}
                                            theme={selectedTheme}
                                            academicYear={academicYear}
                                        />
                                    </div>
                                    {/* Back */}
                                    <div className="absolute inset-0 backface-hidden rotate-y-180">
                                        <IDCardBackView
                                            person={person}
                                            isStudent={isStudent}
                                            schoolInfo={schoolInfo}
                                            theme={selectedTheme}
                                            academicYear={academicYear}
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setIsFlipped(!isFlipped)}
                                className="mt-5 inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold text-slate-200 bg-slate-800/90 border border-slate-700 hover:bg-slate-700 hover:text-white transition-all shadow-md"
                            >
                                <RotateCw className={`w-3.5 h-3.5 transition-transform ${isFlipped ? 'rotate-180' : ''}`} />
                                {isFlipped ? 'Show Card Front' : 'Show Card Back (Terms & Signatures)'}
                            </button>
                        </div>
                    )}

                    {/* View Mode: DUAL (Side-by-side or stacked on mobile) */}
                    {viewMode === 'dual' && (
                        <div className="flex flex-col lg:flex-row items-center justify-center gap-6 max-w-full overflow-x-auto py-2">
                            <div className="flex flex-col items-center">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                                    Card Front Face
                                </span>
                                <IDCardFrontView
                                    person={person}
                                    isStudent={isStudent}
                                    schoolInfo={safeSchoolInfo}
                                    theme={selectedTheme}
                                    academicYear={academicYear}
                                />
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                                    Card Back Face
                                </span>
                                <IDCardBackView
                                    person={person}
                                    isStudent={isStudent}
                                    schoolInfo={safeSchoolInfo}
                                    theme={selectedTheme}
                                    academicYear={academicYear}
                                />
                            </div>
                        </div>
                    )}

                    {/* View Mode: PRINT PREVIEW (Simulated A4 Paper Layout) */}
                    {viewMode === 'preview' && (
                        <div className="w-full max-w-[620px] bg-white rounded-xl shadow-2xl p-6 text-slate-900 border border-slate-200">
                            <div className="border-b-2 border-primary-700 pb-2 mb-4 flex items-center justify-between">
                                <div>
                                    <h3 className="font-black text-sm uppercase text-primary-900 leading-tight">
                                        {safeSchoolInfo.name}
                                    </h3>
                                    <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">
                                        Official Scholar Identity Badge • Print & Cut Guide
                                    </p>
                                </div>
                                <span className="text-[8.5px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                                    A4 100% Scale
                                </span>
                            </div>

                            <div className="space-y-4 flex flex-col items-center">
                                <div>
                                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                                        <span>Face 1: Front</span>
                                        <span>CR80 (85.60 × 54.00 mm)</span>
                                    </div>
                                    <IDCardFrontView
                                        person={person}
                                        isStudent={isStudent}
                                        schoolInfo={schoolInfo}
                                        theme={selectedTheme}
                                        academicYear={academicYear}
                                        showCutGuides={true}
                                    />
                                </div>

                                <div>
                                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                                        <span>Face 2: Back (Reverse)</span>
                                        <span>CR80 (85.60 × 54.00 mm)</span>
                                    </div>
                                    <IDCardBackView
                                        person={person}
                                        isStudent={isStudent}
                                        schoolInfo={schoolInfo}
                                        theme={selectedTheme}
                                        academicYear={academicYear}
                                        showCutGuides={true}
                                    />
                                </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-[8px] text-slate-500">
                                <span>Instruction: Cut along outer dashed lines. Fits standard badge pouches.</span>
                                <span>Generated: {new Date().toLocaleDateString()}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Footer Controls */}
                <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 backdrop-blur-sm flex flex-wrap items-center justify-between gap-3 shrink-0">
                    <div className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Info className="w-4 h-4 text-primary-400 shrink-0" />
                        <span>Ready for high-resolution vector printing or standard badge lamination.</span>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Download Menu */}
                        <div className="relative">
                            <button
                                onClick={() => setDownloadMenuOpen(!downloadMenuOpen)}
                                disabled={isProcessing}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-all shadow-sm"
                            >
                                {isProcessing ? (
                                    <Spinner />
                                ) : (
                                    <Download className="w-4 h-4" />
                                )}
                                {isProcessing ? processingAction || 'Generating...' : 'Download Card...'}
                            </button>

                            {/* Dropdown Options */}
                            {downloadMenuOpen && (
                                <div className="absolute bottom-full right-0 mb-2 w-64 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-2 text-xs z-20 space-y-1">
                                    <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-700/60 mb-1">
                                        PDF Documents
                                    </div>
                                    <button
                                        onClick={() => handleDownloadPDF('a4-sheet')}
                                        className="w-full text-left px-3 py-2 rounded-xl text-slate-200 hover:bg-slate-700/80 hover:text-white flex items-center justify-between transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-emerald-400" />
                                            <div>
                                                <span className="font-bold block">A4 Print Sheet (PDF)</span>
                                                <span className="text-[10px] text-slate-400 block">With trim marks & instructions</span>
                                            </div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => handleDownloadPDF('cr80-card')}
                                        className="w-full text-left px-3 py-2 rounded-xl text-slate-200 hover:bg-slate-700/80 hover:text-white flex items-center justify-between transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="w-4 h-4 text-blue-400" />
                                            <div>
                                                <span className="font-bold block">CR80 Plastic Card (PDF)</span>
                                                <span className="text-[10px] text-slate-400 block">Exact 85.6 × 54mm card printer size</span>
                                            </div>
                                        </div>
                                    </button>

                                    <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-700/60 my-1 pt-1">
                                        Image Exports (PNG)
                                    </div>
                                    <button
                                        onClick={() => handleDownloadImage('front')}
                                        className="w-full text-left px-3 py-2 rounded-xl text-slate-200 hover:bg-slate-700/80 hover:text-white flex items-center gap-2 transition-colors"
                                    >
                                        <Image className="w-4 h-4 text-amber-400" />
                                        <span>Download Front Face (PNG)</span>
                                    </button>
                                    <button
                                        onClick={() => handleDownloadImage('back')}
                                        className="w-full text-left px-3 py-2 rounded-xl text-slate-200 hover:bg-slate-700/80 hover:text-white flex items-center gap-2 transition-colors"
                                    >
                                        <Image className="w-4 h-4 text-purple-400" />
                                        <span>Download Back Face (PNG)</span>
                                    </button>
                                    <button
                                        onClick={() => handleDownloadImage('both')}
                                        className="w-full text-left px-3 py-2 rounded-xl text-slate-200 hover:bg-slate-700/80 hover:text-white flex items-center gap-2 transition-colors"
                                    >
                                        <Layers className="w-4 h-4 text-indigo-400" />
                                        <span>Download Combined Badge (PNG)</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Print Button */}
                        <button
                            onClick={handlePrint}
                            disabled={isProcessing}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-primary-600 hover:bg-primary-500 disabled:opacity-50 transition-all shadow-sm"
                        >
                            <Printer className="w-4 h-4" />
                            Print Card
                        </button>
                    </div>
                </div>
            </div>

            {/* Hidden Offscreen Container for Ultra-High-Res HTML2Canvas Captures */}
            {/* Positioned offscreen but rendered with opacity: 1 so html2canvas computes perfect styles */}
            <div
                style={{
                    position: 'fixed',
                    left: '-9999px',
                    top: '0px',
                    width: '560px',
                    pointerEvents: 'none',
                    zIndex: -100,
                    opacity: 1,
                }}
            >
                <div ref={exportFrontRef} className="p-2 bg-white inline-block">
                    <IDCardFrontView
                        person={person}
                        isStudent={isStudent}
                        schoolInfo={safeSchoolInfo}
                        theme={selectedTheme}
                        academicYear={academicYear}
                    />
                </div>
                <div ref={exportBackRef} className="p-2 bg-white inline-block mt-4">
                    <IDCardBackView
                        person={person}
                        isStudent={isStudent}
                        schoolInfo={safeSchoolInfo}
                        theme={selectedTheme}
                        academicYear={academicYear}
                    />
                </div>
            </div>

            {/* Dedicated Print Sheet for window.print() */}
            <div id="print-id-card-stage" className="hidden">
                <div className="w-[600px] mx-auto text-slate-900 text-center mb-6">
                    <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-1">
                        {safeSchoolInfo.name}
                    </h2>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                        OFFICIAL IDENTITY BADGE • READY-TO-CUT REPRODUCTION SHEET
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {isStudent ? 'Scholar' : 'Staff'}: {person.name} • {isStudent ? (person as Student).admissionNumber : 'STF'} • Printed: {new Date().toLocaleDateString()}
                    </p>
                </div>

                <div className="flex flex-col items-center gap-8">
                    <div>
                        <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1 text-center">
                            FRONT SIDE (CR80: 85.60 × 54.00 MM)
                        </div>
                        <IDCardFrontView
                            person={person}
                            isStudent={isStudent}
                            schoolInfo={safeSchoolInfo}
                            theme={selectedTheme}
                            academicYear={academicYear}
                            showCutGuides={true}
                        />
                    </div>

                    <div>
                        <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1 text-center">
                            BACK SIDE (CR80: 85.60 × 54.00 MM)
                        </div>
                        <IDCardBackView
                            person={person}
                            isStudent={isStudent}
                            schoolInfo={safeSchoolInfo}
                            theme={selectedTheme}
                            academicYear={academicYear}
                            showCutGuides={true}
                        />
                    </div>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-300 w-[600px] mx-auto text-center text-[9px] text-slate-500">
                    <p className="font-semibold">
                        Lamination Instruction: Cut strictly along outer guidelines. Insert into standard 86 × 54 mm badge sleeve.
                    </p>
                    <p className="text-slate-400 mt-0.5">
                        School Contact: {safeSchoolInfo.phone} • {safeSchoolInfo.email} • {safeSchoolInfo.address}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default IDCardModal;
