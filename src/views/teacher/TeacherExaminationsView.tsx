
import React, { useState, useMemo, useEffect } from 'react';
import type { Grade, Subject, Student, Exam } from '../../types';
import { ExamType, CbetScore } from '../../types';
import { useData } from '../../contexts/DataContext';
import * as api from '../../services/api';
import { useQuery } from '@tanstack/react-query';

const TeacherExaminationsView: React.FC = () => {
    const { updateGrades, assignedClass, currentUser, isLoading } = useData();
    const [selectedExamId, setSelectedExamId] = useState<string>('');
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
    const [gradeEntries, setGradeEntries] = useState<Map<string, { score: number | null, cbetScore: CbetScore | null, comments: string }>>(new Map());
    
    // Queries
    const { data: exams = [] } = useQuery({ queryKey: ['exams'], queryFn: () => api.findAllExams() });
    const { data: assignments = [] } = useQuery({ queryKey: ['assignments'], queryFn: () => api.findAllAssignments() });
    const { data: subjects = [] } = useQuery({ queryKey: ['subjects'], queryFn: () => api.getSubjects().then(res => Array.isArray(res) ? res : res.data) });
    const { data: studentsInClass = [] } = useQuery({
        queryKey: ['my-class-students', assignedClass?.id],
        queryFn: () => assignedClass 
            ? api.getStudents({ classId: assignedClass.id, status: 'Active', pagination: 'false' }).then(res => Array.isArray(res) ? res : res.data)
            : Promise.resolve([]),
        enabled: !!assignedClass
    });

    const { data: currentGrades = [] } = useQuery({
        queryKey: ['grades', selectedExamId, selectedSubjectId, assignedClass?.id],
        queryFn: () => (selectedExamId && selectedSubjectId && assignedClass)
            ? api.getGrades({ examId: selectedExamId, subjectId: selectedSubjectId, classId: assignedClass.id })
            : Promise.resolve([]),
        enabled: !!selectedExamId && !!selectedSubjectId && !!assignedClass
    });

    if (isLoading) return <div className="p-8 text-center">Loading...</div>;

    if (!assignedClass || !currentUser) {
         return (
            <div className="p-8 text-center text-slate-500 bg-white rounded-xl shadow m-8">
                <h3 className="text-xl font-bold mb-2">No Class Assigned</h3>
                <p>You need to be assigned to a class to enter grades.</p>
            </div>
        );
    }

    const assignedSubjects = useMemo(() => {
        return assignments
            .filter((a: any) => a.classId === assignedClass.id && a.teacherId === currentUser.id)
            .map((a: any) => subjects.find((s: any) => s.id === a.subjectId))
            .filter((s: any): s is Subject => !!s);
    }, [assignments, subjects, assignedClass.id, currentUser.id]);
    
    const selectedExam = useMemo(() => exams.find((e: any) => e.id === selectedExamId), [exams, selectedExamId]);

    // Sync grades when fetched
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
        }
    }, [currentGrades, studentsInClass, selectedExamId, selectedSubjectId]);
    
    const handleGradeChange = (studentId: string, value: Partial<{ score: number | null, cbetScore: CbetScore | null, comments: string }>) => {
        setGradeEntries(prev => new Map(prev).set(studentId, { ...(prev.get(studentId) || { score: null, cbetScore: null, comments: '' }), ...value }));
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
            alert("Grades saved successfully!");
        });
    };
    
    return (
        <div className="p-6 md:p-8">
            <h2 className="text-3xl font-bold text-slate-800 mb-6">Enter Examination Grades</h2>
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
                    <select value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)} className="w-full sm:w-auto flex-grow p-2 border border-slate-300 rounded-lg">
                        <option value="">Select Exam</option>
                        {exams.filter((e: any) => e.classId === assignedClass.id).map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                    <select value={selectedSubjectId} onChange={e => setSelectedSubjectId(e.target.value)} className="w-full sm:w-auto flex-grow p-2 border border-slate-300 rounded-lg">
                        <option value="">Select Subject</option>
                        {assignedSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>

                {selectedExamId && selectedSubjectId && selectedExam && (
                    <div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left table-auto">
                                <thead>
                                    <tr className="bg-slate-50 border-b">
                                        <th className="px-4 py-2 font-medium">Student Name</th>
                                        <th className="px-4 py-2 font-medium">{selectedExam?.type === ExamType.Traditional ? 'Score (%)' : 'CBC Level'}</th>
                                        <th className="px-4 py-2 font-medium">Comments</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {studentsInClass.map((student: any) => (
                                        <tr key={student.id} className="border-b">
                                            <td className="px-4 py-2 font-semibold">{student.name}</td>
                                            <td className="px-4 py-2">
                                                {selectedExam.type === ExamType.Traditional ? (
                                                    <input 
                                                        type="number"
                                                        value={gradeEntries.get(student.id)?.score ?? ''}
                                                        onChange={e => handleGradeChange(student.id, { score: e.target.value ? parseInt(e.target.value, 10) : null })}
                                                        className="w-24 p-1 border rounded"
                                                    />
                                                ) : (
                                                    <select
                                                        value={gradeEntries.get(student.id)?.cbetScore ?? ''}
                                                        onChange={e => handleGradeChange(student.id, { cbetScore: e.target.value as CbetScore })}
                                                        className="w-48 p-1 border rounded"
                                                    >
                                                        <option value="">Select Level</option>
                                                        {Object.values(CbetScore).map(level => <option key={level} value={level}>{level}</option>)}
                                                    </select>
                                                )}
                                            </td>
                                            <td className="px-4 py-2">
                                                <input
                                                    type="text"
                                                    value={gradeEntries.get(student.id)?.comments ?? ''}
                                                    onChange={e => handleGradeChange(student.id, { comments: e.target.value })}
                                                    className="w-full p-1 border rounded"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-end mt-6">
                            <button onClick={handleSaveGrades} className="px-6 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700">
                                Save Grades
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeacherExaminationsView;
