
import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Student, Exam, Grade, Subject, GradingRule, SchoolInfo } from '../types';
import { GradingSystem, CBC_LEVEL_MAP } from '../types';
import Modal from '../components/common/Modal';
import { useData } from '../contexts/DataContext';
import * as api from '../services/api';
import Spinner from '../components/common/Spinner';

const ReportCardsView: React.FC = () => {
    const { schoolInfo } = useData();
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedExamId, setSelectedExamId] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [studentGrades, setStudentGrades] = useState<Grade[]>([]);
    const [loadingGrades, setLoadingGrades] = useState(false);

    const { data: classes = [] } = useQuery({ queryKey: ['classes'], queryFn: () => api.getClasses().then(res => Array.isArray(res) ? res : res.data) });
    const { data: exams = [] } = useQuery({ queryKey: ['exams'], queryFn: () => api.findAllExams() });
    const { data: subjects = [] } = useQuery({ queryKey: ['subjects'], queryFn: () => api.getSubjects().then(res => Array.isArray(res) ? res : res.data) });
    const { data: gradingScale = [] } = useQuery({ queryKey: ['grading-scale'], queryFn: () => api.getGradingScale() });

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
            <h2 className="text-3xl font-black text-slate-800 mb-6 tracking-tight uppercase">Performance Center</h2>
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
                                            className="px-8 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-primary-500/30"
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

    const subjectMap = new Map<string, Subject>(subjects.map((s:Subject) => [s.id, s]));
    
    const validGrades = grades.filter(g => g.score !== null || g.cbetScore !== null);
    const totalMarks = validGrades.reduce((sum, g) => sum + (g.score || 0), 0);
    const average = validGrades.length > 0 ? totalMarks / validGrades.length : 0;
    const meanGrade = gradingScale.find(r => average >= r.minScore && average <= r.maxScore)?.grade || 'N/A';

    const getTraditionalGrade = (score: number | null) => {
        if (score === null) return 'N/A';
        return gradingScale.find(r => score >= r.minScore && score <= r.maxScore)?.grade || 'N/A';
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Institutional Performance Data" size="3xl" footer={<button onClick={() => window.print()} className="px-10 py-4 bg-slate-900 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl no-print hover:scale-105 transition-all">Export Official PDF</button>}>
            {loading ? <div className="p-20 text-center"><Spinner /></div> : 
            <div className="printable-area p-6 bg-white text-slate-900 font-sans border-[6px] border-slate-50 m-2 min-h-[297mm]">
                
                <style>{`
                    @media print {
                        .printable-area { border: none !important; margin: 0 !important; padding: 0 !important; transform: scale(0.95); transform-origin: top center; }
                        @page { size: A4; margin: 10mm; }
                    }
                `}</style>

                {/* Header Branding - COMPACT */}
                <div className="flex items-center justify-between mb-8 border-b-2 border-slate-900 pb-4">
                    <div className="flex items-center gap-4">
                        {schoolInfo.logoUrl && <img src={schoolInfo.logoUrl} className="h-20 w-auto object-contain" alt="School Logo" crossOrigin="anonymous" />}
                        <div className="text-left">
                            <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-900 leading-none">{schoolInfo.name}</h1>
                            <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[8px] mt-1">{schoolInfo.address}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="px-4 py-1.5 bg-slate-900 text-white font-black uppercase tracking-[0.2em] text-[10px] skew-x-[-15deg]">
                            {exam.name}
                        </div>
                    </div>
                </div>

                {/* Identification Grid - COMPACT SINGLE ROW */}
                <div className="grid grid-cols-4 gap-4 mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="space-y-0.5">
                        <p className="text-[8px] font-black text-slate-400 uppercase">Scholar</p>
                        <p className="font-black text-slate-900 text-sm uppercase truncate">{student.name}</p>
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-[8px] font-black text-slate-400 uppercase">Adm No</p>
                        <p className="font-black text-primary-700 text-sm font-mono tracking-tighter">{student.admissionNumber}</p>
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-[8px] font-black text-slate-400 uppercase">Class</p>
                        <p className="font-black text-slate-800 text-sm uppercase">{student.class}</p>
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-[8px] font-black text-slate-400 uppercase">Term/Year</p>
                        <p className="font-black text-slate-800 text-sm">{new Date(exam.date).getFullYear()}</p>
                    </div>
                </div>
                
                {/* Academic Performance Matrix - REDUCED PADDING */}
                <div className="border-2 border-slate-900 rounded-2xl overflow-hidden shadow-lg bg-white mb-6">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="bg-slate-900 text-white">
                                <th className="p-3 font-black uppercase tracking-widest text-[9px] border-r border-slate-700">Area</th>
                                <th className="p-3 font-black uppercase tracking-widest text-[9px] border-r border-slate-700 text-center w-20">
                                    {schoolInfo.gradingSystem === GradingSystem.CBC ? 'Level' : 'Marks'}
                                </th>
                                <th className="p-3 font-black uppercase tracking-widest text-[9px] border-r border-slate-700 text-center w-20">
                                    {schoolInfo.gradingSystem === GradingSystem.CBC ? 'Points' : 'Grade'}
                                </th>
                                <th className="p-3 font-black uppercase tracking-widest text-[9px]">Remarks</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-bold uppercase">
                            {grades.map((g: Grade) => {
                                const subj = subjectMap.get(g.subjectId);
                                const levelInfo = g.cbetScore ? CBC_LEVEL_MAP[g.cbetScore] : null;

                                return (
                                    <tr key={g.id}>
                                        <td className="p-3 font-black text-slate-900 border-r border-slate-100">{subj?.name}</td>
                                        <td className="p-3 text-center font-black text-primary-700 border-r border-slate-100 text-base">
                                            {schoolInfo.gradingSystem === GradingSystem.CBC ? (g.cbetScore || '-') : (g.score !== null ? `${g.score}` : '-')}
                                        </td>
                                        <td className="p-3 text-center font-black text-slate-900 border-r border-slate-100 text-base">
                                            {schoolInfo.gradingSystem === GradingSystem.CBC ? (levelInfo?.points || '-') : getTraditionalGrade(g.score)}
                                        </td>
                                        <td className="p-3 font-bold text-slate-500 text-[9px] leading-tight normal-case">
                                            {schoolInfo.gradingSystem === GradingSystem.CBC ? (levelInfo?.description || '-') : (g.comments || '-')}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Aggregate Statistics - COMPACT */}
                {schoolInfo.gradingSystem === GradingSystem.Traditional && (
                    <div className="flex gap-4 mb-8 justify-center">
                        <div className="bg-slate-900 text-white px-6 py-3 rounded-xl text-center shadow-lg">
                            <p className="text-[8px] font-black uppercase tracking-widest mb-0.5 opacity-50">Total</p>
                            <p className="text-xl font-black">{totalMarks}</p>
                        </div>
                        <div className="bg-primary-600 text-white px-6 py-3 rounded-xl text-center shadow-lg">
                            <p className="text-[8px] font-black uppercase tracking-widest mb-0.5 opacity-70">Average</p>
                            <p className="text-xl font-black">{average.toFixed(1)}%</p>
                        </div>
                        <div className="bg-amber-500 text-white px-6 py-3 rounded-xl text-center shadow-lg">
                            <p className="text-[8px] font-black uppercase tracking-widest mb-0.5 opacity-80">Grade</p>
                            <p className="text-xl font-black">{meanGrade}</p>
                        </div>
                    </div>
                )}

                {/* Formal Endorsements - COMPACT */}
                <div className="mt-auto pt-6 border-t-2 border-slate-900 grid grid-cols-2 gap-10">
                    <div className="relative p-4 border-2 border-slate-100 rounded-2xl bg-slate-50/50">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Class Teacher Remarks</p>
                        <p className="text-sm text-slate-900 font-black italic leading-tight mb-6">
                            Excellent academic trajectory. Keep up the momentum.
                        </p>
                        <div className="border-t border-slate-300 pt-2">
                             <p className="text-[8px] text-slate-900 uppercase font-black">Signature & Date</p>
                        </div>
                    </div>
                    <div className="relative p-4 border-2 border-slate-100 rounded-2xl bg-slate-50/50 text-center">
                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Headteacher Official Stamp</p>
                         <div className="h-16 flex items-center justify-center opacity-10">
                             <div className="w-16 h-16 border-4 border-double border-slate-900 rounded-full flex items-center justify-center">
                                 <span className="text-[6px] font-black">VERIFIED</span>
                             </div>
                         </div>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-[8px] text-slate-300 font-black uppercase tracking-[0.5em]">Saaslink Education Intelligence &copy; {new Date().getFullYear()}</p>
                </div>
            </div>}
        </Modal>
    )
};

export default ReportCardsView;
