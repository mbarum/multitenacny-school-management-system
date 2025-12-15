
import React, { useState, useMemo } from 'react';
import { AttendanceStatus, ExamType, Grade, AttendanceRecord, Subject, Transaction } from '../../types';
import { useData } from '../../contexts/DataContext';
import * as api from '../../services/api';
import Skeleton from '../../components/common/Skeleton';
import { useQuery } from '@tanstack/react-query';

const ParentChildDetails: React.FC = () => {
    const { selectedChild, setActiveView } = useData();
    const [activeTab, setActiveTab] = useState('academics');
    
    // Global data queries
    const { data: subjects = [] } = useQuery({ queryKey: ['subjects'], queryFn: () => api.getSubjects().then(res => Array.isArray(res) ? res : res.data) });
    const { data: exams = [] } = useQuery({ queryKey: ['exams'], queryFn: () => api.findAllExams() });

    // Child specific queries
    const { data: grades = [], isLoading: loadingGrades } = useQuery({
        queryKey: ['child-grades', selectedChild?.id],
        queryFn: () => selectedChild ? api.getGrades({ studentId: selectedChild.id }) : Promise.resolve([]),
        enabled: !!selectedChild
    });

    const { data: attendanceRecords = [], isLoading: loadingAttendance } = useQuery({
        queryKey: ['child-attendance', selectedChild?.id],
        queryFn: () => selectedChild ? api.getAttendance({ studentId: selectedChild.id }).then((res: any) => Array.isArray(res) ? res : res.data) : Promise.resolve([]),
        enabled: !!selectedChild
    });
    
    const { data: transactions = [], isLoading: loadingFinance } = useQuery({
        queryKey: ['child-transactions', selectedChild?.id],
        queryFn: () => selectedChild ? api.getTransactions({ studentId: selectedChild.id, limit: 50 }).then((res: any) => res.data) : Promise.resolve([]),
        enabled: !!selectedChild
    });

    if (!selectedChild) {
        return (
            <div className="p-8 text-center text-slate-500">
                <p>No child selected. Please go back to the dashboard.</p>
                <button onClick={() => setActiveView('parent_dashboard')} className="mt-4 text-primary-600 font-semibold hover:underline">
                    Back to Dashboard
                </button>
            </div>
        );
    }
    const onBack = () => setActiveView('parent_dashboard');

    const childGradesByExam = useMemo((): Record<string, Grade[]> => {
        const gradesByExam: Record<string, Grade[]> = {};
        grades.forEach((grade: Grade) => {
            if (!gradesByExam[grade.examId]) {
                gradesByExam[grade.examId] = [];
            }
            gradesByExam[grade.examId].push(grade);
        });
        return gradesByExam;
    }, [grades]);

    const subjectMap = useMemo(() => new Map<string, string>((subjects as Subject[]).map(s => [s.id, s.name])), [subjects]);

    return (
        <div className="p-6 md:p-8">
            <button onClick={onBack} className="flex items-center text-primary-600 hover:text-primary-800 font-semibold mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Back to Dashboard
            </button>
             <div className="flex items-center space-x-4 mb-6">
                <img src={selectedChild.profileImage} alt={selectedChild.name} className="h-24 w-24 rounded-full object-cover"/>
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">{selectedChild.name}</h2>
                    <p className="text-lg text-slate-600">{selectedChild.class} | {selectedChild.admissionNumber}</p>
                </div>
            </div>
             <div className="border-b border-slate-200 mb-6">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button onClick={() => setActiveTab('academics')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'academics' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Academics</button>
                    <button onClick={() => setActiveTab('finance')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'finance' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Finances</button>
                    <button onClick={() => setActiveTab('attendance')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'attendance' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Attendance</button>
                </nav>
            </div>

            {activeTab === 'academics' && (
                <div className="space-y-6">
                    {loadingGrades ? <Skeleton className="h-40 w-full" /> : 
                     Object.keys(childGradesByExam).length > 0 ? (
                        Object.entries(childGradesByExam).map(([examId, gradesList]) => {
                            const exam = (exams as any[]).find(e => e.id === examId);
                            if (!exam) return null;
                            return (
                                <div key={examId} className="bg-white p-6 rounded-xl shadow-lg">
                                    <h3 className="text-xl font-bold text-slate-800">{exam.name}</h3>
                                    <p className="text-sm text-slate-500 mb-4">{new Date(exam.date).toLocaleDateString()}</p>
                                    <table className="w-full text-left table-auto">
                                        <thead>
                                            <tr className="bg-slate-50 border-b">
                                                <th className="px-4 py-2 font-medium text-slate-600">Subject</th>
                                                <th className="px-4 py-2 font-medium text-slate-600">Score / Grade</th>
                                                <th className="px-4 py-2 font-medium text-slate-600">Comments</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(gradesList as Grade[]).map((grade) => (
                                                <tr key={grade.id} className="border-b">
                                                    <td className="px-4 py-2 font-semibold">{subjectMap.get(grade.subjectId) || 'Unknown Subject'}</td>
                                                    <td className="px-4 py-2">{exam.type === ExamType.Traditional ? `${grade.score}%` : grade.cbetScore}</td>
                                                    <td className="px-4 py-2 text-slate-600 italic">{grade.comments}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-center text-slate-500 bg-white p-8 rounded-lg shadow">No academic records found.</p>
                    )}
                </div>
            )}
             {activeTab === 'finance' && (
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h3 className="text-xl font-bold text-slate-800 mb-4">Financial History</h3>
                     {loadingFinance ? <Skeleton className="h-40 w-full" /> : 
                     <table className="w-full text-left table-auto">
                        <thead>
                            <tr className="bg-slate-50 border-b">
                                <th className="px-4 py-2 font-medium text-slate-600">Date</th>
                                <th className="px-4 py-2 font-medium text-slate-600">Description</th>
                                <th className="px-4 py-2 font-medium text-slate-600 text-right">Debit (KES)</th>
                                <th className="px-4 py-2 font-medium text-slate-600 text-right">Credit (KES)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(transactions as Transaction[]).map(t => (
                                <tr key={t.id} className="border-b">
                                    <td className="px-4 py-2">{new Date(t.date).toLocaleDateString()}</td>
                                    <td className="px-4 py-2">{t.description}</td>
                                    <td className="px-4 py-2 text-right">
                                        {(t.type === 'Invoice' || t.type === 'ManualDebit') ? t.amount.toLocaleString() : '-'}
                                    </td>
                                    <td className="px-4 py-2 text-right text-green-600">
                                        {(t.type === 'Payment' || t.type === 'ManualCredit') ? t.amount.toLocaleString() : '-'}
                                    </td>
                                </tr>
                            ))}
                            {transactions.length === 0 && <tr><td colSpan={4} className="text-center p-4 text-slate-500">No transactions found.</td></tr>}
                        </tbody>
                     </table>}
                </div>
            )}
             {activeTab === 'attendance' && (
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h3 className="text-xl font-bold text-slate-800 mb-4">Attendance History</h3>
                    <div className="max-h-96 overflow-y-auto">
                        <table className="w-full text-left table-auto">
                            <thead>
                                <tr className="bg-slate-50 border-b">
                                    <th className="px-4 py-2 font-medium text-slate-600">Date</th>
                                    <th className="px-4 py-2 font-medium text-slate-600">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingAttendance ? <tr><td colSpan={2} className="p-4"><Skeleton className="h-8 w-full"/></td></tr> : 
                                (attendanceRecords as AttendanceRecord[]).map(record => (
                                    <tr key={record.id} className="border-b">
                                        <td className="px-4 py-2">{new Date(record.date).toLocaleDateString()}</td>
                                        <td className="px-4 py-2">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                record.status === AttendanceStatus.Present ? 'bg-green-100 text-green-800' : 
                                                record.status === AttendanceStatus.Absent ? 'bg-red-100 text-red-800' : 
                                                record.status === AttendanceStatus.Late ? 'bg-yellow-100 text-yellow-800' : 'bg-slate-100 text-slate-800'
                                            }`}>{record.status}</span>
                                        </td>
                                    </tr>
                                ))}
                                {!loadingAttendance && attendanceRecords.length === 0 && <tr><td colSpan={2} className="text-center p-4">No attendance records found.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
             )}
        </div>
    );
}

export default ParentChildDetails;
