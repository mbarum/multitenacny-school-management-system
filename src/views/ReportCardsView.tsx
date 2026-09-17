
import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Student, Exam, Grade, Subject, GradingRule, SchoolInfo } from '../types';
import { GradingSystem, CBC_LEVEL_MAP, CbetScore } from '../types';
import Modal from '../components/common/Modal';
import { useData } from '../contexts/DataContext';
import * as api from '../services/api';
import Spinner from '../components/common/Spinner';
import { Printer, Download, Award, School, CheckCircle, ShieldCheck, X, FileText } from 'lucide-react';

const ReportCardsView: React.FC = () => {
    const { schoolInfo, addNotification, updateSchoolInfo } = useData();
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedExamId, setSelectedExamId] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [studentGrades, setStudentGrades] = useState<Grade[]>([]);
    const [loadingGrades, setLoadingGrades] = useState(false);
    const [isSwitchingFramework, setIsSwitchingFramework] = useState(false);

    // Fix: Added explicit (res: any) type to then callbacks to resolve type inference issues.
    const { data: classes = [] } = useQuery({ queryKey: ['classes'], queryFn: () => api.getClasses().then((res: any) => Array.isArray(res) ? res : res.data) });
    const { data: exams = [] } = useQuery({ queryKey: ['exams'], queryFn: () => api.findAllExams() });
    const { data: subjects = [] } = useQuery({ queryKey: ['subjects'], queryFn: () => api.getSubjects().then((res: any) => Array.isArray(res) ? res : res.data) });
    const { data: gradingScale = [] } = useQuery({ queryKey: ['grading-scale'], queryFn: () => api.getGradingScale() });

    const handleSwitchFramework = async (system: GradingSystem) => {
        if (!schoolInfo || schoolInfo.gradingSystem === system) return;
        setIsSwitchingFramework(true);
        try {
            await updateSchoolInfo({ ...schoolInfo, gradingSystem: system });
            addNotification(`Active framework set to ${system === GradingSystem.CBC ? 'Competency-Based Curriculum (CBC)' : 'Traditional Numerical Scale'}`, 'success');
        } catch (e) {
            console.error(e);
            addNotification('Failed to switch evaluation framework', 'error');
        } finally {
            setIsSwitchingFramework(false);
        }
    };

    const { data: studentsInClass = [] } = useQuery({
        queryKey: ['students', selectedClassId],
        queryFn: () => api.getStudents({ classId: selectedClassId, pagination: 'false' }).then(res => Array.isArray(res) ? res : res.data),
        enabled: !!selectedClassId
    });

    const examsForClass = useMemo(() => {
        return (exams as any[]).filter((e: any) => e.classId === selectedClassId);
    }, [exams, selectedClassId]);
    
    const openReportCard = (student: Student) => {
        setSelectedStudent(student);
        setIsReportModalOpen(true);
    };

    useEffect(() => {
        if (isReportModalOpen && selectedStudent && selectedExamId) {
            setLoadingGrades(true);
            api.getGrades({ studentId: selectedStudent.id, examId: selectedExamId })
                .then(setStudentGrades)
                .catch(err => console.error("Failed to fetch grades", err))
                .finally(() => setLoadingGrades(false));
        }
    }, [isReportModalOpen, selectedStudent, selectedExamId]);

    const selectedExam = (exams as any[]).find((e: any) => e.id === selectedExamId);

    return (
        <div className="p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Performance Center</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Evaluation rubrics, assessment records, and official academic slips</p>
                </div>

                <div className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-2xl shadow-xs">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mr-1 hidden sm:inline">Active Evaluation Framework:</span>
                    <button
                        type="button"
                        id="btn-perf-switch-traditional"
                        disabled={isSwitchingFramework}
                        onClick={() => handleSwitchFramework(GradingSystem.Traditional)}
                        className={`px-3 py-1.5 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all cursor-pointer ${
                            schoolInfo?.gradingSystem === GradingSystem.Traditional
                                ? 'bg-primary-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                    >
                        Traditional (0-100%)
                    </button>
                    <button
                        type="button"
                        id="btn-perf-switch-cbc"
                        disabled={isSwitchingFramework}
                        onClick={() => handleSwitchFramework(GradingSystem.CBC)}
                        className={`px-3 py-1.5 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all cursor-pointer ${
                            schoolInfo?.gradingSystem === GradingSystem.CBC
                                ? 'bg-primary-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                    >
                        CBC (Rubric)
                    </button>
                </div>
            </div>

            <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 mb-10">
                <div className="flex flex-col md:flex-row gap-10">
                    <div className="flex-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">1. Select Target Grade</label>
                        <select value={selectedClassId} onChange={e => {setSelectedClassId(e.target.value); setSelectedExamId('');}} className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 focus:border-primary-500 transition-all font-black uppercase text-xs tracking-widest text-slate-700 outline-none">
                            <option value="">Choose Class...</option>
                            {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">2. Choose Assessment Cycle</label>
                        <select value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)} className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 focus:border-primary-500 transition-all font-black uppercase text-xs tracking-widest text-slate-700 outline-none" disabled={!selectedClassId}>
                            <option value="">Choose Assessment...</option>
                            {examsForClass.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {selectedExamId && (
                <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 animate-fade-in-up">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900 text-white">
                            <tr>
                                <th className="px-10 py-6 font-black uppercase tracking-widest text-[10px]">Academic Name</th>
                                <th className="px-10 py-6 font-black uppercase tracking-widest text-[10px]">Index Number</th>
                                <th className="px-10 py-6 font-black uppercase tracking-widest text-[10px] text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-bold">
                            {studentsInClass.map((student: any) => (
                                <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-10 py-5 font-black text-slate-800 text-lg uppercase">{student.name}</td>
                                    <td className="px-10 py-5 font-mono text-primary-700 font-black tracking-tight">{student.admissionNumber}</td>
                                    <td className="px-10 py-5 text-center">
                                        <button 
                                            onClick={() => openReportCard(student)} 
                                            className="px-8 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-primary-500/30 cursor-pointer"
                                        >
                                            Generate Slip
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {isReportModalOpen && selectedExam && schoolInfo && (
                <ReportCardModal 
                    isOpen={isReportModalOpen} 
                    onClose={() => setIsReportModalOpen(false)} 
                    student={selectedStudent} 
                    exam={selectedExam}
                    grades={studentGrades} 
                    subjects={subjects} 
                    gradingScale={gradingScale} 
                    schoolInfo={schoolInfo} 
                    loading={loadingGrades}
                />
            )}
        </div>
    );
};

interface ReportCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: Student | null;
    exam: Exam;
    grades: Grade[];
    subjects: Subject[];
    gradingScale: GradingRule[];
    schoolInfo: SchoolInfo;
    loading?: boolean;
}

const ReportCardModal: React.FC<ReportCardModalProps> = ({ isOpen, onClose, student, exam, grades, subjects, gradingScale, schoolInfo, loading }) => {
    if (!isOpen || !student) return null;

    const [viewMode, setViewMode] = useState<GradingSystem>(
        exam.type === 'CBC' ? GradingSystem.CBC : (schoolInfo.gradingSystem || GradingSystem.Traditional)
    );

    useEffect(() => {
        if (exam.type === 'CBC') {
            setViewMode(GradingSystem.CBC);
        } else {
            setViewMode(schoolInfo.gradingSystem || GradingSystem.Traditional);
        }
    }, [exam, schoolInfo]);

    const subjectMap = new Map<string, Subject>(subjects.map((s: Subject) => [s.id, s]));
    
    // Convert numerical mark to CBC rubric if needed
    const getCbcFromScore = (score: number | null): { level: CbetScore; points: number; description: string } | null => {
        if (score === null || isNaN(score)) return null;
        if (score >= 90) return { level: CbetScore.EE1, points: 8, description: 'Exceeding Expectation (High)' };
        if (score >= 75) return { level: CbetScore.EE2, points: 7, description: 'Exceeding Expectation (Low)' };
        if (score >= 65) return { level: CbetScore.ME1, points: 6, description: 'Meeting Expectation (High)' };
        if (score >= 50) return { level: CbetScore.ME2, points: 5, description: 'Meeting Expectation (Low)' };
        if (score >= 40) return { level: CbetScore.AE1, points: 4, description: 'Approaching Expectation (High)' };
        if (score >= 30) return { level: CbetScore.AE2, points: 3, description: 'Approaching Expectation (Low)' };
        if (score >= 20) return { level: CbetScore.BE1, points: 2, description: 'Below Expectation (High)' };
        return { level: CbetScore.BE2, points: 1, description: 'Below Expectation (Low)' };
    };

    // Convert CBC rubric to approximate mark if needed
    const getScoreFromCbc = (cbc?: CbetScore | null): number | null => {
        if (!cbc) return null;
        if (cbc === CbetScore.EE1) return 92;
        if (cbc === CbetScore.EE2) return 80;
        if (cbc === CbetScore.ME1) return 70;
        if (cbc === CbetScore.ME2) return 55;
        if (cbc === CbetScore.AE1) return 45;
        if (cbc === CbetScore.AE2) return 35;
        if (cbc === CbetScore.BE1) return 25;
        if (cbc === CbetScore.BE2) return 15;
        return null;
    };

    const validGrades = grades.filter(g => g.score !== null || g.cbetScore !== null);
    
    // Traditional aggregates
    const totalMarks = validGrades.reduce((sum, g) => sum + (g.score !== null ? g.score : (getScoreFromCbc(g.cbetScore) || 0)), 0);
    const maxPossibleMarks = validGrades.length * 100;
    const average = validGrades.length > 0 ? totalMarks / validGrades.length : 0;
    const meanGrade = gradingScale.find(r => average >= r.minScore && average <= r.maxScore)?.grade || (average >= 80 ? 'A' : average >= 65 ? 'B' : average >= 50 ? 'C' : average >= 40 ? 'D' : 'E');

    // CBC aggregates
    const totalCbcPoints = validGrades.reduce((sum, g) => {
        const pts = g.cbetScore ? (CBC_LEVEL_MAP[g.cbetScore]?.points || 0) : (getCbcFromScore(g.score)?.points || 0);
        return sum + pts;
    }, 0);
    const avgCbcPoints = validGrades.length > 0 ? totalCbcPoints / validGrades.length : 0;
    const meanCbcLevel = avgCbcPoints >= 7.0 ? 'Exceeding Expectations (EE)' :
                         avgCbcPoints >= 5.0 ? 'Meeting Expectations (ME)' :
                         avgCbcPoints >= 3.0 ? 'Approaching Expectations (AE)' : 'Below Expectations (BE)';

    const getTraditionalGrade = (score: number | null) => {
        if (score === null) return 'N/A';
        return gradingScale.find(r => score >= r.minScore && score <= r.maxScore)?.grade || (score >= 80 ? 'A' : score >= 65 ? 'B' : score >= 50 ? 'C' : score >= 40 ? 'D' : 'E');
    };

    const handlePrintOrDownload = () => {
        window.print();
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Official Student Result Slip" 
            size="5xl" 
            footer={
                <div className="flex flex-wrap items-center justify-between w-full gap-3 no-print">
                    <div className="text-xs text-slate-500 font-medium flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>Formatted for standard A4 printing & PDF document generation.</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                            Close
                        </button>
                        <button 
                            type="button" 
                            onClick={handlePrintOrDownload} 
                            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                        >
                            <Printer className="w-4 h-4" />
                            <span>Print Slip</span>
                        </button>
                        <button 
                            type="button" 
                            onClick={handlePrintOrDownload} 
                            className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-primary-600/20 transition-all cursor-pointer"
                        >
                            <Download className="w-4 h-4" />
                            <span>Download PDF</span>
                        </button>
                    </div>
                </div>
            }
        >
            {/* Scoped print stylesheet ensuring zero modal backdrop/overlay during print */}
            <style>{`
                @media print {
                    /* Hide EVERYTHING outside the exam result slip */
                    html, body {
                        background: #ffffff !important;
                        color: #0f172a !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                        height: auto !important;
                        overflow: visible !important;
                    }
                    body * {
                        visibility: hidden !important;
                    }
                    /* Un-hide only the result slip and its children */
                    #exam-result-slip,
                    #exam-result-slip * {
                        visibility: visible !important;
                    }
                    #exam-result-slip {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        margin: 0 !important;
                        padding: 6mm 10mm !important;
                        border: none !important;
                        box-shadow: none !important;
                        background: #ffffff !important;
                        page-break-inside: avoid !important;
                    }
                    /* Completely remove modals, backdrop dimmers, blurred layers */
                    .no-print,
                    .no-print *,
                    .no-print-backdrop,
                    [role="dialog"] {
                        display: none !important;
                        background: transparent !important;
                        backdrop-filter: none !important;
                        -webkit-backdrop-filter: none !important;
                        box-shadow: none !important;
                        border: none !important;
                    }
                    @page {
                        size: A4 portrait;
                        margin: 8mm 10mm;
                    }
                }
            `}</style>

            {loading ? (
                <div className="p-20 text-center flex flex-col items-center justify-center">
                    <Spinner />
                    <p className="text-xs text-slate-500 mt-4 font-bold uppercase tracking-wider">Generating certified academic slip...</p>
                </div>
            ) : (
                <div className="w-full">
                    {/* View Controls Toolbar (Interactive on screen, completely hidden on print) */}
                    <div className="no-print mb-6 p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Evaluation Rubric:</span>
                            <div className="inline-flex bg-white rounded-xl p-1 border border-slate-200 shadow-xs">
                                <button
                                    type="button"
                                    onClick={() => setViewMode(GradingSystem.Traditional)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        viewMode === GradingSystem.Traditional
                                            ? 'bg-primary-600 text-white shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    Standard Marks (0–100%)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode(GradingSystem.CBC)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        viewMode === GradingSystem.CBC
                                            ? 'bg-primary-600 text-white shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    CBC Competency Rubric
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handlePrintOrDownload}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                            >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Print</span>
                            </button>
                            <button
                                type="button"
                                onClick={handlePrintOrDownload}
                                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                            >
                                <Download className="w-3.5 h-3.5" />
                                <span>Download PDF</span>
                            </button>
                        </div>
                    </div>

                    {/* Official Document Sheet Preview (Screen & Print Target) */}
                    <div 
                        id="exam-result-slip" 
                        className="bg-white text-slate-900 font-sans border border-slate-200 rounded-xl shadow-sm p-6 sm:p-8 max-w-[210mm] mx-auto text-left"
                    >
                        {/* 1. Official Institutional Header */}
                        <div className="flex items-center justify-between gap-6 pb-4 border-b-2 border-slate-900">
                            <div className="flex items-center gap-4">
                                {schoolInfo.logoUrl ? (
                                    <img 
                                        src={schoolInfo.logoUrl} 
                                        className="h-16 w-16 object-contain rounded-lg border border-slate-200 p-1" 
                                        alt="School Crest" 
                                        crossOrigin="anonymous" 
                                    />
                                ) : (
                                    <div className="w-16 h-16 rounded-lg bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-600 font-black text-xl">
                                        <School className="w-8 h-8 text-primary-700" />
                                    </div>
                                )}
                                <div>
                                    <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900 leading-tight">
                                        {schoolInfo.name || 'SaasLink Academy'}
                                    </h1>
                                    <p className="text-xs italic text-slate-600 font-serif mt-0.5">
                                        "{schoolInfo.motto || 'Striving for Academic Excellence and Character Integrity'}"
                                    </p>
                                    <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                                        {schoolInfo.address || 'P.O. Box 45120-00100, Nairobi, Kenya'} &bull; Phone: {schoolInfo.phone || '+254 720 935 895'}
                                    </p>
                                    <p className="text-[11px] text-slate-500">
                                        Email: {schoolInfo.email || 'info@saaslink.co.ke'} &bull; MOE/KNEC Code: {schoolInfo.schoolCode || 'SCH-2026-01'}
                                    </p>
                                </div>
                            </div>
                            <div className="hidden sm:block text-right shrink-0">
                                <div className="border border-slate-300 rounded-lg p-2.5 bg-slate-50 text-center">
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Academic Year</p>
                                    <p className="text-base font-black text-slate-900">{new Date(exam.date).getFullYear()}</p>
                                    <p className="text-[10px] font-bold text-primary-700 uppercase">{exam.term || 'Term 1'}</p>
                                </div>
                            </div>
                        </div>

                        {/* 2. Official Slip Banner */}
                        <div className="my-4 py-2 px-3 bg-slate-100 border border-slate-300 rounded-lg text-center">
                            <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-900">
                                Official Student Academic Performance & Exam Result Slip
                            </h2>
                            <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider mt-0.5">
                                Series: {exam.name} &bull; Curriculum: {viewMode === GradingSystem.CBC ? 'CBC Competency Rubric' : 'Traditional Scale (8-4-4)'}
                            </p>
                        </div>

                        {/* 3. Student Particulars Table */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                            <div>
                                <span className="block text-[10px] font-bold uppercase text-slate-500">Student Name</span>
                                <span className="font-extrabold text-slate-900 text-sm">{student.name}</span>
                            </div>
                            <div>
                                <span className="block text-[10px] font-bold uppercase text-slate-500">Admission Number</span>
                                <span className="font-mono font-black text-primary-700 text-sm">{student.admissionNumber}</span>
                            </div>
                            <div>
                                <span className="block text-[10px] font-bold uppercase text-slate-500">Grade / Class</span>
                                <span className="font-bold text-slate-800 text-sm">{student.class}</span>
                            </div>
                            <div>
                                <span className="block text-[10px] font-bold uppercase text-slate-500">Date of Issue</span>
                                <span className="font-semibold text-slate-700 text-sm">
                                    {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                            </div>
                        </div>

                        {/* 4. Examination Results Table */}
                        <div className="mb-6 overflow-x-auto">
                            <table className="w-full border-collapse border border-slate-300 text-left text-xs">
                                <thead>
                                    <tr className="bg-slate-100 border-b border-slate-300 text-slate-900">
                                        <th className="p-2.5 border-r border-slate-300 w-10 text-center font-bold">#</th>
                                        <th className="p-2.5 border-r border-slate-300 font-bold">Learning Area / Subject</th>
                                        <th className="p-2.5 border-r border-slate-300 text-center w-24 font-bold">
                                            {viewMode === GradingSystem.CBC ? 'CBC Rubric' : 'Score (%)'}
                                        </th>
                                        <th className="p-2.5 border-r border-slate-300 text-center w-20 font-bold">
                                            {viewMode === GradingSystem.CBC ? 'Points' : 'Grade'}
                                        </th>
                                        <th className="p-2.5 border-r border-slate-300 font-bold hidden sm:table-cell">
                                            Performance Descriptor
                                        </th>
                                        <th className="p-2.5 font-bold">Teacher Remarks</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {grades.map((g: Grade, idx: number) => {
                                        const subj = subjectMap.get(g.subjectId);
                                        const fallbackCbc = getCbcFromScore(g.score);
                                        const levelInfo = g.cbetScore ? CBC_LEVEL_MAP[g.cbetScore] : fallbackCbc;
                                        const numericScore = g.score !== null ? g.score : getScoreFromCbc(g.cbetScore);
                                        const cbcDisplayLevel = g.cbetScore || (fallbackCbc ? fallbackCbc.level : '-');
                                        const isEven = idx % 2 === 0;

                                        return (
                                            <tr key={g.id} className={`border-b border-slate-200 ${isEven ? 'bg-white' : 'bg-slate-50/50'}`}>
                                                <td className="p-2.5 text-center font-medium text-slate-500 border-r border-slate-200">
                                                    {idx + 1}
                                                </td>
                                                <td className="p-2.5 font-bold text-slate-900 border-r border-slate-200">
                                                    {subj?.name || 'Academic Discipline'}
                                                </td>
                                                <td className="p-2.5 text-center font-black text-slate-900 border-r border-slate-200 text-sm">
                                                    {viewMode === GradingSystem.CBC ? (
                                                        <span className="font-mono text-primary-700">{cbcDisplayLevel}</span>
                                                    ) : (
                                                        numericScore !== null ? `${numericScore}%` : '-'
                                                    )}
                                                </td>
                                                <td className="p-2.5 text-center font-black text-slate-900 border-r border-slate-200 text-sm">
                                                    {viewMode === GradingSystem.CBC 
                                                        ? (levelInfo?.points || '-') 
                                                        : getTraditionalGrade(numericScore)}
                                                </td>
                                                <td className="p-2.5 text-[11px] text-slate-600 border-r border-slate-200 hidden sm:table-cell">
                                                    {viewMode === GradingSystem.CBC 
                                                        ? (levelInfo?.description || 'Competency Achieved') 
                                                        : (numericScore !== null && numericScore >= 80 ? 'Exemplary Mastery' : numericScore !== null && numericScore >= 65 ? 'High Proficiency' : numericScore !== null && numericScore >= 50 ? 'Satisfactory' : 'Developing')}
                                                </td>
                                                <td className="p-2.5 text-[11px] text-slate-700 italic">
                                                    {g.comments || (
                                                        numericScore !== null && numericScore >= 80 ? 'Excellent performance; keeps high focus.' :
                                                        numericScore !== null && numericScore >= 60 ? 'Consistent progress, maintain regular study.' :
                                                        'Encouraged to seek revision guidance.'
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-slate-100 border-t-2 border-slate-900 font-bold text-slate-900">
                                        <td colSpan={2} className="p-2.5 text-right uppercase tracking-wider border-r border-slate-300">
                                            Summary Performance Total:
                                        </td>
                                        <td className="p-2.5 text-center border-r border-slate-300 text-sm font-black text-primary-800">
                                            {viewMode === GradingSystem.CBC ? `${totalCbcPoints} pts` : `${totalMarks} / ${maxPossibleMarks}`}
                                        </td>
                                        <td className="p-2.5 text-center border-r border-slate-300 text-sm font-black">
                                            {viewMode === GradingSystem.CBC ? `${avgCbcPoints.toFixed(1)} / 4.0` : meanGrade}
                                        </td>
                                        <td colSpan={2} className="p-2.5 text-slate-700 text-xs font-semibold">
                                            Overall Assessment: <strong>{viewMode === GradingSystem.CBC ? meanCbcLevel : `Mean Score: ${average.toFixed(1)}%`}</strong>
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* 5. Summary Performance Metrics Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                            <div className="p-3 border border-slate-200 bg-slate-50 rounded-lg text-center">
                                <span className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">Total Marks</span>
                                <span className="text-lg font-black text-slate-900">
                                    {viewMode === GradingSystem.CBC ? `${totalCbcPoints} Pts` : `${totalMarks}`}
                                </span>
                            </div>
                            <div className="p-3 border border-slate-200 bg-slate-50 rounded-lg text-center">
                                <span className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">Mean Percentage</span>
                                <span className="text-lg font-black text-primary-700">{average.toFixed(1)}%</span>
                            </div>
                            <div className="p-3 border border-slate-200 bg-slate-50 rounded-lg text-center">
                                <span className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">Overall Grade</span>
                                <span className="text-lg font-black text-emerald-700">
                                    {viewMode === GradingSystem.CBC ? meanCbcLevel.split(' ')[0] : meanGrade}
                                </span>
                            </div>
                            <div className="p-3 border border-slate-200 bg-slate-50 rounded-lg text-center">
                                <span className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">Subjects Evaluated</span>
                                <span className="text-lg font-black text-slate-800">{validGrades.length} Subjects</span>
                            </div>
                        </div>

                        {/* 6. Institutional Remarks & Endorsements */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 pt-4 border-t border-slate-200 text-xs">
                            {/* Class Teacher Remarks */}
                            <div className="p-3 border border-slate-200 rounded-lg bg-white flex flex-col justify-between">
                                <div>
                                    <h4 className="font-bold uppercase tracking-wider text-[10px] text-slate-500 mb-1">
                                        Class Teacher's Evaluative Remarks
                                    </h4>
                                    <p className="italic text-slate-800 text-[11px] leading-relaxed">
                                        {average >= 75
                                            ? "Exemplary scholastic diligence and disciplined attitude throughout the term."
                                            : average >= 55
                                            ? "Very good progress observed. Consistent revision will unlock higher performance."
                                            : "Satisfactory effort. Needs focused remedial practice in core numerical concepts."}
                                    </p>
                                </div>
                                <div className="mt-6 pt-2 border-t border-slate-200 flex justify-between text-[10px] text-slate-500">
                                    <span>Signature: ________________</span>
                                    <span>Date: {new Date().toLocaleDateString('en-GB')}</span>
                                </div>
                            </div>

                            {/* Headteacher Endorsement */}
                            <div className="p-3 border border-slate-200 rounded-lg bg-white flex flex-col justify-between">
                                <div>
                                    <h4 className="font-bold uppercase tracking-wider text-[10px] text-slate-500 mb-1">
                                        Head of School / Principal Endorsement
                                    </h4>
                                    <p className="italic text-slate-800 text-[11px] leading-relaxed">
                                        {average >= 70
                                            ? "Promoted with distinction. Commendable academic maturity and character conduct."
                                            : average >= 50
                                            ? "Promoted to next grade level. Well done; sustain this positive trajectory."
                                            : "Recommended for scheduled holiday remedial support before resumption."}
                                    </p>
                                </div>
                                <div className="mt-6 pt-2 border-t border-slate-200 flex justify-between text-[10px] text-slate-500">
                                    <span>Signature: ________________</span>
                                    <span>Date: {new Date().toLocaleDateString('en-GB')}</span>
                                </div>
                            </div>

                            {/* Official Stamp Box */}
                            <div className="p-3 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 flex flex-col items-center justify-center text-center min-h-[90px]">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    Official School Seal / Rubber Stamp
                                </span>
                                <div className="w-14 h-14 rounded-full border border-slate-300 border-dashed my-1 flex items-center justify-center text-[9px] text-slate-400 font-bold uppercase">
                                    SEAL
                                </div>
                                <span className="text-[9px] text-slate-400">Date Verified: {new Date().toLocaleDateString('en-GB')}</span>
                            </div>
                        </div>

                        {/* 7. Grading Reference Key & Next Term Notice */}
                        <div className="pt-3 border-t border-slate-200 text-[10px] text-slate-500 space-y-1.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="font-bold text-slate-700">GRADING REFERENCE KEY:</span>
                                <span>
                                    <strong>8-4-4:</strong> A (80-100% Distinction), B (65-79% Credit), C (50-64% Pass), D (35-49% Weak), E (&lt;35% Fail)
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <span>
                                    <strong>CBC RUBRIC:</strong> EE (Exceeding Expectations: 75-100%), ME (Meeting Expectations: 50-74%), AE (Approaching: 35-49%), BE (Below: 0-34%)
                                </span>
                                <span className="font-bold text-slate-800">
                                    Next Term Commences: {new Date(new Date().setMonth(new Date().getMonth() + 2)).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                            </div>
                            <div className="text-center pt-2 text-[9px] text-slate-400">
                                This transcript is an authentic certified institutional academic record generated via SaasLink School Management System &copy; {new Date().getFullYear()}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default ReportCardsView;
