import React, { useState, useEffect } from 'react';
import { errorLogger, LogEntry } from '../../utils/errorLogger';
import Modal from './Modal';
import { 
    AlertTriangle, 
    CheckCircle2, 
    Copy, 
    Download, 
    Trash2, 
    Terminal, 
    Search,
    RefreshCw,
    Bug
} from 'lucide-react';

interface DiagnosticConsoleModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const DiagnosticConsoleModal: React.FC<DiagnosticConsoleModalProps> = ({ isOpen, onClose }) => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [filterLevel, setFilterLevel] = useState<'all' | 'error' | 'warn' | 'info'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [copyAllStatus, setCopyAllStatus] = useState(false);

    useEffect(() => {
        const unsubscribe = errorLogger.subscribe((newLogs) => {
            setLogs(newLogs);
        });
        return unsubscribe;
    }, []);

    const filteredLogs = logs.filter(log => {
        if (filterLevel !== 'all' && log.level !== filterLevel) return false;
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            return log.message.toLowerCase().includes(term) || (log.stack && log.stack.toLowerCase().includes(term));
        }
        return true;
    }).reverse(); // Latest first

    const handleCopyAll = async () => {
        try {
            await navigator.clipboard.writeText(errorLogger.exportLogsAsJson());
            setCopyAllStatus(true);
            setTimeout(() => setCopyAllStatus(false), 2000);
        } catch (e) {
            console.warn('Clipboard copy error', e);
        }
    };

    const handleCopySingle = async (entry: LogEntry) => {
        try {
            const text = `[${entry.level.toUpperCase()}] ${entry.timestamp}\nMessage: ${entry.message}\nURL: ${entry.url}\n${entry.stack ? `Stack:\n${entry.stack}` : ''}`;
            await navigator.clipboard.writeText(text);
            setCopiedId(entry.id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (e) {
            console.warn('Clipboard copy error', e);
        }
    };

    const handleDownloadJson = () => {
        const data = errorLogger.exportLogsAsJson();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `saaslink-diagnostic-logs-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleTriggerTestError = () => {
        errorLogger.log('error', `Manual Test Diagnostic Error triggered at ${new Date().toLocaleTimeString()}`, {
            userInitiated: true,
            sampleContext: { route: window.location.pathname, status: 'Testing diagnostic pipeline' },
            stack: new Error('Simulated diagnostic test stack').stack
        });
    };

    const errorsCount = logs.filter(l => l.level === 'error').length;
    const warnsCount = logs.filter(l => l.level === 'warn').length;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="System Troubleshooting & Diagnostic Logs"
            size="xl"
        >
            <div className="space-y-4">
                {/* Header Summary & Actions Bar */}
                <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-slate-800 rounded-xl text-primary-400">
                            <Terminal className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold tracking-tight">Active Application Diagnostics</h3>
                                <span className="text-[10px] bg-primary-500/20 text-primary-300 font-mono px-2 py-0.5 rounded-full border border-primary-500/30">
                                    SaasLink Technologies Ltd
                                </span>
                            </div>
                            <p className="text-xs text-slate-400">
                                Total buffered: <strong className="text-white">{logs.length}</strong> entries • 
                                <span className={`ml-1 font-bold ${errorsCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                    {errorsCount} Errors
                                </span> • 
                                <span className="ml-1 text-amber-400 font-bold">{warnsCount} Warnings</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            id="btn-copy-diagnostics"
                            type="button"
                            onClick={handleCopyAll}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-all border border-slate-700 active:scale-95"
                            title="Copy entire diagnostic report to clipboard"
                        >
                            <Copy className="w-3.5 h-3.5" />
                            <span>{copyAllStatus ? 'Copied JSON!' : 'Copy All'}</span>
                        </button>

                        <button
                            id="btn-download-diagnostics"
                            type="button"
                            onClick={handleDownloadJson}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-all border border-slate-700 active:scale-95"
                            title="Download JSON diagnostic logs"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span>Export .JSON</span>
                        </button>

                        <button
                            id="btn-clear-diagnostics"
                            type="button"
                            onClick={() => errorLogger.clearLogs()}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded-xl text-xs font-semibold transition-all border border-rose-800/40 active:scale-95"
                            title="Clear diagnostic buffer"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Clear</span>
                        </button>
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={() => setFilterLevel('all')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${filterLevel === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                            All ({logs.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterLevel('error')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${filterLevel === 'error' ? 'bg-rose-600 text-white shadow-sm' : 'text-rose-700 hover:bg-rose-50'}`}
                        >
                            Errors ({errorsCount})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterLevel('warn')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${filterLevel === 'warn' ? 'bg-amber-600 text-white shadow-sm' : 'text-amber-700 hover:bg-amber-50'}`}
                        >
                            Warns ({warnsCount})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterLevel('info')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${filterLevel === 'info' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                            Info
                        </button>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search stack traces & messages..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={handleTriggerTestError}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium flex items-center gap-1 border border-slate-200 shrink-0"
                            title="Simulate a test error to verify logging"
                        >
                            <Bug className="w-3.5 h-3.5 text-slate-500" />
                            <span className="hidden sm:inline">Test Error</span>
                        </button>
                    </div>
                </div>

                {/* Log List View */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-950 font-mono text-xs max-h-[500px] overflow-y-auto divide-y divide-slate-800 shadow-inner">
                    {filteredLogs.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 space-y-2">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                            <p className="font-sans font-bold text-slate-300">No diagnostic logs found matching criteria.</p>
                            <p className="font-sans text-xs text-slate-500">The application is running clean without any unhandled runtime exceptions.</p>
                        </div>
                    ) : (
                        filteredLogs.map((entry) => (
                            <div key={entry.id} className="p-3.5 hover:bg-slate-900/80 transition-colors space-y-1.5 group">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                            entry.level === 'error'
                                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                                : entry.level === 'warn'
                                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                        }`}>
                                            {entry.level}
                                        </span>
                                        <span className="text-slate-400 text-[11px]">
                                            {new Date(entry.timestamp).toLocaleTimeString()} • {new Date(entry.timestamp).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleCopySingle(entry)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-white flex items-center gap-1 text-[11px] bg-slate-800 px-2 py-0.5 rounded"
                                        title="Copy single entry"
                                    >
                                        <Copy className="w-3 h-3" />
                                        <span>{copiedId === entry.id ? 'Copied' : 'Copy'}</span>
                                    </button>
                                </div>

                                <div className="text-slate-200 font-semibold break-words leading-relaxed">
                                    {entry.message}
                                </div>

                                {entry.stack && (
                                    <details className="mt-1 pt-1 border-t border-slate-800/80">
                                        <summary className="text-[11px] text-primary-400 cursor-pointer hover:underline select-none">
                                            View Component & Call Stack Trace
                                        </summary>
                                        <pre className="mt-1.5 p-2.5 bg-slate-900 rounded-lg text-slate-300 text-[10px] overflow-x-auto whitespace-pre-wrap leading-tight border border-slate-800">
                                            {entry.stack}
                                        </pre>
                                    </details>
                                )}

                                {entry.context && Object.keys(entry.context).length > 0 && (
                                    <div className="text-[10px] text-slate-400">
                                        Context: <span className="text-slate-300">{JSON.stringify(entry.context)}</span>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                        <Terminal className="w-3.5 h-3.5 text-slate-400" />
                        Diagnostic log buffer persists up to 60 events in browser storage.
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl"
                    >
                        Close Diagnostics
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default DiagnosticConsoleModal;
