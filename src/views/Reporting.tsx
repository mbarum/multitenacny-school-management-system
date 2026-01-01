import React, { useState, useMemo, useEffect } from 'react';
import { generateFinancialSummary } from '../services/geminiService';
import { useData } from '../contexts/DataContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import * as api from '../services/api';
import Skeleton from '../components/common/Skeleton';

const ReportWrapper: React.FC<{ title: string; onBack: () => void; children: React.ReactNode }> = ({ title, onBack, children }) => (
    <div className="animate-fade-in-up">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 no-print gap-4">
            <button onClick={onBack} className="flex items-center text-primary-600 hover:text-primary-800 font-black text-xs uppercase tracking-widest transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                Return to Directory
            </button>
            <div className="flex gap-3">
                 <button onClick={() => window.print()} className="px-6 py-3 bg-slate-900 text-white font-black rounded-xl shadow-xl hover:bg-black transition-all uppercase text-xs tracking-widest flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm7-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print Official Report
                </button>
            </div>
        </div>
        <div className="printable-report min-h-[297mm]">
            {children}
        </div>
    </div>
);

const FinancialSummary: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { schoolInfo } = useData();
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    const handleGenerateSummary = async () => {
        setIsLoading(true);
        setError('');
        setSummary('');
        try {
            const result = await generateFinancialSummary();
            setSummary(result);
        } catch (err) {
            setError('Failed to generate summary. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const renderFormattedText = (text: string) => {
        if (!text) return null;
        return text.split('\n').map((line, index) => {
            const isBullet = line.trim().startsWith('- ');
            const displayLine = isBullet ? line.trim().substring(2) : line;
            const parts = displayLine.split(/\*\*(.*?)\*\*/g);
            
            if (line.trim() === '') return <div key={index} className="h-4"></div>;

            return (
                <div key={index} className={`mb-3 text-lg leading-relaxed ${isBullet ? 'pl-8 flex items-start' : ''}`}>
                    {isBullet && <span className="mr-3 text-primary-600 font-black">•</span>}
                    <span className="text-slate-700 font-medium">
                        {parts.map((part, i) => 
                            i % 2 === 1 ? <strong key={i} className="font-black text-slate-900">{part}</strong> : part
                        )}
                    </span>
                </div>
            );
        });
    };

    return (
        <ReportWrapper title="AI Financial Insight" onBack={onBack}>
            <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100">
                <div className="mb-12 border-b border-slate-100 pb-8 flex justify-between items-center">
                    <div>
                        <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">AI Financial Audit</h3>
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2">Document Ref: AI-{Date.now().toString().slice(-6)}</p>
                    </div>
                    {schoolInfo?.logoUrl && <img src={schoolInfo.logoUrl} className="h-16 w-auto grayscale" alt="Logo" />}
                </div>

                <div className="no-print mb-10">
                    <p className="text-slate-500 font-medium text-lg mb-8 leading-relaxed">Our Gemini-powered engine will perform a multi-dimensional analysis of your school's income, expenditure trends, and fee collection efficiency.</p>
                    <button onClick={handleGenerateSummary} disabled={isLoading} className="inline-flex items-center px-10 py-4 bg-primary-600 text-white font-black rounded-2xl shadow-2xl shadow-primary-500/40 hover:bg-primary-700 hover:-translate-y-1 transition-all uppercase text-xs tracking-widest">
                    {isLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Analyzing Institutional Data...
                        </>
                    ) : 'Initialize AI Summary'}
                    </button>
                </div>

                {error && <p className="mt-4 text-red-600 bg-red-50 p-6 rounded-2xl font-bold border border-red-100">{error}</p>}
                
                {summary && (
                    <div className="animate-fade-in-up mt-6">
                        <div className="prose prose-slate max-w-none">
                             {renderFormattedText(summary)}
                        </div>
                    </div>
                )}

                <div className="hidden print:block mt-32 pt-10 border-t border-dashed border-slate-200">
                    <p className="text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.5em]">Digitally Generated Financial Intelligence &copy; Saaslink</p>
                </div>
            </div>
        </ReportWrapper>
    );
};

