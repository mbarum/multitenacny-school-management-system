import React, { useState, useMemo, useEffect } from 'react';
import { 
    BarChart3, 
    FileText, 
    Sparkles, 
    AlertTriangle, 
    Users, 
    Calendar, 
    Printer, 
    Download, 
    ArrowLeft, 
    Search, 
    CheckCircle2, 
    TrendingUp, 
    Filter, 
    RefreshCw, 
    Clock, 
    ChevronRight, 
    DollarSign, 
    Phone, 
    Mail, 
    ShieldAlert, 
    GraduationCap, 
    ChevronDown,
    LayoutGrid,
    List,
    Copy,
    Check,
    HardDriveDownload
} from 'lucide-react';
import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import { generateFinancialSummary } from '../services/geminiService';
import { useData } from '../contexts/DataContext';
import * as api from '../services/api';
import Skeleton from '../components/common/Skeleton';
import DataExportBackupView from '../components/admin/DataExportBackupView';

// Helper for CSV Exports
function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]) {
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// =================================================================================
// Universal Report Wrapper with Breadcrumbs, Fast Switcher, and Export Toolbar
// =================================================================================
interface ReportWrapperProps {
    id: string;
    title: string;
    category: string;
    onBack: () => void;
    onSwitchReport: (id: string) => void;
    onExportCSV?: () => void;
    children: React.ReactNode;
}

const REPORT_DIRECTORY = [
    { id: 'summary', title: 'AI Financial Audit', category: 'Financial & Audit' },
    { id: 'defaulters', title: 'Debtors Ledger', category: 'Financial & Audit' },
    { id: 'projection', title: 'Operating Cashflow Trends', category: 'Financial & Audit' },
    { id: 'class_lists', title: 'Nominal Rolls', category: 'Student & Registry' },
    { id: 'attendance', title: 'Attendance Audit', category: 'Operations & Compliance' },
    { id: 'backup', title: 'Data Export & Local Backup', category: 'Operations & Compliance' },
];

const ReportWrapper: React.FC<ReportWrapperProps> = ({ 
    id, 
    title, 
    category, 
    onBack, 
    onSwitchReport, 
    onExportCSV, 
    children 
}) => {
    const { schoolInfo } = useData();
    const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Action Bar & Breadcrumbs (Hidden on Print) */}
            <div className="no-print bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center space-x-3 text-sm">
                    <button 
                        id="btn-report-back-to-directory"
                        onClick={onBack}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all"
                    >
                        <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                        Directory
                    </button>
                    <span className="text-slate-300 dark:text-slate-700">/</span>
                    <span className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">{category}</span>
                    <span className="text-slate-300 dark:text-slate-700">/</span>
                    
                    {/* Fast Switcher Dropdown */}
                    <div className="relative">
                        <button 
                            id="btn-report-switcher-toggle"
                            onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
                            className="inline-flex items-center text-xs font-bold text-slate-800 dark:text-slate-100 hover:text-primary-600 dark:hover:text-primary-400 py-1 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            {title}
                            <ChevronDown className="w-3.5 h-3.5 ml-1.5 opacity-60" />
                        </button>

                        {isSwitcherOpen && (
                            <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 py-2">
                                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                                    Quick Jump to Report
                                </div>
                                {REPORT_DIRECTORY.map(item => (
                                    <button
                                        key={item.id}
                                        id={`btn-report-switch-${item.id}`}
                                        onClick={() => {
                                            onSwitchReport(item.id);
                                            setIsSwitcherOpen(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                                            item.id === id 
                                                ? 'font-bold text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-950/20' 
                                                : 'text-slate-700 dark:text-slate-300'
                                        }`}
                                    >
                                        <span>{item.title}</span>
                                        {item.id === id && <CheckCircle2 className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center space-x-2.5 w-full md:w-auto justify-end">
                    {onExportCSV && (
                        <button
                            id="btn-export-report-csv"
                            onClick={onExportCSV}
                            className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors shadow-xs"
                            title="Export data as CSV"
                        >
                            <Download className="w-3.5 h-3.5 mr-1.5" />
                            Export CSV
                        </button>
                    )}
                    <button
                        id="btn-print-official-report"
                        onClick={() => window.print()}
                        className="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-primary-600 dark:hover:bg-primary-500 rounded-lg transition-all shadow-xs"
                    >
                        <Printer className="w-3.5 h-3.5 mr-1.5" />
                        Print Official Report
                    </button>
                </div>
            </div>

            {/* Printable Report Canvas */}
            <div className="printable-report bg-white dark:bg-slate-900 p-8 md:p-10 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm min-h-[297mm]">
                {/* Formal Header (Visible on print & screen) */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 mb-8 border-b border-slate-200 dark:border-slate-800 gap-4">
                    <div className="flex items-center space-x-4">
                        {schoolInfo?.logoUrl ? (
                            <img 
                                src={schoolInfo.logoUrl} 
                                className="h-14 w-14 object-contain rounded-xl border border-slate-100 dark:border-slate-800" 
                                alt="Institution Seal" 
                            />
                        ) : (
                            <div className="h-14 w-14 rounded-xl bg-primary-50 dark:bg-primary-950 flex items-center justify-center text-primary-600 border border-primary-100 dark:border-primary-900">
                                <GraduationCap className="w-7 h-7" />
                            </div>
                        )}
                        <div>
                            <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
                                {schoolInfo?.name || "Saaslink Institutional Ledger"}
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                Code: {schoolInfo?.schoolCode || "SCH-001"} • Management Information System
                            </p>
                        </div>
                    </div>

                    <div className="text-left sm:text-right">
                        <span className="inline-block px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-[11px] font-bold uppercase tracking-wider">
                            Ref: REP-{Date.now().toString().slice(-6)}
                        </span>
                        <p className="text-[11px] text-slate-400 mt-1">
                            Generated: {new Date().toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                </div>

                {children}

                {/* Formal Document Sign-off Footer */}
                <div className="mt-16 pt-8 border-t border-dashed border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-8 text-center">
                    <div>
                        <div className="h-10 border-b border-slate-300 dark:border-slate-700 mb-2"></div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Prepared By</p>
                    </div>
                    <div>
                        <div className="h-10 border-b border-slate-300 dark:border-slate-700 mb-2"></div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Chief Auditor Verification</p>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                        <div className="h-10 border-b border-slate-300 dark:border-slate-700 mb-2"></div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Principal Approval</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// =================================================================================
// 1. AI Financial Audit Subview
// =================================================================================
const FinancialSummary: React.FC<{ onBack: () => void; onSwitchReport: (id: string) => void }> = ({ onBack, onSwitchReport }) => {
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const handleGenerateSummary = async () => {
        setIsLoading(true);
        setError('');
        setSummary('');
        try {
            const result = await generateFinancialSummary();
            setSummary(result);
        } catch (err) {
            setError('Unable to complete AI financial synthesis. Please check your network or credentials and retry.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        if (!summary) return;
        navigator.clipboard.writeText(summary);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const renderFormattedText = (text: string) => {
        if (!text) return null;
        return text.split('\n').map((line, index) => {
            const trimmed = line.trim();
            const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ');
            const isHeader = trimmed.startsWith('###') || trimmed.startsWith('##');
            const displayLine = isBullet ? trimmed.substring(2) : isHeader ? trimmed.replace(/^#+\s*/, '') : trimmed;
            const parts = displayLine.split(/\*\*(.*?)\*\*/g);

            if (trimmed === '') return <div key={index} className="h-3"></div>;

            if (isHeader) {
                return (
                    <h4 key={index} className="text-base font-bold text-slate-900 dark:text-white mt-5 mb-2 pb-1 border-b border-slate-100 dark:border-slate-800 flex items-center">
                        <Sparkles className="w-4 h-4 mr-2 text-primary-600 dark:text-primary-400" />
                        {displayLine}
                    </h4>
                );
            }

            return (
                <div key={index} className={`text-sm leading-relaxed ${isBullet ? 'pl-5 flex items-start mb-2' : 'mb-2.5'}`}>
                    {isBullet && <span className="mr-2 text-primary-600 dark:text-primary-400 font-bold">•</span>}
                    <span className="text-slate-700 dark:text-slate-300">
                        {parts.map((part, i) =>
                            i % 2 === 1 ? <strong key={i} className="font-bold text-slate-900 dark:text-white">{part}</strong> : part
                        )}
                    </span>
                </div>
            );
        });
    };

    return (
        <ReportWrapper 
            id="summary" 
            title="AI Financial Audit" 
            category="Financial & Audit" 
            onBack={onBack} 
            onSwitchReport={onSwitchReport}
        >
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <div className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-400 border border-primary-200 dark:border-primary-800 mb-2">
                            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-primary-600 dark:text-primary-400" />
                            Gemini 2.0 Strategic Reasoning
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            Institutional Financial Audit & Forecast
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Autonomous multi-dimensional reconciliation across revenue streams, fee collections, and operating burn rate.
                        </p>
                    </div>

                    <div className="no-print flex items-center space-x-2">
                        {summary && (
                            <button
                                id="btn-copy-ai-summary"
                                onClick={handleCopy}
                                className="inline-flex items-center px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                {copied ? <Check className="w-3.5 h-3.5 mr-1.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
                                {copied ? 'Copied' : 'Copy Text'}
                            </button>
                        )}
                        <button 
                            id="btn-initialize-ai-summary"
                            onClick={handleGenerateSummary} 
                            disabled={isLoading} 
                            className="inline-flex items-center px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all disabled:opacity-50"
                        >
                            {isLoading ? (
                                <>
                                    <RefreshCw className="animate-spin w-3.5 h-3.5 mr-2" />
                                    Synthesizing Ledger...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-3.5 h-3.5 mr-2" />
                                    Run Financial Audit
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm font-medium flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
                        {error}
                    </div>
                )}

                {summary ? (
                    <div className="p-6 md:p-8 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 animate-fade-in-up">
                        <div className="max-w-none">
                            {renderFormattedText(summary)}
                        </div>
                    </div>
                ) : (
                    !isLoading && (
                        <div className="no-print p-12 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                            <Sparkles className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Ready to audit financial health</h4>
                            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-md mx-auto mt-1">
                                Click "Run Financial Audit" above to let the Gemini reasoning engine analyze fee collection rates, expenditure variances, and cashflow risks.
                            </p>
                        </div>
                    )
                )}

                {isLoading && (
                    <div className="space-y-4 py-8">
                        <Skeleton className="h-6 w-3/4 rounded-lg" />
                        <Skeleton className="h-20 w-full rounded-xl" />
                        <Skeleton className="h-20 w-full rounded-xl" />
                    </div>
                )}
            </div>
        </ReportWrapper>
    );
};

// =================================================================================
// 2. Debtors Ledger Subview
// =================================================================================
const DefaultersReport: React.FC<{ onBack: () => void; onSwitchReport: (id: string) => void }> = ({ onBack, onSwitchReport }) => {
    const { formatCurrency } = useData();
    const [defaulters, setDefaulters] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClass, setSelectedClass] = useState('ALL');

    useEffect(() => {
        api.getStudents({ pagination: 'false' }).then((res: any) => {
            const list = Array.isArray(res) ? res : res.data || [];
            const withDebt = list.filter((s: any) => s.balance > 0).sort((a: any, b: any) => b.balance - a.balance);
            setDefaulters(withDebt);
            setLoading(false);
        });
    }, []);

    const classesList = useMemo(() => {
        return Array.from(new Set(defaulters.map(d => d.class))).filter(Boolean);
    }, [defaulters]);

    const filtered = useMemo(() => {
        return defaulters.filter(s => {
            const matchesSearch = s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  s.admissionNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  s.guardianContact?.includes(searchQuery);
            const matchesClass = selectedClass === 'ALL' || s.class === selectedClass;
            return matchesSearch && matchesClass;
        });
    }, [defaulters, searchQuery, selectedClass]);

    const totalDeficit = useMemo(() => defaulters.reduce((sum, s) => sum + (s.balance || 0), 0), [defaulters]);
    const filteredDeficit = useMemo(() => filtered.reduce((sum, s) => sum + (s.balance || 0), 0), [filtered]);

    const handleExportCSV = () => {
        const headers = ['Index', 'Admission Number', 'Student Name', 'Class', 'Guardian Contact', 'Balance Due'];
        const rows = filtered.map((s, idx) => [
            idx + 1,
            s.admissionNumber || '',
            s.name || '',
            s.class || '',
            s.guardianContact || '',
            s.balance || 0
        ]);
        downloadCSV(`Debtors_Ledger_${new Date().toISOString().slice(0, 10)}`, headers, rows);
    };

    return (
        <ReportWrapper 
            id="defaulters" 
            title="Debtors Ledger" 
            category="Financial & Audit" 
            onBack={onBack} 
            onSwitchReport={onSwitchReport}
            onExportCSV={handleExportCSV}
        >
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-4">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            Outstanding Arrears Ledger
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Complete enumeration of student balances requiring settlement or parent communication.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-right">
                        <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-100 dark:border-red-900/50">
                            <p className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Total Deficit</p>
                            <p className="text-lg font-black text-red-700 dark:text-red-400">{formatCurrency(totalDeficit)}</p>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Debtors Count</p>
                            <p className="text-lg font-black text-slate-900 dark:text-white">{defaulters.length}</p>
                        </div>
                    </div>
                </div>

                {/* Filter Controls (No Print) */}
                <div className="no-print flex flex-col sm:flex-row gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            id="input-debtors-search"
                            type="text"
                            placeholder="Filter by student name, admission #, or phone..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-primary-500"
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <select
                            id="select-debtors-class-filter"
                            value={selectedClass}
                            onChange={e => setSelectedClass(e.target.value)}
                            className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                        >
                            <option value="ALL">All Classes</option>
                            {classesList.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>

                {/* Data Table */}
                {loading ? (
                    <Skeleton className="h-64 w-full rounded-xl" />
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-[11px] font-bold uppercase tracking-wider">
                                    <th className="px-4 py-3 w-12 text-center">#</th>
                                    <th className="px-4 py-3">Student Identity</th>
                                    <th className="px-4 py-3">Class</th>
                                    <th className="px-4 py-3">Primary Guardian</th>
                                    <th className="px-4 py-3 text-right">Balance Due</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                                {filtered.map((student, idx) => (
                                    <tr key={student.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-4 py-3 text-center font-bold text-slate-400">{idx + 1}</td>
                                        <td className="px-4 py-3">
                                            <div className="font-bold text-slate-900 dark:text-white">{student.name}</div>
                                            <div className="text-[11px] text-slate-400 font-mono">{student.admissionNumber}</div>
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">{student.class}</td>
                                        <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                                            <div className="flex items-center space-x-1">
                                                <Phone className="w-3 h-3 text-slate-400 mr-1" />
                                                {student.guardianContact || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right font-black text-red-600 dark:text-red-400 text-sm">
                                            {formatCurrency(student.balance)}
                                        </td>
                                    </tr>
                                ))}

                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs font-semibold">
                                            No outstanding arrears found matching current filter parameters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </ReportWrapper>
    );
};

// =================================================================================
// 3. Nominal Rolls Subview
// =================================================================================
const ClassListReport: React.FC<{ onBack: () => void; onSwitchReport: (id: string) => void }> = ({ onBack, onSwitchReport }) => {
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [classList, setClassList] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        api.getClasses().then((res: any) => {
            const list = Array.isArray(res) ? res : res.data || [];
            setClassList(list);
            if (list.length > 0 && !selectedClassId) setSelectedClassId(list[0].id);
        });
    }, []);

    useEffect(() => {
        if (selectedClassId) {
            setLoading(true);
            api.getStudents({ classId: selectedClassId, pagination: 'false' }).then((res: any) => {
                setStudents(Array.isArray(res) ? res : res.data || []);
                setLoading(false);
            });
        }
    }, [selectedClassId]);

    const activeClass = classList.find((c: any) => c.id === selectedClassId);

    const filteredStudents = useMemo(() => {
        return students.filter(s => 
            s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.admissionNumber?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [students, searchQuery]);

    const handleExportCSV = () => {
        const headers = ['Index', 'Admission Number', 'Student Legal Name', 'Class Code', 'Enrollment Status'];
        const rows = filteredStudents.map((s, idx) => [
            idx + 1,
            s.admissionNumber || '',
            s.name || '',
            activeClass?.name || '',
            'Active'
        ]);
        downloadCSV(`Nominal_Roll_${activeClass?.name || 'Class'}_${new Date().toISOString().slice(0, 10)}`, headers, rows);
    };

    return (
        <ReportWrapper 
            id="class_lists" 
            title="Nominal Rolls" 
            category="Student & Registry" 
            onBack={onBack} 
            onSwitchReport={onSwitchReport}
            onExportCSV={handleExportCSV}
        >
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-4">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            Official Nominal Roll
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Class registry records, legal enrollment roster, and admission index tracking.
                        </p>
                    </div>

                    <div className="p-3 bg-primary-50 dark:bg-primary-950/30 rounded-xl border border-primary-100 dark:border-primary-900 text-right">
                        <p className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider">Class Cohort</p>
                        <p className="text-lg font-black text-primary-700 dark:text-primary-300">
                            {activeClass?.name || 'Select Class'} ({students.length} Enrolled)
                        </p>
                    </div>
                </div>

                {/* Class Selector Bar (No Print) */}
                <div className="no-print flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 custom-scrollbar">
                        {classList.map((c: any) => (
                            <button
                                key={c.id}
                                id={`btn-nominal-class-${c.id}`}
                                onClick={() => setSelectedClassId(c.id)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                                    selectedClassId === c.id
                                        ? 'bg-primary-600 text-white shadow-xs'
                                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
                                }`}
                            >
                                {c.name}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full sm:w-64">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            id="input-nominal-search"
                            type="text"
                            placeholder="Find student in roll..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        />
                    </div>
                </div>

                {/* Table */}
                {loading ? (
                    <Skeleton className="h-64 w-full rounded-xl" />
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-[11px] font-bold uppercase tracking-wider">
                                    <th className="px-4 py-3 w-12 text-center">#</th>
                                    <th className="px-4 py-3">Admission Number</th>
                                    <th className="px-4 py-3">Full Legal Name</th>
                                    <th className="px-4 py-3 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                                {filteredStudents.map((student, idx) => (
                                    <tr key={student.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-4 py-3 text-center font-bold text-slate-400">{idx + 1}</td>
                                        <td className="px-4 py-3 font-mono font-bold text-primary-600 dark:text-primary-400">{student.admissionNumber}</td>
                                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{student.name}</td>
                                        <td className="px-4 py-3 text-right">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900">
                                                Enrolled
                                            </span>
                                        </td>
                                    </tr>
                                ))}

                                {filteredStudents.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs font-semibold">
                                            No students found in {activeClass?.name || 'this class'}.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </ReportWrapper>
    );
};

// =================================================================================
// 4. Attendance Incident Audit Subview
// =================================================================================
const AttendanceReport: React.FC<{ onBack: () => void; onSwitchReport: (id: string) => void }> = ({ onBack, onSwitchReport }) => {
    const [classList, setClassList] = useState<any[]>([]);
    const [classId, setClassId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.getClasses().then((res: any) => {
            const list = Array.isArray(res) ? res : res.data || [];
            setClassList(list);
            if (list.length > 0 && !classId) setClassId(list[0].id);
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

    const handleExportCSV = () => {
        const headers = ['Occurrence Date', 'Subject / Student', 'Status Code', 'Class ID'];
        const rows = records.map(r => [
            r.date || '',
            r.student?.name || 'Unknown',
            r.status || '',
            classId || 'All Classes'
        ]);
        downloadCSV(`Attendance_Non_Compliance_${new Date().toISOString().slice(0, 10)}`, headers, rows);
    };

    return (
        <ReportWrapper 
            id="attendance" 
            title="Attendance Audit" 
            category="Operations & Compliance" 
            onBack={onBack} 
            onSwitchReport={onSwitchReport}
            onExportCSV={handleExportCSV}
        >
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-4">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            Attendance & Compliance Exception Log
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Audited record of unexcused absences, truancy patterns, and tardiness events.
                        </p>
                    </div>

                    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-100 dark:border-amber-900 text-right">
                        <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Exception Events</p>
                        <p className="text-lg font-black text-amber-800 dark:text-amber-300">{records.length}</p>
                    </div>
                </div>

                {/* Filter Controls (No Print) */}
                <div className="no-print grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Target Class</label>
                        <select
                            id="select-attendance-class"
                            value={classId}
                            onChange={e => setClassId(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                        >
                            <option value="">All Classes</option>
                            {classList.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">From Date</label>
                        <input
                            id="input-attendance-start-date"
                            type="date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">To Date</label>
                        <input
                            id="input-attendance-end-date"
                            type="date"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                        />
                    </div>
                </div>

                {/* Table */}
                {loading ? (
                    <Skeleton className="h-64 w-full rounded-xl" />
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-[11px] font-bold uppercase tracking-wider">
                                    <th className="px-4 py-3">Occurrence Date</th>
                                    <th className="px-4 py-3">Student Name</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                                {records.map(record => (
                                    <tr key={record.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-4 py-3 font-mono text-slate-500">{record.date}</td>
                                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                                            {record.student ? record.student.name : 'Unknown'}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold ${
                                                record.status === 'Absent' 
                                                    ? 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900' 
                                                    : 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900'
                                            }`}>
                                                {record.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}

                                {records.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs font-semibold">
                                            No compliance exceptions found for the specified period.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </ReportWrapper>
    );
};

// =================================================================================
// 5. Operating Cashflow Trends Subview
// =================================================================================
const CashFlowProjection: React.FC<{ onBack: () => void; onSwitchReport: (id: string) => void }> = ({ onBack, onSwitchReport }) => {
    const { schoolInfo, formatCurrency, convertCurrency } = useData();
    const [projectionData, setProjectionData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const stats = await api.getDashboardStats();
                setProjectionData(stats.monthlyData || []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const totals = useMemo(() => {
        const rev = projectionData.reduce((acc, curr) => acc + (curr.income || 0), 0);
        const exp = projectionData.reduce((acc, curr) => acc + (curr.expenses || 0), 0);
        return { rev, exp, net: rev - exp };
    }, [projectionData]);

    const handleExportCSV = () => {
        const headers = ['Month', 'Realized Revenue', 'Operating Expenses', 'Net Balance'];
        const rows = projectionData.map(d => [
            d.name || '',
            d.income || 0,
            d.expenses || 0,
            (d.income || 0) - (d.expenses || 0)
        ]);
        downloadCSV(`Cashflow_Trajectory_${new Date().toISOString().slice(0, 10)}`, headers, rows);
    };

    return (
        <ReportWrapper 
            id="projection" 
            title="Cashflow Trends" 
            category="Financial & Audit" 
            onBack={onBack} 
            onSwitchReport={onSwitchReport}
            onExportCSV={handleExportCSV}
        >
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-4">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            Operating Cashflow Trajectory
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Six-month analytical trajectory balancing realized school fees against operating outflows.
                        </p>
                    </div>

                    <div className="flex items-center space-x-3">
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900 text-right">
                            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Revenue</p>
                            <p className="text-base font-black text-emerald-700 dark:text-emerald-300">{formatCurrency(totals.rev)}</p>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-right">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Net Position</p>
                            <p className={`text-base font-black ${totals.net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {formatCurrency(totals.net)}
                            </p>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <Skeleton className="h-80 w-full rounded-xl" />
                ) : (
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={projectionData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                                    <defs>
                                        <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.6} />
                                    <XAxis 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} 
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tickFormatter={(value) => {
                                            const converted = convertCurrency(value, schoolInfo?.currency || 'KES');
                                            return `${Math.round(converted/1000)}k`;
                                        }} 
                                        tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} 
                                    />
                                    <Tooltip 
                                        contentStyle={{ 
                                            borderRadius: '0.75rem', 
                                            border: '1px solid #e2e8f0',
                                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                                        }} 
                                        formatter={(value: any) => formatCurrency(Number(value || 0))}
                                    />
                                    <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#incomeGradient)" name="Realized Revenue" />
                                    <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#expenseGradient)" name="Operating Outflows" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>
        </ReportWrapper>
    );
};

// =================================================================================
// Main Reporting Directory (Expert UI/UX Redesign)
// =================================================================================
const Reporting: React.FC = () => {
    const { schoolInfo, formatCurrency } = useData();
    const [activeReport, setActiveReport] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const reports = [
        { 
            id: 'summary', 
            title: 'AI Financial Audit', 
            category: 'Financial & Audit',
            description: 'Multi-vector ledger diagnostics synthesized via Gemini 2.0 reasoning.', 
            icon: Sparkles,
            accent: 'text-primary-600 bg-primary-50 dark:bg-primary-950/40 border-primary-200 dark:border-primary-800',
            tags: ['AI Powered', 'Real-Time', 'Executive Summary']
        },
        { 
            id: 'defaulters', 
            title: 'Debtors Ledger', 
            category: 'Financial & Audit',
            description: 'Itemized register of overdue student fee arrears and guardian contacts.', 
            icon: AlertTriangle,
            accent: 'text-red-600 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800',
            tags: ['Arrears Tracking', 'Print-Ready', 'Guardian Contacts']
        },
        { 
            id: 'projection', 
            title: 'Cashflow Trends', 
            category: 'Financial & Audit',
            description: 'Six-month visual comparative chart balancing collections against operational burn.', 
            icon: TrendingUp,
            accent: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
            tags: ['Analytical Chart', '6-Month Scope', 'Variance Model']
        },
        { 
            id: 'class_lists', 
            title: 'Nominal Rolls', 
            category: 'Student & Registry',
            description: 'Statutory class roster tracking admission numbers and legal names.', 
            icon: Users,
            accent: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
            tags: ['Class Cohorts', 'Index Register', 'Statutory Standard']
        },
        { 
            id: 'attendance', 
            title: 'Attendance Audit', 
            category: 'Operations & Compliance',
            description: 'Exception reporting for unexcused absenteeism and tardiness patterns.', 
            icon: Calendar,
            accent: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
            tags: ['Compliance Log', 'Disciplinary Audit', 'Date Filterable']
        },
        { 
            id: 'backup', 
            title: 'School Records Backup & Data Export', 
            category: 'Operations & Compliance',
            description: 'Download complete school records (students, fees, and staff) as CSV or PDF archives for local backup and compliance.', 
            icon: HardDriveDownload,
            accent: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800',
            tags: ['Students', 'Fees', 'Staff', 'CSV & PDF Backup', 'Compliance']
        },
    ];

    const categories = [
        { id: 'ALL', label: 'All Reports' },
        { id: 'Financial & Audit', label: 'Financial & Audit' },
        { id: 'Student & Registry', label: 'Student & Registry' },
        { id: 'Operations & Compliance', label: 'Operations & Compliance' },
    ];

    const filteredReports = useMemo(() => {
        return reports.filter(r => {
            const matchesCategory = selectedCategory === 'ALL' || r.category === selectedCategory;
            const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  r.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesCategory && matchesSearch;
        });
    }, [reports, selectedCategory, searchQuery]);

    if (activeReport) {
        switch (activeReport) {
            case 'summary': return <div className="p-6 md:p-8"><FinancialSummary onBack={() => setActiveReport(null)} onSwitchReport={setActiveReport} /></div>;
            case 'defaulters': return <div className="p-6 md:p-8"><DefaultersReport onBack={() => setActiveReport(null)} onSwitchReport={setActiveReport} /></div>;
            case 'class_lists': return <div className="p-6 md:p-8"><ClassListReport onBack={() => setActiveReport(null)} onSwitchReport={setActiveReport} /></div>;
            case 'attendance': return <div className="p-6 md:p-8"><AttendanceReport onBack={() => setActiveReport(null)} onSwitchReport={setActiveReport} /></div>;
            case 'projection': return <div className="p-6 md:p-8"><CashFlowProjection onBack={() => setActiveReport(null)} onSwitchReport={setActiveReport} /></div>;
            case 'backup': return (
                <div className="p-6 md:p-8 space-y-6">
                    <button 
                        id="btn-report-back-to-dir-backup"
                        onClick={() => setActiveReport(null)}
                        className="inline-flex items-center px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-primary-600 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-all"
                    >
                        <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                        Back to Reports Directory
                    </button>
                    <DataExportBackupView />
                </div>
            );
            default: return null;
        }
    }

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in-up">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
                <div>
                    <div className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 mb-2">
                        <FileText className="w-3.5 h-3.5 mr-1.5 text-primary-600" />
                        Executive Management Information System
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        Institutional Reports & Analytics
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Centralized repository of statutory audits, AI financial insights, and student nominal registries.
                    </p>
                </div>

                <div className="flex items-center space-x-2.5">
                    <button
                        id="btn-print-directory-manifest"
                        onClick={() => window.print()}
                        className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs transition-colors"
                    >
                        <Printer className="w-3.5 h-3.5 mr-1.5" />
                        Print Catalog
                    </button>
                    <button
                        id="btn-launch-ai-audit-direct"
                        onClick={() => setActiveReport('summary')}
                        className="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition-all"
                    >
                        <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                        Run AI Audit
                    </button>
                </div>
            </div>

            {/* Strategic Quick Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center space-x-4">
                    <div className="p-3 bg-primary-50 dark:bg-primary-950/50 text-primary-600 rounded-xl">
                        <FileText className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reports Ready</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{reports.length} Modules</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center space-x-4">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-xl">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Audit Engine</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">Active (v2.0)</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center space-x-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-600 rounded-xl">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sync Frequency</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">Real-Time</p>
                    </div>
                </div>
            </div>

            {/* Search & Category Filter Navigation */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                {/* Category Pills */}
                <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            id={`btn-report-cat-${cat.id}`}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                                selectedCategory === cat.id
                                    ? 'bg-primary-600 text-white shadow-xs'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Search & View Toggle */}
                <div className="flex items-center space-x-2">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            id="input-reports-catalog-search"
                            type="text"
                            placeholder="Search reports or tags..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:bg-white dark:focus:bg-slate-900 focus:border-primary-500"
                        />
                    </div>

                    <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 bg-slate-50 dark:bg-slate-800">
                        <button
                            id="btn-view-mode-grid"
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
                            title="Grid View"
                        >
                            <LayoutGrid className="w-3.5 h-3.5" />
                        </button>
                        <button
                            id="btn-view-mode-list"
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
                            title="List View"
                        >
                            <List className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Reports Grid / List */}
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredReports.map(report => {
                        const Icon = report.icon;
                        return (
                            <div 
                                key={report.id}
                                id={`card-report-${report.id}`}
                                onClick={() => setActiveReport(report.id)}
                                className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary-500/50 dark:hover:border-primary-500/50 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-3 rounded-xl border ${report.accent}`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                            {report.category}
                                        </span>
                                    </div>

                                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                        {report.title}
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                                        {report.description}
                                    </p>
                                </div>

                                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                        {report.tags.map((tag, i) => (
                                            <span key={i} className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex items-center justify-between text-xs font-bold text-primary-600 dark:text-primary-400">
                                        <span>Open Report</span>
                                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                    {filteredReports.map(report => {
                        const Icon = report.icon;
                        return (
                            <div
                                key={report.id}
                                id={`list-item-report-${report.id}`}
                                onClick={() => setActiveReport(report.id)}
                                className="p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer flex items-center justify-between gap-4"
                            >
                                <div className="flex items-center space-x-4">
                                    <div className={`p-2.5 rounded-lg border ${report.accent}`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="flex items-center space-x-2">
                                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                                {report.title}
                                            </h4>
                                            <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.2 rounded">
                                                {report.category}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                            {report.description}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-3">
                                    <div className="hidden sm:flex items-center space-x-1.5">
                                        {report.tags.slice(0, 2).map((t, idx) => (
                                            <span key={idx} className="text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-400" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {filteredReports.length === 0 && (
                <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                    <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">No reports matched your search</h4>
                    <p className="text-xs text-slate-400 mt-1">Try clearing your filters or changing keywords.</p>
                </div>
            )}
        </div>
    );
};

export default Reporting;
