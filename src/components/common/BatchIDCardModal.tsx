import React, { useState, useMemo, useRef } from 'react';
import type { Student, SchoolClass, SchoolInfo } from '../../types';
import html2canvas from 'html2canvas';
import { 
    CARD_THEMES, 
    CardTheme, 
    exportBatchCardsPDF,
    FALLBACK_SCHOOL_INFO
} from '../../utils/idCardGenerator';
import { IDCardFrontView, IDCardBackView } from './IDCardRenderer';
import { 
    CreditCard, 
    Download, 
    Printer, 
    X, 
    Search, 
    Filter, 
    CheckSquare, 
    Square, 
    Layers, 
    Sparkles, 
    Palette, 
    Check,
    Users,
    ArrowRight
} from 'lucide-react';
import Spinner from './Spinner';

interface BatchIDCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    students: Student[];
    classes: SchoolClass[];
    schoolInfo?: SchoolInfo | null;
    initialClassId?: string;
    preSelectedStudentIds?: string[];
}

const BatchIDCardModal: React.FC<BatchIDCardModalProps> = ({
    isOpen,
    onClose,
    students,
    classes,
    schoolInfo,
    initialClassId,
    preSelectedStudentIds,
}) => {
    const safeSchoolInfo = schoolInfo || FALLBACK_SCHOOL_INFO;
    const [selectedClassId, setSelectedClassId] = useState<string>(initialClassId || 'all');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedTheme, setSelectedTheme] = useState<CardTheme>(CARD_THEMES.navy);
    
    // Selection state (set of student IDs)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
        if (preSelectedStudentIds && preSelectedStudentIds.length > 0) {
            return new Set(preSelectedStudentIds);
        }
        // Default to selecting all active students in initial class or first 24
        return new Set(students.map((s) => s.id));
    });

    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });

    const hiddenBatchStageRef = useRef<HTMLDivElement>(null);

    // Sync when preSelectedStudentIds changes
    React.useEffect(() => {
        if (preSelectedStudentIds && preSelectedStudentIds.length > 0) {
            setSelectedIds(new Set(preSelectedStudentIds));
        } else if (students.length > 0) {
            setSelectedIds(new Set(students.map(s => s.id)));
        }
    }, [preSelectedStudentIds, students]);

    // Filter students
    const filteredStudents = useMemo(() => {
        return students.filter((s) => {
            const matchesClass = selectedClassId === 'all' || s.classId === selectedClassId || s.class === selectedClassId;
            const matchesSearch = 
                !searchTerm ||
                s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesClass && matchesSearch;
        });
    }, [students, selectedClassId, searchTerm]);

    const selectedStudentsList = useMemo(() => {
        return students.filter((s) => selectedIds.has(s.id));
    }, [students, selectedIds]);

    if (!isOpen) return null;

    const academicYear = `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`;

    const toggleSelectStudent = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const selectAllFiltered = () => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            filteredStudents.forEach((s) => next.add(s.id));
            return next;
        });
    };

    const deselectAllFiltered = () => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            filteredStudents.forEach((s) => next.delete(s.id));
            return next;
        });
    };

    /**
     * Generate multi-page Batch PDF with all selected students
     */
    const handleDownloadBatchPDF = async () => {
        if (selectedStudentsList.length === 0) {
            alert('Please select at least one scholar to generate ID cards.');
            return;
        }

        setIsGenerating(true);
        const total = selectedStudentsList.length;
        setProgress({ current: 0, total });

        try {
            if (!hiddenBatchStageRef.current) throw new Error('Stage ref missing');

            const stageEl = hiddenBatchStageRef.current;
            const cardElements = stageEl.querySelectorAll('.batch-card-render');

            const renderedCards: { student: Student; frontDataUrl: string }[] = [];

            for (let i = 0; i < selectedStudentsList.length; i++) {
                const s = selectedStudentsList[i];
                setProgress({ current: i + 1, total });

                const cardEl = cardElements[i] as HTMLElement;
                if (!cardEl) continue;

                // Capture card
                const canvas = await html2canvas(cardEl, {
                    scale: 2.2,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    logging: false,
                });

                renderedCards.push({
                    student: s,
                    frontDataUrl: canvas.toDataURL('image/png'),
                });

                // Yield to allow UI update
                if (i % 2 === 0) {
                    await new Promise((r) => setTimeout(r, 20));
                }
            }

            const currentClassName = selectedClassId === 'all' 
                ? 'All_Classes' 
                : classes.find(c => c.id === selectedClassId)?.name || selectedClassId;

            exportBatchCardsPDF({
                cards: renderedCards,
                schoolInfo: safeSchoolInfo,
                className: currentClassName,
            });
        } catch (error) {
            console.error('Error in batch generation:', error);
            alert('Failed to generate batch ID cards. Please try again.');
        } finally {
            setIsGenerating(false);
            setProgress({ current: 0, total: 0 });
        }
    };

    /**
     * Direct browser printing of batch ID cards
     */
    const handlePrintBatch = () => {
        if (selectedStudentsList.length === 0) {
            alert('Please select at least one scholar to print ID cards.');
            return;
        }
        window.print();
    };

    return (
        <div className="fixed inset-0 bg-slate-950/85 z-50 flex items-center justify-center p-3 sm:p-6 backdrop-blur-md overflow-y-auto">
            {/* Dedicated Print stylesheet for multi-page batch ID cards printing */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden !important;
                    }
                    #print-batch-stage, #print-batch-stage * {
                        visibility: visible !important;
                    }
                    #print-batch-stage {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 10mm !important;
                        background: white !important;
                        display: block !important;
                        z-index: 9999999 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .print-page-break {
                        page-break-after: always !important;
                        break-after: page !important;
                    }
                    @page {
                        size: A4 portrait;
                        margin: 10mm;
                    }
                }
            `}</style>

            {/* Modal Dialog Card */}
            <div className="relative w-full max-w-6xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[95vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 backdrop-blur-sm shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-600/20 border border-primary-500/30 flex items-center justify-center text-primary-400">
                            <Layers className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-black text-white tracking-tight">
                                    Batch Student ID Card Studio
                                </h2>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-500/20 text-primary-300 border border-primary-500/30 uppercase">
                                    A4 8-Up Production
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 font-medium">
                                Generate, print, and download multiple standard CR80 scholar identity cards at once.
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

                {/* Filters & Selection Toolbar */}
                <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4 shrink-0">
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Class Dropdown */}
                        <div className="relative">
                            <select
                                id="batch-select-class"
                                value={selectedClassId}
                                onChange={(e) => setSelectedClassId(e.target.value)}
                                className="appearance-none bg-slate-800 text-slate-200 text-xs font-semibold px-3 py-2 pr-8 rounded-xl border border-slate-700 hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="all">All Classes & Grades</option>
                                {classes.map((cls) => (
                                    <option key={cls.id} value={cls.id}>
                                        {cls.name}
                                    </option>
                                ))}
                            </select>
                            <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>

                        {/* Search Input */}
                        <div className="relative w-48 sm:w-64">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                id="batch-search-students"
                                type="text"
                                placeholder="Search student name or admission..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-800 text-slate-200 text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-700 hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-slate-500"
                            />
                        </div>

                        {/* Selection buttons */}
                        <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
                            <button
                                onClick={selectAllFiltered}
                                className="px-2.5 py-1.5 text-xs font-bold rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1"
                            >
                                <CheckSquare className="w-3.5 h-3.5 text-primary-400" />
                                Select All ({filteredStudents.length})
                            </button>
                            <button
                                onClick={deselectAllFiltered}
                                className="px-2.5 py-1.5 text-xs font-bold rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors flex items-center gap-1"
                            >
                                <Square className="w-3.5 h-3.5" />
                                Clear
                            </button>
                        </div>
                    </div>

                    {/* Right side: Selected Count & Theme Selector */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-400">Card Theme:</span>
                            <div className="flex items-center gap-1.5">
                                {Object.values(CARD_THEMES).map((thm) => (
                                    <button
                                        key={thm.id}
                                        onClick={() => setSelectedTheme(thm)}
                                        className={`w-5 h-5 rounded-full transition-transform border-2 ${
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

                        <span className="px-3 py-1 rounded-lg text-xs font-black bg-primary-600/20 text-primary-300 border border-primary-500/30">
                            {selectedStudentsList.length} Selected
                        </span>
                    </div>
                </div>

                {/* Generation Progress Banner */}
                {isGenerating && (
                    <div className="px-6 py-3 bg-emerald-950/60 border-b border-emerald-800/80 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Spinner />
                            <div>
                                <span className="text-xs font-bold text-emerald-300 block">
                                    Rendering High-Resolution ID Cards ({progress.current} of {progress.total})...
                                </span>
                                <span className="text-[10px] text-emerald-400/80">
                                    Compiling 300DPI vector graphics and student credentials into multi-page A4 PDF...
                                </span>
                            </div>
                        </div>
                        <div className="w-32 bg-slate-800 rounded-full h-2 overflow-hidden border border-emerald-700/50">
                            <div 
                                className="bg-emerald-500 h-full transition-all duration-200" 
                                style={{ width: `${(progress.current / Math.max(progress.total, 1)) * 100}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Cards Grid Preview Area */}
                <div className="flex-1 p-6 overflow-y-auto min-h-[400px] bg-slate-950/40">
                    {filteredStudents.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center text-center">
                            <Users className="w-12 h-12 text-slate-600 mb-3" />
                            <h3 className="text-sm font-bold text-slate-300">No matching scholars found</h3>
                            <p className="text-xs text-slate-500 max-w-sm mt-1">
                                Adjust your class filter or search criteria to view student ID cards for batch production.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredStudents.map((s) => {
                                const isSelected = selectedIds.has(s.id);
                                return (
                                    <div
                                        key={s.id}
                                        onClick={() => toggleSelectStudent(s.id)}
                                        className={`cursor-pointer rounded-2xl p-2.5 transition-all border-2 relative group ${
                                            isSelected
                                                ? 'bg-slate-800/90 border-primary-500 shadow-xl'
                                                : 'bg-slate-900/40 border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-700'
                                        }`}
                                    >
                                        {/* Selection Checkbox Pill */}
                                        <div className="flex items-center justify-between mb-2 px-1">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                                                    isSelected ? 'bg-primary-600 text-white' : 'border border-slate-600'
                                                }`}>
                                                    {isSelected && <Check className="w-3.5 h-3.5" />}
                                                </div>
                                                <span className="text-xs font-bold text-white truncate max-w-[200px]">
                                                    {s.name}
                                                </span>
                                            </div>
                                            <span className="text-[10px] font-mono text-slate-400">
                                                {s.admissionNumber}
                                            </span>
                                        </div>

                                        {/* Scaled ID Card Front Preview */}
                                        <div className="w-full overflow-hidden rounded-xl bg-white flex justify-center py-2">
                                            <div className="scale-[0.56] origin-top-left w-[540px] h-[340px] mb-[-148px]">
                                                <IDCardFrontView
                                                    person={s}
                                                    isStudent={true}
                                                    schoolInfo={schoolInfo}
                                                    theme={selectedTheme}
                                                    academicYear={academicYear}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 backdrop-blur-sm flex flex-wrap items-center justify-between gap-3 shrink-0">
                    <div className="text-xs text-slate-400">
                        <span className="font-bold text-white">{selectedStudentsList.length}</span> of <span className="font-bold text-white">{students.length}</span> scholars selected for production.
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                            Cancel
                        </button>

                        <button
                            onClick={handlePrintBatch}
                            disabled={isGenerating || selectedStudentsList.length === 0}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-700 hover:bg-slate-600 disabled:opacity-50 transition-all shadow-sm"
                        >
                            <Printer className="w-4 h-4" />
                            Print Selected ({selectedStudentsList.length})
                        </button>

                        <button
                            onClick={handleDownloadBatchPDF}
                            disabled={isGenerating || selectedStudentsList.length === 0}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-all shadow-sm"
                        >
                            {isGenerating ? <Spinner /> : <Download className="w-4 h-4" />}
                            {isGenerating ? 'Compiling PDF...' : `Download Batch PDF (${selectedStudentsList.length})`}
                        </button>
                    </div>
                </div>
            </div>

            {/* Hidden Offscreen Container for Batch High-Resolution Captures */}
            <div
                ref={hiddenBatchStageRef}
                style={{
                    position: 'fixed',
                    left: '-9999px',
                    top: '0px',
                    width: '600px',
                    pointerEvents: 'none',
                    zIndex: -100,
                    opacity: 1,
                }}
            >
                {selectedStudentsList.map((s) => (
                    <div key={s.id} className="batch-card-render p-2 bg-white inline-block mb-4">
                        <IDCardFrontView
                            person={s}
                            isStudent={true}
                            schoolInfo={schoolInfo}
                            theme={selectedTheme}
                            academicYear={academicYear}
                        />
                    </div>
                ))}
            </div>

            {/* Dedicated Print Stage for Batch Printing (8 cards per page with clean CSS break) */}
            <div id="print-batch-stage" className="hidden">
                {Array.from({ length: Math.ceil(selectedStudentsList.length / 8) }).map((_, pageIndex) => {
                    const pageStudents = selectedStudentsList.slice(pageIndex * 8, (pageIndex + 1) * 8);
                    const totalPages = Math.ceil(selectedStudentsList.length / 8);

                    return (
                        <div key={pageIndex} className="print-page-break p-6">
                            {/* Sheet Header */}
                            <div className="border-b-2 border-slate-800 pb-2 mb-4 flex items-center justify-between text-slate-900">
                                <div>
                                    <h2 className="text-base font-black uppercase">{safeSchoolInfo.name}</h2>
                                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600">
                                        BATCH SCHOLAR IDENTIFICATION BADGES • A4 CUT-SHEET • PAGE {pageIndex + 1} OF {totalPages}
                                    </p>
                                </div>
                                <span className="text-[9px] font-mono font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                                    TOTAL {selectedStudentsList.length} BADGES
                                </span>
                            </div>

                            {/* 2x4 Grid of Cards for A4 Paper */}
                            <div className="grid grid-cols-2 gap-4 justify-items-center">
                                {pageStudents.map((s) => (
                                    <div key={s.id} className="flex flex-col items-center">
                                        <IDCardFrontView
                                            person={s}
                                            isStudent={true}
                                            schoolInfo={safeSchoolInfo}
                                            theme={selectedTheme}
                                            academicYear={academicYear}
                                            scale={0.92}
                                            showCutGuides={true}
                                        />
                                        <span className="text-[8px] font-mono text-slate-500 font-bold mt-1">
                                            {s.admissionNumber} • {s.name}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Sheet Footer */}
                            <div className="mt-4 pt-2 border-t border-slate-300 text-center text-[8px] text-slate-400">
                                Print at 100% scale (Do not fit to page). Cut precisely along dashed guidelines. Suitable for CR80 lamination.
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default BatchIDCardModal;
