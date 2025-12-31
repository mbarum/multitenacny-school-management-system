
import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Student, SchoolClass, Exam, Grade, Subject, GradingRule, SchoolInfo } from '../../types';
import { GradingSystem } from '../../types';
import Modal from '../common/Modal';
import { useData } from '../../contexts/DataContext';
import * as api from '../services/api';

const ReportCardsView: React.FC = () => {
    const { schoolInfo } = useData();
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedExamId, setSelectedExamId] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [studentGrades, setStudentGrades] = useState<Grade[]>([]);
    const [loadingGrades, setLoadingGrades] = useState(false);

    // Queries
    const { data: classes = [] } = useQuery({ queryKey: ['classes'], queryFn: () => api.getClasses().then(res => Array.isArray(res) ? res : res.data) });
    const { data: exams = [] } = useQuery({ queryKey: ['exams'], queryFn: () => api.findAllExams() });
    const { data: subjects = [] } = useQuery({ queryKey: ['subjects'], queryFn: () => api.getSubjects().then(res => Array.isArray(res) ? res : res.data) });
    const { data: gradingScale = [] } = useQuery({ queryKey: ['grading-scale'], queryFn: () => api.getGradingScale() });

    // Fetch students when class is selected
    const { data: studentsInClass = [] } = useQuery({
        queryKey: ['students', selectedClassId],
        queryFn: () => api.getStudents({ classId: selectedClassId, pagination: 'false' }).then(res => Array.isArray(res) ? res : res.data),
        enabled: !!selectedClassId
    });

    const examsForClass = useMemo(() => {
        return exams.filter((e: Exam) => e.classId === selectedClassId);
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

    const selectedExam = exams.find((e: Exam) => e.id === selectedExamId);

    return (
        <div className="p-6 md:p-8">
            <h2 className="text-3xl font-bold text-slate-800 mb-6">Generate Report Cards</h2>
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex space-x-4 mb-6">
                    <select value={selectedClassId} onChange={e => {setSelectedClassId(e.target.value); setSelectedExamId('');}} className="p-2 border rounded">
                        <option value="">Select Class</option>
                        {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)} className="p-2 border rounded" disabled={!selectedClassId}>
                        <option value="">Select Exam</option>
                        {examsForClass.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                </div>
                {selectedExamId && (
                    <table className="w-full text-left">
                        <thead><tr className="bg-slate-50 border-b"><th>Student Name</th><th>Actions</th></tr></thead>
                        <tbody>{studentsInClass.map((student: any) => (<tr key={student.id} className="border-b">
                            <td className="p-2">{student.name}</td>
                            <td className="p-2"><button onClick={() => openReportCard(student)} className="text-blue-600">View Report Card</button></td></tr>))}
                        </tbody>
                    </table>
                )}
            </div>
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
    if (!isOpen || !student) {
        return null;
    }

    const subjectMap = new Map(subjects.map((s:Subject) => [s.id, s.name]));
    const totalMarks = grades.reduce((sum:number, g:Grade) => sum + (g.score || 0), 0);
    const average = grades.length > 0 ? totalMarks / grades.length : 0;
    
    // Traditional Grading Calculation
    const gradeLetter = gradingScale.find((r:GradingRule) => average >= r.minScore && average <= r.maxScore)?.grade || 'N/A';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Report Card" size="2xl" footer={<button onClick={() => window.print()} className="px-4 py-2 bg-slate-600 text-white rounded" disabled={loading}>Print</button>}>
            {loading ? <div className="p-8 text-center">Loading report card data...</div> : 
            <div className="printable-area p-4 border rounded">
                <div className="text-center mb-4"><img src={schoolInfo.logoUrl} className="h-16 w-16 mx-auto rounded-full" /><h2 className="text-2xl font-bold">{schoolInfo.name}</h2><p>{schoolInfo.address}</p><h3 className="text-xl font-semibold mt-2 border-y py-1">{exam.name} Report Card</h3></div>
                <div className="grid grid-cols-2 gap-2 text-sm mb-4"><p><strong>Student:</strong> {student.name}</p><p><strong>Class:</strong> {student.class}</p><p><strong>Adm No:</strong> {student.admissionNumber}</p><p><strong>Date:</strong> {new Date().toLocaleDateString()}</p></div>
                
                <table className="w-full text-left text-sm border-collapse border">
                    <thead>
                        <tr className="bg-slate-100">
                            <th className="p-2 border">Subject</th>
                            {schoolInfo.gradingSystem === GradingSystem.Traditional && <th className="p-2 border">Score</th>}
                            {schoolInfo.gradingSystem === GradingSystem.Traditional && <th className="p-2 border">Grade</th>}
                            {schoolInfo.gradingSystem === GradingSystem.CBC && <th className="p-2 border">Assessment Level</th>}
                            <th className="p-2 border">Comments</th>
                        </tr>
                    </thead>
                    <tbody>
                        {grades.map((g:Grade) => (
                            <tr key={g.id} className="border">
                                <td className="p-2 border">{subjectMap.get(g.subjectId) || 'Unknown Subject'}</td>
                                
                                {schoolInfo.gradingSystem === GradingSystem.Traditional && (
                                    <>
                                        <td className="p-2 border">{g.score !== null ? `${g.score}%` : 'N/A'}</td>
                                        <td className="p-2 border">{g.score !== null ? (gradingScale.find((r:GradingRule) => g.score! >= r.minScore && g.score! <= r.maxScore)?.grade || 'N/A') : 'N/A'}</td>
                                    </>
                                )}

                                {schoolInfo.gradingSystem === GradingSystem.CBC && (
                                    <td className="p-2 border font-bold text-blue-800">
                                        {g.cbetScore ? g.cbetScore.split('(')[1].replace(')', '') : 'N/A'} - {g.cbetScore?.split('(')[0]}
                                    </td>
                                )}
                                
                                <td className="p-2 border">{g.comments}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                {schoolInfo.gradingSystem === GradingSystem.Traditional && (
                    <div className="grid grid-cols-3 gap-4 mt-4 text-center font-bold">
                        <div className="bg-slate-100 p-2 rounded">Total Marks: {totalMarks}</div>
                        <div className="bg-slate-100 p-2 rounded">Average: {average.toFixed(2)}%</div>
                        <div className="bg-slate-100 p-2 rounded">Mean Grade: {gradeLetter}</div>
                    </div>
                )}

                <div className="mt-4 text-sm"><p><strong>Teacher's Comment:</strong> Good progress, keep up the hard work.</p><p><strong>Principal's Comment:</strong> Excellent performance.</p></div>
            </div>}
        </Modal>
    )
};

export default ReportCardsView;
