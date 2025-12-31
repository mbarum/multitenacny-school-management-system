
import React, { useState, useMemo, useEffect } from 'react';
import type { Grade, Subject, Student, Exam } from '../../types';
import { ExamType, CbetScore, CBC_LEVEL_MAP } from '../../types';
import { useData } from '../../contexts/DataContext';
import * as api from '../../services/api';
import { useQuery } from '@tanstack/react-query';

const TeacherExaminationsView: React.FC = () => {
    const { updateGrades, assignedClass, currentUser, isLoading, addNotification } = useData();
    const [selectedExamId, setSelectedExamId] = useState<string>('');
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
    const [gradeEntries, setGradeEntries] = useState<Map<string, { score: number | null, cbetScore: CbetScore | null, comments: string }>>(new Map());
    const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
    
    // Queries
    const { data: exams = [] } = useQuery({ queryKey: ['exams'], queryFn: () => api.findAllExams() });
    const { data: assignments = [] } = useQuery({ queryKey: ['assignments'], queryFn: () => api.findAllAssignments().then(res => Array.isArray(res) ? res : res.data) });
    const { data: subjects = [] } = useQuery({ queryKey: ['subjects'], queryFn: () => api.getSubjects().then(res => Array.isArray(res) ? res : res.data) });
    const { data: studentsInClass = [] } = useQuery({
        queryKey: ['my-class-students', assignedClass?.id],
        queryFn: () => assignedClass 
            ? api.getStudents({ classId: assignedClass.id, status: 'Active', pagination: 'false' }).then(res => Array.isArray(res) ? res : res.data)
            : Promise.resolve([]),
        enabled: !!assignedClass
    });

    const { data: currentGrades = [], refetch: refetchGrades, isFetching: isFetchingGrades } = useQuery({
        queryKey: ['grades', selectedExamId, selectedSubjectId, assignedClass?.id],
        queryFn: () => (selectedExamId && selectedSubjectId && assignedClass)
            ? api.getGrades({ examId: selectedExamId, subjectId: selectedSubjectId, classId: assignedClass.id })
            : Promise.resolve([]),
        enabled: !!selectedExamId && !!selectedSubjectId && !!assignedClass
    });

    if (isLoading) return <div className="p-8 text-center text-slate-500">Loading Module...</div>;

    if (!assignedClass || !currentUser) {
         return (
            <div className="p-8 text-center text-slate-500 bg-white rounded-xl shadow m-8 border border-slate-100">
                <div className="bg-yellow-50 p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Access Denied</h3>
                <p className="max-w-md mx-auto">Please ensure you are assigned as a form teacher for your class in the administrator academics panel.</p>
            </div>
        );
    }

    const assignedSubjects = useMemo(() => {
        return (assignments as any[])
            .filter((a: any) => a.classId === assignedClass.id && a.teacherId === currentUser.id)
            .map((a: any) => subjects.find((s: any) => s.id === a.subjectId))
            .filter((s: any): s is Subject => !!s);
    }, [assignments, subjects, assignedClass.id, currentUser.id]);
    
    const selectedExam = useMemo(() => (exams as any[]).find((e: any) => e.id === selectedExamId), [exams, selectedExamId]);

    // Initialize state when grades are loaded
    useEffect(() => {
        if (selectedExamId && selectedSubjectId && currentGrades) {
            const newEntries = new Map<string, { score: number | null, cbetScore: CbetScore | null, comments: string }>();
            studentsInClass.forEach((student: Student) => {
                const existingGrade = currentGrades.find((g: Grade) => g.studentId === student.id);
                newEntries.set(student.id, {
                    score: existingGrade?.score ?? null,
                    cbetScore: existingGrade?.cbetScore ?? null,
                    comments: existingGrade?.comments ?? ''
                });
            });
            setGradeEntries(newEntries);
            setDirtyIds(new Set()); // Reset modified status
        }
    }, [currentGrades, studentsInClass, selectedExamId, selectedSubjectId]);
    
    const handleGradeChange = (studentId: string, value: Partial<{ score: number | null, cbetScore: CbetScore | null, comments: string }>) => {
        setGradeEntries(prev => {
            const newMap = new Map(prev);
            const current = (newMap.get(studentId) || { score: null, cbetScore: null, comments: '' }) as { score: number | null, cbetScore: CbetScore | null, comments: string };
            newMap.set(studentId, { ...current, ...value });
            return newMap;
        });
        setDirtyIds(prev => new Set(prev).add(studentId));
    };

    const handleClearRow = (studentId: string) => {
        handleGradeChange(studentId, { score: null, cbetScore: null, comments: '' });
    };

    const handleSaveGrades = () => {
        if (!selectedExamId || !selectedSubjectId) return;
        const newGrades: Grade[] = studentsInClass.map((student: Student) => {
            const entry = gradeEntries.get(student.id);
            const existingGrade = currentGrades.find((g: any) => g.studentId === student.id);
            return {
                id: existingGrade?.id || `grd-${student.id}-${selectedExamId}-${selectedSubjectId}`,
                studentId: student.id,
                examId: selectedExamId,
                subjectId: selectedSubjectId,
                score: entry?.score ?? null,
                cbetScore: entry?.cbetScore ?? null,
                comments: entry?.comments ?? ''
            };
        });
        updateGrades(newGrades).then(() => {
            addNotification("Assessment results saved successfully.", "success");
            refetchGrades();
        });
    };

    const assessedCount = useMemo(() => {
        return Array.from(gradeEntries.values()).filter((e: { score: number | null, cbetScore: CbetScore | null, comments: string }) => e.score !== null || e.cbetScore !== null).length;
    }, [gradeEntries]);

    const progress = studentsInClass.length > 0 ? (assessedCount / studentsInClass.length) * 100 : 0;
    
    return (
        <div className="p-6 md:p-8">
            <div className="flex justify-between items-end mb-2">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 tracking-tight">CBC Assessment Portal</h2>
                    <p className="text-slate-500">Entering results for <span className="font-bold text-primary-700">{assignedClass.name}</span>.</p>
                </div>
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Entry Progress</p>
                    <p className="text-2xl font-black text-primary-600">{Math.round(progress)}%</p>
                </div>
            </div>

            <div className="w-full bg-slate-200 h-2.5 rounded-full mb-8 overflow-hidden shadow-inner">
                <div className="bg-primary-500 h-full transition-all duration-1000 ease-out" style={{ width: `${progress}%` }}></div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100">
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-10">
                    <div className="flex-1">
                        <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">1. Select Assessment</label>
                        <select value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)} className="w-full p-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 transition-all outline-none bg-slate-50">
                            <option value="">Choose Exam...</option>
                            {exams.filter((e: any) => e.classId === assignedClass.id).map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">2. Select Learning Area</label>
                        <select value={selectedSubjectId} onChange={e => setSelectedSubjectId(e.target.value)} className="w-full p-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 transition-all outline-none bg-slate-50">
                            <option value="">Choose Subject...</option>
                            {assignedSubjects.map(s => <option key={s.id} value={s.id}>[{s.code}] {s.name}</option>)}
                        </select>
                    </div>
                </div>

                {selectedExamId && selectedSubjectId && selectedExam && (
                    <div className="animate-fade-in-up">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center">
                                <svg className="w-5 h-5 mr-2 text-primary-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/></svg>
                                Assessment Rubric
                            </h3>
                            <button onClick={() => refetchGrades()} className="text-sm text-primary-600 hover:bg-primary-50 px-3 py-1.5 rounded-lg font-bold flex items-center transition-colors">
                                <svg className={`w-4 h-4 mr-1.5 ${isFetchingGrades ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                Reload Data
                            </button>
                        </div>
                        <div className="overflow-x-auto rounded-2xl border border-slate-200">
                            <table className="w-full text-left table-auto">
                                <thead className="bg-slate-900 text-white">
                                    <tr>
                                        <th className="px-6 py-5 font-black uppercase tracking-widest text-xs">Student Name</th>
                                        <th className="px-6 py-5 font-black uppercase tracking-widest text-xs text-center w-72">{selectedExam?.type === ExamType.Traditional ? 'Score (%)' : 'Performance Level (1-8)'}</th>
                                        <th className="px-6 py-5 font-black uppercase tracking-widest text-xs">Descriptive Remarks</th>
                                        <th className="px-6 py-5 font-black uppercase tracking-widest text-xs text-center w-16">Clear</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {studentsInClass.map((student: any) => (
                                        <tr key={student.id} className={`transition-colors ${dirtyIds.has(student.id) ? 'bg-amber-50/70' : 'hover:bg-primary-50/30'}`}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    {dirtyIds.has(student.id) && <span className="w-2.5 h-2.5 bg-amber-500 rounded-full mr-3 animate-pulse ring-4 ring-amber-100"></span>}
                                                    <span className="font-bold text-slate-800 text-lg">{student.name}</span>
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-black uppercase tracking-tighter mt-1">{student.admissionNumber}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {selectedExam.type === ExamType.Traditional ? (
                                                    <input 
                                                        type="number"
                                                        value={gradeEntries.get(student.id)?.score ?? ''}
                                                        onChange={e => handleGradeChange(student.id, { score: e.target.value ? parseInt(e.target.value, 10) : null })}
                                                        className="w-full p-3 border rounded-xl text-center font-black text-xl text-primary-700 focus:ring-2 focus:ring-primary-500 outline-none shadow-inner"
                                                        placeholder="0-100"
                                                    />
                                                ) : (
                                                    <select
                                                        value={gradeEntries.get(student.id)?.cbetScore ?? ''}
                                                        onChange={e => handleGradeChange(student.id, { cbetScore: e.target.value as CbetScore })}
                                                        className="w-full p-3 border rounded-xl font-black text-primary-700 text-center focus:ring-2 focus:ring-primary-500 outline-none bg-white shadow-sm"
                                                    >
                                                        <option value="">- Level -</option>
                                                        {Object.values(CbetScore).map(level => (
                                                            <option key={level} value={level}>
                                                                {level} ({CBC_LEVEL_MAP[level].points} Pts)
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="text"
                                                    value={gradeEntries.get(student.id)?.comments ?? ''}
                                                    onChange={e => handleGradeChange(student.id, { comments: e.target.value })}
                                                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-slate-600 font-medium placeholder:italic"
                                                    placeholder="Personalized feedback..."
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button 
                                                    onClick={() => handleClearRow(student.id)} 
                                                    className="p-2.5 text-slate-300 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
                                                    title="Reset Row"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-between items-center mt-10 gap-6">
                            <p className="text-sm font-bold text-slate-500 italic">
                                {dirtyIds.size > 0 ? (
                                    <span className="flex items-center text-amber-600">
                                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                                        {dirtyIds.size} student record(s) modified. Save required.
                                    </span>
                                ) : 'Data is synchronized with server.'}
                            </p>
                            <div className="flex gap-4 w-full sm:w-auto">
                                <button 
                                    onClick={() => refetchGrades()}
                                    className="flex-1 sm:flex-none px-8 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase text-xs tracking-widest border border-slate-200"
                                >
                                    Reset All
                                </button>
                                <button 
                                    onClick={handleSaveGrades} 
                                    className="flex-1 sm:flex-none px-12 py-4 bg-primary-600 text-white font-black rounded-2xl shadow-2xl shadow-primary-500/40 hover:bg-primary-700 hover:-translate-y-1 transition-all active:scale-95 uppercase text-xs tracking-widest"
                                >
                                    Commit Assessment
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeacherExaminationsView;
