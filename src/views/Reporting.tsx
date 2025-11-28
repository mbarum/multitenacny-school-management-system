
import React, { useState, useMemo, useEffect } from 'react';
import { generateFinancialSummary } from '../services/geminiService';
import { AttendanceStatus, AttendanceRecord } from '../types';
import { useData } from '../contexts/DataContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import * as api from '../services/api';

const ReportWrapper: React.FC<{ title: string; onBack: () => void; children: React.ReactNode }> = ({ title, onBack, children }) => (
    <div>
         <style>{`
            @media print {
                body * { visibility: hidden; }
                .printable-report, .printable-report * { visibility: visible; }
                .printable-report { position: absolute; left: 0; top: 0; width: 100%; padding: 1rem; }
                .no-print { display: none !important; }
            }
        `}</style>
        <div className="flex justify-between items-center mb-6 no-print">
            <button onClick={onBack} className="flex items-center text-primary-600 hover:text-primary-800 font-semibold transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Back to Reports
            </button>
            <h2 className="text-2xl font-bold text-slate-700">{title}</h2>
            <button onClick={() => window.print()} className="px-4 py-2 bg-slate-600 text-white font-semibold rounded-lg shadow-md hover:bg-slate-700 transition-colors no-print">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm7-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Report
            </button>
        </div>
        <div className="printable-report">
            <h1 className="text-3xl font-bold text-slate-800 mb-4 hidden print:block text-center">{title}</h1>
            {children}
        </div>
    </div>
);

const FinancialSummary: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { transactions, expenses } = useData();
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    const payments = transactions.filter(t => t.type === 'Payment');

    const handleGenerateSummary = async () => {
        setIsLoading(true);
        setError('');
        setSummary('');
        try {
            const result = await generateFinancialSummary(payments, expenses);
            setSummary(result);
        } catch (err) {
            setError('Failed to generate summary. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ReportWrapper title="AI-Powered Financial Summary" onBack={onBack}>
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <p className="text-slate-600 mb-4">Click the button below to generate a concise financial summary for the current period using Gemini AI.</p>
                <button onClick={handleGenerateSummary} disabled={isLoading} className="inline-flex items-center px-6 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700 disabled:bg-slate-400 transition-colors no-print">
                   {isLoading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                    </>
                   ) : 'Generate Summary'}
                </button>
                {error && <p className="mt-4 text-red-600 bg-red-100 p-3 rounded-lg">{error}</p>}
                {summary && (
                    <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                        <h4 className="text-lg font-semibold text-slate-800 mb-2">Generated Summary:</h4>
                        <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{summary}</p>
                    </div>
                )}
            </div>
        </ReportWrapper>
    );
};

