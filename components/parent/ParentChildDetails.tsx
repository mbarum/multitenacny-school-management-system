

import React, { useState, useMemo } from 'react';
import { AttendanceStatus, ExamType, Grade } from '../../types';
import { useData } from '../../contexts/DataContext';

const ParentChildDetails: React.FC = () => {
    const { selectedChild, transactions, grades, subjects, exams, attendanceRecords, setActiveView } = useData();
    const [activeTab, setActiveTab] = useState('academics');

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

    const childTransactions = transactions.filter(p => p.studentId === selectedChild.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Fix: Added an explicit return type to useMemo to ensure childGradesByExam is correctly typed, which prevents gradesList from being inferred as 'unknown'.
    const childGradesByExam = useMemo((): Record<string, Grade[]> => {
        const gradesByExam: Record<string, Grade[]> = {};
        grades
            .filter(g => g.studentId === selectedChild.id)
            .forEach(grade => {
                if (!gradesByExam[grade.examId]) {
                    gradesByExam[grade.examId] = [];
                }
                gradesByExam[grade.examId].push(grade);
            });
        return gradesByExam;
    }, [grades, selectedChild]);

    const childAttendance = attendanceRecords
        .filter(a => a.studentId === selectedChild.id)
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Fix: Explicitly type the Map to ensure correct type inference from .get()
    const subjectMap = useMemo(() => new Map<string, string>(subjects.map(s => [s.id, s.name])), [subjects]);

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
                    {Object.keys(childGradesByExam).length > 0 ? (
                        Object.entries(childGradesByExam).map(([examId, gradesList]) => {
                            const exam = exams.find(e => e.id === examId);
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
                                            {/* Fix: Explicitly cast `gradesList` as `Grade[]` to resolve 'map' does not exist on 'unknown' error. */}
                                            {(gradesList as Grade[]).map(grade => (
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
                            {childTransactions.map(t => (
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
                        </tbody>
                     </table>
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
                                {childAttendance.map(record => (
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
                                {childAttendance.length === 0 && <tr><td colSpan={2} className="text-center p-4">No attendance records found.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
             )}
        </div>
    );
}

export default ParentChildDetails;