const DefaultersReport: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { schoolInfo } = useData();
    const [defaulters, setDefaulters] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getStudents({ pagination: 'false' }).then((res: any) => {
            const list = Array.isArray(res) ? res : res.data;
            const withDebt = list.filter((s: any) => s.balance > 0).sort((a: any, b: any) => b.balance - a.balance);
            setDefaulters(withDebt);
            setLoading(false);
        });
    }, []);

    const totalDeficit = defaulters.reduce((sum, s) => sum + s.balance, 0);

    return (
        <ReportWrapper title="Debtors Ledger" onBack={onBack}>
            <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100">
                 <div className="flex justify-between items-start mb-12 border-b-4 border-slate-900 pb-8">
                    <div>
                        <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Outstanding Arrears</h3>
                        <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest mt-2">Comprehensive Debt Analysis</p>
                    </div>
                    <div className="text-right">
                         <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Total Outstanding</p>
                         <p className="text-4xl font-black text-red-600">KES {totalDeficit.toLocaleString()}</p>
                    </div>
                </div>

                {loading ? <Skeleton className="h-96 w-full rounded-3xl" /> : (
                <div className="border-2 border-slate-100 rounded-[2.5rem] overflow-hidden shadow-inner">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-900 text-white">
                                <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px] border-r border-slate-800">Student Identity</th>
                                <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px] border-r border-slate-800">Class</th>
                                <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px] border-r border-slate-800">Primary Contact</th>
                                <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px] text-right">Balance Due</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-bold uppercase text-xs">
                            {defaulters.map(student => (
                                <tr key={student.id} className="hover:bg-red-50/30 transition-colors">
                                    <td className="px-8 py-4 font-black text-slate-800 text-sm border-r border-slate-50">{student.name}</td>
                                    <td className="px-8 py-4 text-slate-500 border-r border-slate-50">{student.class}</td>
                                    <td className="px-8 py-4 text-slate-500 font-mono border-r border-slate-50">{student.guardianContact}</td>
                                    <td className="px-8 py-4 font-black text-red-600 text-right text-lg">{student.balance.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                )}
                 {!loading && defaulters.length === 0 && (
                    <div className="text-center py-20 text-slate-300 font-black uppercase tracking-[0.2em] italic bg-slate-50 rounded-3xl border border-dashed border-slate-200 mt-10">
                        Institutional Ledger Balanced. No outstanding arrears detected.
                    </div>
                )}

                 <div className="mt-20 pt-10 border-t-2 border-dashed border-slate-200 grid grid-cols-2 gap-20">
                    <div className="text-center">
                        <div className="border-b-2 border-slate-900 h-16 mb-4"></div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Chief Accountant Verified</p>
                    </div>
                    <div className="text-center">
                        <div className="border-b-2 border-slate-900 h-16 mb-4"></div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date of Statement Cycle</p>
                    </div>
                </div>
            </div>
        </ReportWrapper>
    )
}