const DefaultersReport: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { students, studentFinancials } = useData();
    
    const defaulters = useMemo(() => students
        .map(s => ({
            ...s,
            balance: studentFinancials[s.id]?.balance || 0,
            lastPaymentDate: studentFinancials[s.id]?.lastPaymentDate,
        }))
        .filter(s => s.balance > 0)
        .sort((a,b) => b.balance - a.balance), [students, studentFinancials]);
    
    const totalDeficit = defaulters.reduce((sum, s) => sum + s.balance, 0);

    return (
        <ReportWrapper title="Fee Defaulters Report" onBack={onBack}>
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                    <h3 className="text-xl font-bold text-red-800">Total Outstanding Balance: KES {totalDeficit.toLocaleString()}</h3>
                </div>
                <table className="w-full text-left table-auto">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-4 py-3 font-semibold text-slate-600">Student Name</th>
                            <th className="px-4 py-3 font-semibold text-slate-600">Class</th>
                            <th className="px-4 py-3 font-semibold text-slate-600">Guardian Contact</th>
                            <th className="px-4 py-3 font-semibold text-slate-600">Last Payment</th>
                            <th className="px-4 py-3 font-semibold text-slate-600 text-right">Balance (KES)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {defaulters.map(student => (
                            <tr key={student.id} className="border-b border-slate-100">
                                <td className="px-4 py-3 font-medium text-slate-800">{student.name}</td>
                                <td className="px-4 py-3 text-slate-500">{student.class}</td>
                                <td className="px-4 py-3 text-slate-500">{student.guardianContact}</td>
                                <td className="px-4 py-3 text-slate-500">{student.lastPaymentDate || 'N/A'}</td>
                                <td className="px-4 py-3 font-semibold text-red-600 text-right">{student.balance.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {defaulters.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                        <p>No fee defaulters found. All accounts are settled.</p>
                    </div>
                )}
            </div>
        </ReportWrapper>
    )
}

const ClassListReport: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { students, classes } = useData();
    const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
    const studentsInClass = useMemo(() => students.filter(s => s.classId === selectedClassId), [students, selectedClassId]);
    return (
        <ReportWrapper title="Class List" onBack={onBack}>
             <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center space-x-4 mb-4 no-print">
                    <label htmlFor="class-select" className="font-medium text-slate-700">Select Class:</label>
                    <select id="class-select" value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} className="border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500">
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                 <h3 className="text-xl font-semibold mb-2 print:block hidden text-center">{classes.find(c=>c.id === selectedClassId)?.name}</h3>
                <table className="w-full text-left table-auto">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-4 py-3 font-semibold text-slate-600">#</th>
                            <th className="px-4 py-3 font-semibold text-slate-600">Admission No.</th>
                            <th className="px-4 py-3 font-semibold text-slate-600">Name</th>
                        </tr>
                    </thead>
                    <tbody>
                        {studentsInClass.map((student, index) => (
                            <tr key={student.id} className="border-b border-slate-100">
                                <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                                <td className="px-4 py-3 text-slate-500">{student.admissionNumber}</td>
                                <td className="px-4 py-3 font-medium text-slate-800">{student.name}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </ReportWrapper>
    )
}

const AttendanceReport: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { students, classes } = useData();
    const [classId, setClassId] = useState(classes[0]?.id || '');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(false);

    const studentMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);

    useEffect(() => {
        setLoading(true);
        api.getAttendance({
            classId: classId || undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined
        })
        .then(setAttendanceRecords)
        .catch(err => console.error("Failed to fetch attendance", err))
        .finally(() => setLoading(false));
    }, [classId, startDate, endDate]);

    const filteredRecords = useMemo(() => {
        return attendanceRecords.filter(r => r.status !== AttendanceStatus.Present);
    }, [attendanceRecords]);

    return (
        <ReportWrapper title="Attendance Issues Report" onBack={onBack}>
            <div className="bg-white p-6 rounded-xl shadow-lg">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 no-print">
                    <select value={classId} onChange={e => setClassId(e.target.value)} className="border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"><option value="">Select Class</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"/>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"/>
                </div>
                <table className="w-full text-left table-auto">
                     <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-4 py-3 font-semibold text-slate-600">Date</th>
                            <th className="px-4 py-3 font-semibold text-slate-600">Student Name</th>
                            <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan={3} className="text-center p-4">Loading...</td></tr> : 
                         filteredRecords.map(record => (
                            <tr key={record.id} className="border-b border-slate-100">
                                <td className="px-4 py-3 text-slate-500">{record.date}</td>
                                <td className="px-4 py-3 font-medium text-slate-800">{studentMap.get(record.studentId)?.name || 'Unknown'}</td>
                                <td className="px-4 py-3"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${record.status === AttendanceStatus.Absent ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{record.status}</span></td>
                            </tr>
                        ))}
                         {!loading && filteredRecords.length === 0 && (
                            <tr><td colSpan={3} className="text-center py-8 text-slate-500">No attendance issues found for the selected criteria.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </ReportWrapper>
    )
}

const CashFlowProjection: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { students, feeStructure, expenses } = useData();

    const projectionData = useMemo(() => {
        // 1. Calculate average monthly recurring expenses
        const monthlyExpenses: { [key: string]: number } = {};
        expenses.forEach(expense => {
            const month = expense.date.substring(0, 7); // YYYY-MM
            if (!monthlyExpenses[month]) monthlyExpenses[month] = 0;
            monthlyExpenses[month] += expense.amount;
        });
        const expenseMonths = Object.values(monthlyExpenses);
        const avgMonthlyExpenses = expenseMonths.length > 0 ? expenseMonths.reduce((a, b) => a + b, 0) / expenseMonths.length : 50000;

        // 2. Calculate total projected termly income from active students
        const termlyIncome = students
            .filter(s => s.status === 'Active')
            .reduce((total, student) => {
                const classFees = feeStructure
                    .filter(item => item.frequency === 'Termly' && !item.isOptional)
                    .flatMap(item => item.classSpecificFees)
                    .find(fee => fee.classId === student.classId);
                return total + (classFees?.amount || 0);
            }, 0);

        // 3. Generate projection for the next 6 months
        const data = [];
        const today = new Date();
        const termStartMonths = [0, 4, 8]; // Jan, May, Sep

        for (let i = 0; i < 6; i++) {
            const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
            const monthName = date.toLocaleString('default', { month: 'short' });
            
            const income = termStartMonths.includes(date.getMonth()) ? termlyIncome : 0;
            const expense = avgMonthlyExpenses;
            
            data.push({
                name: monthName,
                income,
                expenses: expense,
                net: income - expense,
            });
        }
        return data;

    }, [students, feeStructure, expenses]);

    return (
        <ReportWrapper title="6-Month Cash Flow Projection" onBack={onBack}>
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <p className="text-sm text-slate-500 mb-4">This projection is based on current active students' termly fees and the average of past monthly expenses.</p>
                <div className="w-full h-96 mb-8">
                     <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={projectionData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis tickFormatter={(value) => `KES ${value/1000}k`} />
                            <Tooltip formatter={(value: number) => `KES ${value.toLocaleString()}`}/>
                            <Legend />
                            <Line type="monotone" dataKey="income" stroke="#16a34a" strokeWidth={2} name="Projected Income" />
                            <Line type="monotone" dataKey="expenses" stroke="#dc2626" strokeWidth={2} name="Projected Expenses" />
                            <Line type="monotone" dataKey="net" stroke="#475569" strokeWidth={2} name="Net Cash Flow" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                 <table className="w-full text-left table-auto">
                    <thead>
                        <tr className="bg-slate-50 border-b">
                            <th className="px-4 py-2 font-semibold">Month</th>
                            <th className="px-4 py-2 font-semibold text-right">Income (KES)</th>
                            <th className="px-4 py-2 font-semibold text-right">Expenses (KES)</th>
                            <th className="px-4 py-2 font-semibold text-right">Net Cash Flow (KES)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {projectionData.map((d: { name: string; income: number; expenses: number; net: number; }, index) => (
                            <tr key={`${d.name}-${index}`} className="border-b">
                                <td className="px-4 py-2 font-medium">{d.name}</td>
                                <td className="px-4 py-2 text-right text-green-600">{d.income.toLocaleString()}</td>
                                <td className="px-4 py-2 text-right text-red-600">({d.expenses.toLocaleString()})</td>
                                <td className={`px-4 py-2 text-right font-bold ${d.net >= 0 ? 'text-slate-800' : 'text-red-600'}`}>{d.net.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
            </div>
        </ReportWrapper>
    );
};


// =================================================================================
// Main Reporting Component
// =================================================================================
const Reporting: React.FC = () => {
    const [activeReport, setActiveReport] = useState<string | null>(null);

    const reports = [
        { id: 'summary', title: 'Financial Summary', description: 'AI-powered overview of school finances.', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
        { id: 'defaulters', title: 'Fee Defaulters', description: 'List students with outstanding balances.', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg> },
        { id: 'projection', title: 'Cash Flow Projection', description: 'Forecast future income and expenses.', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg> },
        { id: 'class_lists', title: 'Class Lists', description: 'Generate printable lists of students by class.', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m0 0A5.975 5.975 0 0112 13a5.975 5.975 0 013 5.197" /></svg> },
        { id: 'attendance', title: 'Attendance Report', description: 'Track student attendance issues.', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2zM7 15l2 2 4-4" /></svg> },
    ];
    
    const renderContent = () => {
        switch (activeReport) {
            case 'summary':
                return <FinancialSummary onBack={() => setActiveReport(null)} />;
            case 'defaulters':
                return <DefaultersReport onBack={() => setActiveReport(null)} />;
            case 'class_lists':
                return <ClassListReport onBack={() => setActiveReport(null)} />;
            case 'attendance':
                return <AttendanceReport onBack={() => setActiveReport(null)} />
            case 'projection':
                return <CashFlowProjection onBack={() => setActiveReport(null)} />
            default:
                return (
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800 mb-6">Reporting Dashboard</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {reports.map(report => (
                                <div key={report.id} onClick={() => setActiveReport(report.id)} className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer flex items-center space-x-4">
                                    <div className="text-primary-500 bg-primary-100 p-4 rounded-full">{report.icon}</div>
                                    <div>
                                        <h3 className="text-xl font-semibold text-slate-800">{report.title}</h3>
                                        <p className="text-slate-500">{report.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
        }
    }

    return (
        <div className="p-6 md:p-8">
            {renderContent()}
        </div>
    );
};

export default Reporting;
