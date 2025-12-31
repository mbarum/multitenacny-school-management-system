
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
            <h2 className="text-3xl font-bold text-slate-800 mb-6 tracking-tight">Results Slip Generator</h2>
            <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 mb-8">
                <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex-1">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">1. Select Class / Level</label>
                        <select value={selectedClassId} onChange={e => {setSelectedClassId(e.target.value); setSelectedExamId('');}} className="w-full p-4 border border-slate-300 rounded-2xl bg-slate-50 focus:ring-2 focus:ring-primary-500 transition-all font-bold">
                            <option value="">Choose Class...</option>
                            {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">2. Select Assessment</label>
                        <select value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)} className="w-full p-4 border border-slate-300 rounded-2xl bg-slate-50 focus:ring-2 focus:ring-primary-500 transition-all font-bold" disabled={!selectedClassId}>
                            <option value="">Choose Assessment...</option>
                            {examsForClass.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {selectedExamId && (
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-fade-in-up">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900 text-white">
                            <tr>
                                <th className="px-8 py-5 font-black uppercase tracking-widest text-xs">Student Name</th>
                                <th className="px-8 py-5 font-black uppercase tracking-widest text-xs">Admission No</th>
                                <th className="px-8 py-5 font-black uppercase tracking-widest text-xs text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {studentsInClass.map((student: any) => (
                                <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-8 py-4 font-black text-slate-900 text-lg">{student.name}</td>
                                    <td className="px-8 py-4 font-mono font-bold text-primary-600">{student.admissionNumber}</td>
                                    <td className="px-8 py-4 text-center">
                                        <button 
                                            onClick={() => openReportCard(student)} 
                                            className="px-8 py-3 bg-primary-100 text-primary-700 rounded-full hover:bg-primary-600 hover:text-white font-black text-xs uppercase tracking-widest transition-all shadow-sm"
                                        >
                                            Preview Slip
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
    
    // Traditional Calc
    const validGrades = grades.filter(g => g.score !== null);
    const totalMarks = validGrades.reduce((sum, g) => sum + (g.score || 0), 0);
    const average = validGrades.length > 0 ? totalMarks / validGrades.length : 0;
    const meanGrade = gradingScale.find(r => average >= r.minScore && average <= r.maxScore)?.grade || 'N/A';

    const getTraditionalGrade = (score: number | null) => {
        if (score === null) return 'N/A';
        return gradingScale.find(r => score >= r.minScore && score <= r.maxScore)?.grade || 'N/A';
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Performance Report Card" size="3xl" footer={<button onClick={() => window.print()} className="px-10 py-4 bg-slate-900 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl no-print hover:scale-105 transition-all">Export PDF / Print</button>}>
            {loading ? <div className="p-20 text-center"><Spinner /></div> : 
            <div className="printable-area p-8 bg-white text-slate-900 font-sans border-8 border-slate-50 m-2">
                <div className="flex flex-col items-center text-center mb-12 border-b-4 border-slate-900 pb-10">
                    {schoolInfo.logoUrl && <img src={schoolInfo.logoUrl} className="h-32 w-auto mb-6 object-contain" alt="School Logo" crossOrigin="anonymous" />}
                    <h1 className="text-5xl font-black uppercase tracking-tighter text-slate-900 leading-none">{schoolInfo.name}</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-xs mt-3">{schoolInfo.address} | Tel: {schoolInfo.phone}</p>
                    <div className="mt-8 px-12 py-2 bg-primary-600 text-white font-black uppercase tracking-[0.2em] text-sm skew-x-[-12deg]">
                         {exam.name} Performance Slip
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16 bg-slate-50 p-10 rounded-[2rem] border-2 border-slate-100 relative">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Name</p>
                        <p className="font-extrabold text-slate-800 text-xl uppercase leading-none">{student.name}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Admission No</p>
                        <p className="font-bold text-primary-700 text-xl font-mono leading-none">{student.admissionNumber}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Class / Level</p>
                        <p className="font-extrabold text-slate-800 text-xl leading-none">{student.class}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Issue Date</p>
                        <p className="font-bold text-slate-800 text-xl leading-none">{new Date().toLocaleDateString()}</p>
                    </div>
                </div>
                
                <div className="border-2 border-slate-200 rounded-3xl overflow-hidden shadow-inner bg-white mb-12">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="bg-slate-900 text-white">
                                <th className="p-6 font-black uppercase tracking-widest text-[10px] border-r border-slate-700">Sub Code</th>
                                <th className="p-6 font-black uppercase tracking-widest text-[10px] border-r border-slate-700">Learning Area</th>
                                <th className="p-6 font-black uppercase tracking-widest text-[10px] border-r border-slate-700 text-center">
                                    {schoolInfo.gradingSystem === GradingSystem.CBC ? 'Level' : 'Marks'}
                                </th>
                                <th className="p-6 font-black uppercase tracking-widest text-[10px] border-r border-slate-700 text-center">
                                    {schoolInfo.gradingSystem === GradingSystem.CBC ? 'Points' : 'Grade'}
                                </th>
                                <th className="p-6 font-black uppercase tracking-widest text-[10px]">Remarks</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-slate-100">
                            {grades.map((g: Grade) => {
                                const subj = subjectMap.get(g.subjectId);
                                const levelInfo = g.cbetScore ? CBC_LEVEL_MAP[g.cbetScore] : null;

                                return (
                                    <tr key={g.id} className="hover:bg-primary-50/20 transition-colors">
                                        <td className="p-6 font-mono font-black text-slate-400 border-r border-slate-100">{subj?.code || '---'}</td>
                                        <td className="p-6 font-black text-slate-900 border-r border-slate-100 uppercase">{subj?.name}</td>
                                        <td className="p-6 text-center font-black text-primary-700 border-r border-slate-100 text-2xl">
                                            {schoolInfo.gradingSystem === GradingSystem.CBC ? (g.cbetScore || '-') : (g.score ? `${g.score}%` : '-')}
                                        </td>
                                        <td className="p-6 text-center font-black text-slate-900 border-r border-slate-100 text-2xl">
                                            {schoolInfo.gradingSystem === GradingSystem.CBC ? (levelInfo?.points || '-') : getTraditionalGrade(g.score)}
                                        </td>
                                        <td className="p-6 font-bold text-slate-500 uppercase text-[10px] leading-relaxed max-w-[200px]">
                                            {schoolInfo.gradingSystem === GradingSystem.CBC ? (levelInfo?.description || '-') : (g.comments || '-')}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {schoolInfo.gradingSystem === GradingSystem.Traditional && (
                    <div className="grid grid-cols-3 gap-10 mb-16 px-10">
                        <div className="bg-slate-900 text-white p-6 rounded-3xl text-center shadow-lg">
                            <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Total Aggregate</p>
                            <p className="text-3xl font-black">{totalMarks}</p>
                        </div>
                        <div className="bg-primary-600 text-white p-6 rounded-3xl text-center shadow-lg">
                            <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">Mean Average</p>
                            <p className="text-3xl font-black">{average.toFixed(1)}%</p>
                        </div>
                        <div className="bg-amber-500 text-white p-6 rounded-3xl text-center shadow-lg">
                            <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-90">Mean Grade</p>
                            <p className="text-3xl font-black">{meanGrade}</p>
                        </div>
                    </div>
                )}

                <div className="mt-20 pt-16 border-t-4 border-slate-900 grid grid-cols-1 md:grid-cols-2 gap-20">
                    <div className="relative p-8 border-4 border-slate-100 rounded-[2.5rem] bg-slate-50/30">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Headteacher's Comments</p>
                        <div className="h-20 flex items-center">
                            <p className="text-base text-slate-800 font-black leading-snug">
                                {schoolInfo.gradingSystem === GradingSystem.CBC 
                                    ? "Consistently meeting and exceeding core competencies." 
                                    : `Achieved a mean grade of ${meanGrade}. Maintain consistency in all subjects.`}
                            </p>
                        </div>
                        <div className="mt-12 pt-6 border-t-2 border-slate-300 w-full">
                            <p className="text-[10px] text-slate-900 uppercase font-black tracking-widest">Official Signatory & Date</p>
                        </div>
                    </div>
                    <div className="relative p-8 border-4 border-slate-100 rounded-[2.5rem] bg-slate-50/30 flex flex-col justify-between items-center text-center">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Institutional Stamp</p>
                            <div className="w-36 h-36 border-4 border-dashed border-slate-300 rounded-full flex items-center justify-center opacity-30">
                                <p className="text-[10px] font-black uppercase p-6">Official Seal</p>
                            </div>
                        </div>
                        <p className="text-[9px] font-black text-slate-400 mt-6 uppercase tracking-widest">Valid only with original stamp</p>
                    </div>
                </div>

                <div className="mt-24 pt-8 border-t-2 border-dashed border-slate-100 text-center">
                    <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.5em]">Saaslink Education Cloud Platform &copy; {new Date().getFullYear()}</p>
                </div>
            </div>}
        </Modal>
    )
};

export default ReportCardsView;
