
import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Exam, Grade, SchoolClass, Student, Subject } from '../types';
import { ExamType, CbetScore } from '../types';
import Modal from '../components/common/Modal';
import { useData } from '../contexts/DataContext';
import * as api from '../services/api';

const ManageExamsView: React.FC<any> = ({ exams, classes, openModal }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold">Exam List</h3><button onClick={() => openModal(null)} className="px-4 py-2 bg-primary-600 text-white rounded-lg">Create Exam</button></div>
        <table className="w-full text-left"><thead><tr className="bg-slate-50 border-b"><th>Name</th><th>Date</th><th>Class</th><th>Type</th><th>Actions</th></tr></thead>
            <tbody>{exams.map((exam: Exam) => (<tr key={exam.id} className="border-b"><td className="p-2">{exam.name}</td><td className="p-2">{new Date(exam.date).toLocaleDateString()}</td><td className="p-2">{classes.find((c:SchoolClass)=>c.id===exam.classId)?.name}</td><td className="p-2">{exam.type}</td><td className="p-2"><button onClick={() => openModal(exam)} className="text-blue-600">Edit</button></td></tr>))}</tbody>
        </table>
    </div>
);

const EnterGradesView: React.FC<any> = ({selectedExamId, setSelectedExamId, selectedClassId, setSelectedClassId, selectedSubjectId, setSelectedSubjectId, exams, classes, subjects, handleSaveGrades, selectedExamType}) => {
    // Local state for fetching students
    const [studentsInClass, setStudentsInClass] = useState<Student[]>([]);
    const [gradeEntries, setGradeEntries] = useState<Map<string, { score: number | null, cbetScore: CbetScore | null, comments: string }>>(new Map());
    const [activeGradingFormat, setActiveGradingFormat] = useState<ExamType>(selectedExamType || ExamType.Traditional);

    useEffect(() => {
        if (selectedExamType) {
            setActiveGradingFormat(selectedExamType);
        }
    }, [selectedExamType]);

    useEffect(() => {
        if (selectedClassId) {
            api.getStudents({ classId: selectedClassId, status: 'Active', pagination: 'false' }).then((res: any) => {
                setStudentsInClass(Array.isArray(res) ? res : res.data);
            });
        }
    }, [selectedClassId]);

    useEffect(() => {
        if (selectedExamId && selectedSubjectId && selectedClassId) {
            api.getGrades({ examId: selectedExamId, subjectId: selectedSubjectId, classId: selectedClassId }).then((grades: Grade[]) => {
                const newEntries = new Map<string, { score: number | null, cbetScore: CbetScore | null, comments: string }>();
                studentsInClass.forEach(student => {
                    const existingGrade = grades.find(g => g.studentId === student.id);
                    newEntries.set(student.id, { 
                        score: existingGrade?.score ?? null, 
                        cbetScore: existingGrade?.cbetScore ?? null, 
                        comments: existingGrade?.comments ?? '' 
                    });
                });
                setGradeEntries(newEntries);
            });
        }
    }, [selectedExamId, selectedSubjectId, selectedClassId, studentsInClass]);

    const handleGradeChange = (studentId: string, value: Partial<{ score: number | null, cbetScore: CbetScore | null, comments: string }>) => {
        setGradeEntries((prev: Map<string, { score: number | null, cbetScore: CbetScore | null, comments: string }>) => {
            const newMap = new Map(prev);
            const current = newMap.get(studentId) || { score: null, cbetScore: null, comments: '' };
            
            const updated = {
                score: value.score !== undefined ? value.score : current.score,
                cbetScore: value.cbetScore !== undefined ? value.cbetScore : current.cbetScore,
                comments: value.comments !== undefined ? value.comments : current.comments
            };
            
            newMap.set(studentId, updated);
            return newMap;
        });
    };

    const handleSave = () => {
        const gradesPayload = studentsInClass.map(student => {
             const entry = gradeEntries.get(student.id);
             const data = entry || { score: null, cbetScore: null, comments: '' };
             
             return {
                 studentId: student.id,
                 examId: selectedExamId,
                 subjectId: selectedSubjectId,
                 score: data.score ?? null,
                 cbetScore: data.cbetScore ?? null,
                 comments: data.comments ?? ''
             } as Grade;
        });
        handleSaveGrades(gradesPayload);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <select value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)} className="p-2 border rounded"><option value="">Select Exam</option>{exams.map((e:Exam) => <option key={e.id} value={e.id}>{e.name} ({classes.find((c:SchoolClass)=>c.id===e.classId)?.name})</option>)}</select>
                <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} className="p-2 border rounded" disabled={!selectedExamId}><option value="">Select Class</option>{classes.map((c:SchoolClass) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                <select value={selectedSubjectId} onChange={e => setSelectedSubjectId(e.target.value)} className="p-2 border rounded" disabled={!selectedClassId}><option value="">Select Subject</option>{subjects.map((s:Subject) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
            </div>
            {selectedSubjectId && <>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-500 uppercase">Assessment Rubric Mode:</span>
                    <div className="inline-flex bg-slate-100 p-1 rounded-xl">
                        <button
                            type="button"
                            onClick={() => setActiveGradingFormat(ExamType.Traditional)}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                activeGradingFormat === ExamType.Traditional ? 'bg-primary-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Traditional Marks (0–100%)
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveGradingFormat(ExamType.CBC)}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                activeGradingFormat === ExamType.CBC ? 'bg-primary-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            CBC Competency Levels
                        </button>
                    </div>
                </div>
                <table className="w-full text-left"><thead><tr className="bg-slate-50 border-b"><th>Student</th><th>{activeGradingFormat === ExamType.Traditional ? 'Score (%)' : 'Performance Level'}</th><th>Comments</th></tr></thead>
                    <tbody>{studentsInClass.map((student:Student) => (<tr key={student.id} className="border-b"><td className="p-2">{student.name}</td>
                        <td className="p-2">
                             <div className="flex space-x-2 items-center">
                                {activeGradingFormat === ExamType.Traditional ? (
                                    <input 
                                        type="number" 
                                        placeholder="Score"
                                        value={gradeEntries.get(student.id)?.score ?? ''} 
                                        onChange={e => handleGradeChange(student.id, { score: e.target.value ? parseFloat(e.target.value) : null })} 
                                        className="w-20 p-1 border rounded"
                                    />
                                ) : (
                                    <select 
                                        value={gradeEntries.get(student.id)?.cbetScore ?? ''} 
                                        onChange={e => handleGradeChange(student.id, { cbetScore: e.target.value as CbetScore })} 
                                        className="p-1 border rounded text-sm w-32"
                                    >
                                        <option value="">- Level -</option>
                                        {Object.values(CbetScore).map(v => <option key={v} value={v}>{v}</option>)}
                                    </select>
                                )}
                            </div>
                        </td>
                        <td className="p-2"><input type="text" value={gradeEntries.get(student.id)?.comments || ''} onChange={e => handleGradeChange(student.id, { comments: e.target.value })} className="w-full p-1 border rounded"/></td></tr>))}</tbody>
                </table>
                <div className="flex justify-end mt-4"><button onClick={handleSave} className="px-4 py-2 bg-primary-600 text-white rounded cursor-pointer">Save Grades</button></div>
            </>}
        </div>
    );
};

const ExamModal: React.FC<any> = ({ isOpen, onClose, onSave, data, classes }) => {
    const [formData, setFormData] = useState({ name: data?.name || '', date: data?.date || '', classId: data?.classId || '', type: data?.type || ExamType.Traditional });
    
    useEffect(() => {
        if (data) {
            setFormData({ name: data.name || '', date: data.date || '', classId: data.classId || '', type: data.type || ExamType.Traditional });
        } else {
            setFormData({ name: '', date: '', classId: '', type: ExamType.Traditional });
        }
    }, [data, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
    return <Modal isOpen={isOpen} onClose={onClose} title={data ? "Edit Exam" : "Create Exam"}><form onSubmit={e => {e.preventDefault(); onSave(formData)}} className="space-y-4">
        <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Assessment Name</label>
            <input name="name" value={formData.name} onChange={handleChange} placeholder="Exam Name" className="w-full p-2.5 border rounded-lg" required/>
        </div>
        <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Exam Date</label>
            <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full p-2.5 border rounded-lg" required/>
        </div>
        <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Target Class</label>
            <select name="classId" value={formData.classId} onChange={handleChange} className="w-full p-2.5 border rounded-lg" required><option value="">Select Class</option>{classes.map((c:SchoolClass) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        </div>
        <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Evaluation Rubric</label>
            <div className="grid grid-cols-2 gap-3">
                <button
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, type: ExamType.Traditional }))}
                    className={`p-3 rounded-xl border-2 text-left font-bold text-xs transition-all cursor-pointer ${
                        formData.type === ExamType.Traditional
                            ? 'border-primary-600 bg-primary-50/70 text-primary-900 shadow-xs ring-1 ring-primary-500/20'
                            : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                >
                    <p className="text-xs font-bold">Traditional Marks</p>
                    <p className="text-[10px] text-slate-500 font-normal mt-0.5">Numeric score 0–100%</p>
                </button>
                <button
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, type: ExamType.CBC }))}
                    className={`p-3 rounded-xl border-2 text-left font-bold text-xs transition-all cursor-pointer ${
                        formData.type === ExamType.CBC
                            ? 'border-primary-600 bg-primary-50/70 text-primary-900 shadow-xs ring-1 ring-primary-500/20'
                            : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                >
                    <p className="text-xs font-bold">CBC Rubrics</p>
                    <p className="text-[10px] text-slate-500 font-normal mt-0.5">Competency performance levels</p>
                </button>
            </div>
        </div>
        <div className="flex justify-end pt-2"><button type="submit" className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer">Save Exam</button></div>
    </form></Modal>
};

const ExaminationsView: React.FC = () => {
    const { addNotification } = useData();
    const queryClient = useQueryClient();
    
    // Queries
    const { data: exams = [] } = useQuery({ queryKey: ['exams'], queryFn: () => api.findAllExams() });
    // Fix: Added explicit (res: any) type to then callbacks to resolve type inference issues.
    const { data: classes = [] } = useQuery({ queryKey: ['classes'], queryFn: () => api.getClasses().then((res: any) => Array.isArray(res) ? res : res.data) });
    const { data: subjects = [] } = useQuery({ queryKey: ['subjects'], queryFn: () => api.getSubjects().then((res: any) => Array.isArray(res) ? res : res.data) });

    const [activeTab, setActiveTab] = useState('manage');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExam, setEditingExam] = useState<Exam | null>(null);

    // Grade entry state
    const [selectedExamId, setSelectedExamId] = useState('');
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    
    const selectedExam = useMemo(() => exams.find((e: any) => e.id === selectedExamId), [exams, selectedExamId]);

    // Mutations
    const updateExamsMutation = useMutation({
        mutationFn: (data: Exam[]) => api.updateExams(data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['exams'] }); setIsModalOpen(false); addNotification("Exam saved.", "success"); }
    });
    
    const updateGradesMutation = useMutation({
        mutationFn: (data: Grade[]) => api.updateGrades(data),
        onSuccess: () => { addNotification("Grades saved.", "success"); }
    });

    const handleSaveExam = (formData: Omit<Exam, 'id'>) => {
        let updatedExams;
        if (editingExam) {
            updatedExams = exams.map((e: any) => e.id === editingExam.id ? { ...editingExam, ...formData } : e);
        } else {
            updatedExams = [...exams, { ...formData, id: `exam-${Date.now()}` }];
        }
        updateExamsMutation.mutate(updatedExams);
    };
    
     const handleSaveGrades = (newGrades: Grade[]) => {
        updateGradesMutation.mutate(newGrades);
    };


    return (
        <div className="p-6 md:p-8">
            <h2 className="text-3xl font-bold text-slate-800 mb-6">Examinations</h2>
            <div className="border-b border-slate-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    <button onClick={() => setActiveTab('manage')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'manage' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Manage Exams</button>
                    <button onClick={() => setActiveTab('grades')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'grades' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Enter Grades</button>
                </nav>
            </div>
            {activeTab === 'manage' && <ManageExamsView exams={exams} classes={classes} openModal={(exam: any) => { setEditingExam(exam); setIsModalOpen(true); }} />}
            {activeTab === 'grades' && <EnterGradesView selectedExamId={selectedExamId} setSelectedExamId={setSelectedExamId} selectedClassId={selectedClassId} setSelectedClassId={setSelectedClassId} selectedSubjectId={selectedSubjectId} setSelectedSubjectId={setSelectedSubjectId} exams={exams} classes={classes} subjects={subjects} handleSaveGrades={handleSaveGrades} selectedExamType={selectedExam?.type} />}
            {isModalOpen && <ExamModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveExam} data={editingExam} classes={classes} />}
        </div>
    );
};

export default ExaminationsView;
