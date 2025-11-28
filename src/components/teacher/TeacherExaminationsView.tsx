
import React, { useState, useMemo, useEffect } from 'react';
import type { Grade, Subject } from '../../types';
import { ExamType, CbetScore } from '../../types';
import { useData } from '../../contexts/DataContext';
import * as api from '../../services/api';

const TeacherExaminationsView: React.FC = () => {
    const { exams, updateGrades, assignedClass, students, classSubjectAssignments, subjects, currentUser } = useData();
    const [selectedExamId, setSelectedExamId] = useState<string>('');
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
    const [gradeEntries, setGradeEntries] = useState<Map<string, { score: number | null, cbetScore: CbetScore | null, comments: string }>>(new Map());
    const [currentGrades, setCurrentGrades] = useState<Grade[]>([]);

    if (!assignedClass || !currentUser) return null;

    const assignedSubjects = useMemo(() => {
        return classSubjectAssignments
            .filter(a => a.classId === assignedClass.id && a.teacherId === currentUser.id)
            .map(a => subjects.find(s => s.id === a.subjectId))
            .filter((s): s is Subject => !!s);
    }, [classSubjectAssignments, subjects, assignedClass.id, currentUser.id]);

    const studentsInClass = useMemo(() => {
        return students.filter(s => s.classId === assignedClass.id);
    }, [students, assignedClass.id]);
    
    const selectedExam = useMemo(() => exams.find(e => e.id === selectedExamId), [exams, selectedExamId]);

    useEffect(() => {
        if (selectedExamId && selectedSubjectId) {
            // Fetch grades for this exam/subject/class
            api.getGrades({ examId: selectedExamId, subjectId: selectedSubjectId, classId: assignedClass.id })
            .then(fetchedGrades => {
                setCurrentGrades(fetchedGrades);
                const newEntries = new Map<string, { score: number | null, cbetScore: CbetScore | null, comments: string }>();
                studentsInClass.forEach(student => {
                    const existingGrade = fetchedGrades.find(g => g.studentId === student.id);
                    newEntries.set(student.id, {
                        score: existingGrade?.score ?? null,
                        cbetScore: existingGrade?.cbetScore ?? null,
                        comments: existingGrade?.comments ?? ''
                    });
                });
                setGradeEntries(newEntries);
            })
            .catch(err => console.error("Failed to fetch grades", err));
        }
    }, [selectedExamId, selectedSubjectId, studentsInClass, assignedClass.id]);
    
    const handleGradeChange = (studentId: string, value: Partial<{ score: number | null, cbetScore: CbetScore | null, comments: string }>) => {
        setGradeEntries(prev => new Map(prev).set(studentId, { ...(prev.get(studentId) || { score: null, cbetScore: null, comments: '' }), ...value }));
    };

    const handleSaveGrades = () => {
        if (!selectedExamId || !selectedSubjectId) return;
        const newGrades: Grade[] = studentsInClass.map(student => {
            const entry = gradeEntries.get(student.id);
            const existingGrade = currentGrades.find(g => g.studentId === student.id);
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
                        {exams.filter(e => e.classId === assignedClass.id).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
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
                                    {studentsInClass.map(student => (
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