const ClassListReport: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { schoolInfo } = useData();
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [classList, setClassList] = useState<any[]>([]);

    useEffect(() => {
        api.getClasses().then((res: any) => {
             const list = Array.isArray(res) ? res : res.data;
             setClassList(list);
             if(list.length > 0 && !selectedClassId) setSelectedClassId(list[0].id);
        });
    }, []);

    useEffect(() => {
        if(selectedClassId) {
            setLoading(true);
            api.getStudents({ classId: selectedClassId, pagination: 'false' }).then((res: any) => {
                setStudents(Array.isArray(res) ? res : res.data);
                setLoading(false);
            });
        }
    }, [selectedClassId]);

    const activeClass = classList.find((c: any)=>c.id === selectedClassId);

    return (
        <ReportWrapper title="Nominal Roll" onBack={onBack}>
             <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100">
                <div className="no-print mb-10 flex items-center space-x-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Select Target Nominal Roll:</label>
                    <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} className="p-3 border-2 border-white bg-white shadow-sm rounded-xl focus:border-primary-500 font-bold text-slate-700 outline-none transition-all">
                        {classList.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>

                 <div className="flex justify-between items-end mb-12 border-b-4 border-slate-900 pb-8">
                    <div>
                        <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Nominal Roll</h3>
                        <p className="text-xl font-black text-primary-600 uppercase mt-2 tracking-widest">{activeClass?.name}</p>
                    </div>
                    {schoolInfo?.logoUrl && <img src={schoolInfo.logoUrl} className="h-20 w-auto" alt="Logo" />}
                </div>

                 {loading ? <Skeleton className="h-96 w-full rounded-3xl" /> : (
                <div className="border-2 border-slate-100 rounded-[2.5rem] overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-900 text-white">
                                <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px] w-16">#</th>
                                <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px] border-l border-slate-700">Index Number</th>
                                <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px] border-l border-slate-700">Legal Name</th>
                                <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px] border-l border-slate-700">Enrollment Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-bold uppercase text-xs">
                            {students.map((student, index) => (
                                <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-8 py-4 font-black text-slate-300 text-center">{index + 1}</td>
                                    <td className="px-8 py-4 text-primary-700 font-mono font-black border-l border-slate-50">{student.admissionNumber}</td>
                                    <td className="px-8 py-4 text-slate-800 text-sm font-black border-l border-slate-50">{student.name}</td>
                                    <td className="px-8 py-4 border-l border-slate-50">
                                         <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-[10px] font-black uppercase tracking-widest">Active</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 )}
            </div>
        </ReportWrapper>
    )
}

const AttendanceReport: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { schoolInfo } = useData();
    const [classList, setClassList] = useState<any[]>([]);
    const [classId, setClassId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
         api.getClasses().then((res: any) => {
             const list = Array.isArray(res) ? res : res.data;
             setClassList(list);
             if(list.length > 0 && !classId) setClassId(list[0].id);
        });
    }, []);

    useEffect(() => {
        setLoading(true);
        api.getAttendance({ 
            classId: classId || undefined, 
            startDate: startDate || undefined, 
            endDate: endDate || undefined,
            pagination: 'false'
        }).then((res: any) => {
            const list = Array.isArray(res) ? res : res.data || [];
            const issues = list.filter((r: any) => r.status !== 'Present');
            setRecords(issues);
            setLoading(false);
        });
    }, [classId, startDate, endDate]);

    return (
        <ReportWrapper title="Disciplinary Tracking" onBack={onBack}>
            <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100">
                <div className="no-print grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Class Range</label>
                        <select value={classId} onChange={e => setClassId(e.target.value)} className="w-full p-3 border-2 border-white bg-white shadow-sm rounded-xl font-bold">
                            <option value="">All Classes</option>
                            {classList.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Cycle Start</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-3 border-2 border-white bg-white shadow-sm rounded-xl font-bold"/>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Cycle End</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-3 border-2 border-white bg-white shadow-sm rounded-xl font-bold"/>
                    </div>
                </div>

                 <div className="flex justify-between items-end mb-12 border-b-4 border-slate-900 pb-8">
                    <div>
                        <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Attendance Audit</h3>
                        <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest mt-2">Non-Compliance Log</p>
                    </div>
                    <div className="text-right">
                         <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Incident Count</p>
                         <p className="text-4xl font-black text-primary-700">{records.length}</p>
                    </div>
                </div>

                {loading ? <Skeleton className="h-96 w-full rounded-3xl" /> : (
                <div className="border-2 border-slate-100 rounded-[2.5rem] overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-900 text-white">
                                <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px] border-r border-slate-700">Occurrence Date</th>
                                <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px] border-r border-slate-700">Subject Name</th>
                                <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px] text-center">Status Code</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-bold uppercase text-xs">
                            {records.map(record => (
                                <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-8 py-4 text-slate-500 font-mono border-r border-slate-50">{record.date}</td>
                                    <td className="px-8 py-4 font-black text-slate-800 text-sm border-r border-slate-50">{record.student ? record.student.name : 'Unknown'}</td>
                                    <td className="px-8 py-4 text-center">
                                        <span className={`px-4 py-1.5 rounded-lg font-black text-[10px] tracking-widest ${record.status === 'Absent' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {record.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                             {records.length === 0 && (
                                <tr><td colSpan={3} className="text-center py-20 text-slate-400 font-black uppercase tracking-widest">No exceptions found for current cycle.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                )}
            </div>
        </ReportWrapper>
    )
}

const CashFlowProjection: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { schoolInfo } = useData();
    const [projectionData, setProjectionData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const stats = await api.getDashboardStats();
                setProjectionData(stats.monthlyData || []);
            } catch(e) { console.error(e) }
            finally { setLoading(false); }
        };
        loadData();
    }, []);

    return (
        <ReportWrapper title="Financial Trajectory" onBack={onBack}>
            <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100">
                <div className="flex justify-between items-end mb-16 border-b-4 border-slate-900 pb-8">
                    <div>
                        <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Operating Cashflow</h3>
                        <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest mt-2">6-Month Trend Analysis</p>
                    </div>
                    {schoolInfo?.logoUrl && <img src={schoolInfo.logoUrl} className="h-20 w-auto" alt="Logo" />}
                </div>

                {loading ? <Skeleton className="h-96 w-full rounded-3xl" /> : (
                <div className="w-full h-[500px] mb-12 p-8 border-2 border-slate-50 rounded-[3rem] bg-slate-50/20">
                     <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={projectionData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 'bold', fontSize: 12 }} />
                            <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `KES ${value/1000}k`} tick={{ fill: '#94a3b8', fontWeight: 'bold', fontSize: 12 }} />
                            <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                            <Line type="monotone" dataKey="income" stroke="#16a34a" strokeWidth={5} dot={{ r: 6, strokeWidth: 3, fill: '#fff' }} activeDot={{ r: 8 }} name="Realized Revenue" />
                            <Line type="monotone" dataKey="expenses" stroke="#dc2626" strokeWidth={5} dot={{ r: 6, strokeWidth: 3, fill: '#fff' }} activeDot={{ r: 8 }} name="Operating Expenses" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                )}

                <div className="mt-20 pt-10 border-t-2 border-dashed border-slate-200 text-center">
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.5em]">Forecasting models powered by institutional historical data</p>
                </div>
            </div>
        </ReportWrapper>
    );
};


// =================================================================================
// Main Reporting Directory
// =================================================================================
const Reporting: React.FC = () => {
    const [activeReport, setActiveReport] = useState<string | null>(null);

    const reports = [
        { id: 'summary', title: 'AI Financial Audit', description: 'Institutional health report with Gemini AI reasoning.', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
        { id: 'defaulters', title: 'Debtors Ledger', description: 'Comprehensive listing of student account arrears.', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg> },
        { id: 'projection', title: 'Cashflow Trends', description: 'Visual analytical history of school finances.', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg> },
        { id: 'class_lists', title: 'Nominal Rolls', description: 'Official student lists categorized by grade.', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197" /></svg> },
        { id: 'attendance', title: 'Incident Audit', description: 'Analysis of attendance non-compliance.', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2zM7 15l2 2 4-4" /> },
    ];
    
    const renderContent = () => {
        switch (activeReport) {
            case 'summary': return <FinancialSummary onBack={() => setActiveReport(null)} />;
            case 'defaulters': return <DefaultersReport onBack={() => setActiveReport(null)} />;
            case 'class_lists': return <ClassListReport onBack={() => setActiveReport(null)} />;
            case 'attendance': return <AttendanceReport onBack={() => setActiveReport(null)} />
            case 'projection': return <CashFlowProjection onBack={() => setActiveReport(null)} />
            default:
                return (
                    <div>
                        <div className="mb-10">
                            <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Institutional Reports</h2>
                            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">Management Information System</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {reports.map(report => (
                                <div key={report.id} onClick={() => setActiveReport(report.id)} className="bg-white p-10 rounded-[2.5rem] shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer flex flex-col items-center text-center gap-6 group border border-slate-50">
                                    <div className="text-primary-600 bg-primary-50 p-6 rounded-[2rem] group-hover:scale-110 transition-transform duration-500">{report.icon}</div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{report.title}</h3>
                                        <p className="text-slate-400 font-medium text-sm mt-3 leading-relaxed px-4">{report.description}</p>
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