/**
 * SaasLink Technologies Ltd - Diagnostic & Error Logging Utility
 * Captures, buffers, and persists runtime errors, unhandled rejections, 
 * and API anomalies for rapid troubleshooting.
 */

export interface LogEntry {
    id: string;
    timestamp: string;
    level: 'error' | 'warn' | 'info';
    message: string;
    stack?: string;
    context?: Record<string, any>;
    url: string;
    userAgent: string;
}

const STORAGE_KEY = 'saaslink_diagnostic_logs';
const MAX_LOGS = 60;

class ErrorLogger {
    private logs: LogEntry[] = [];
    private listeners: Array<(logs: LogEntry[]) => void> = [];
    private initialized = false;

    constructor() {
        this.loadLogs();
        if (typeof window !== 'undefined') {
            this.initGlobalHandlers();
        }
    }

    private loadLogs() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                this.logs = JSON.parse(raw);
            }
        } catch {
            this.logs = [];
        }
    }

    private saveLogs() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.logs.slice(-MAX_LOGS)));
        } catch (e) {
            console.warn('Could not persist diagnostic logs to localStorage', e);
        }
    }

    private notifyListeners() {
        this.listeners.forEach(fn => fn([...this.logs]));
    }

    public subscribe(listener: (logs: LogEntry[]) => void): () => void {
        this.listeners.push(listener);
        listener([...this.logs]);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    public initGlobalHandlers() {
        if (this.initialized) return;
        this.initialized = true;

        // Catch global unhandled JS runtime errors
        window.addEventListener('error', (event) => {
            this.log('error', event.message || 'Uncaught window error', {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack
            });
        });

        // Catch unhandled Promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            const reason = event.reason;
            const message = reason instanceof Error ? reason.message : String(reason || 'Unhandled Promise Rejection');
            const stack = reason instanceof Error ? reason.stack : undefined;
            this.log('error', `Promise Rejection: ${message}`, { stack });
        });

        // Intercept console.error to catch react render errors and API failures
        const originalConsoleError = console.error;
        console.error = (...args: any[]) => {
            originalConsoleError.apply(console, args);
            try {
                const message = args.map(a => (typeof a === 'object' ? (a?.message || JSON.stringify(a)) : String(a))).join(' ');
                // Filter out benign Vite HMR warnings
                if (message.includes('[vite] failed to connect to websocket')) return;
                this.log('error', message);
            } catch {
                // Ignore circular serialization errors
            }
        };

        this.log('info', 'SaasLink Diagnostic Error Logger initialized successfully.');
    }

    public log(level: 'error' | 'warn' | 'info', message: string, context?: Record<string, any>) {
        const entry: LogEntry = {
            id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            timestamp: new Date().toISOString(),
            level,
            message,
            stack: context?.stack,
            context,
            url: typeof window !== 'undefined' ? window.location.href : '',
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server'
        };

        this.logs.push(entry);
        if (this.logs.length > MAX_LOGS) {
            this.logs = this.logs.slice(-MAX_LOGS);
        }
        this.saveLogs();
        this.notifyListeners();
    }

    public getLogs(): LogEntry[] {
        return [...this.logs];
    }

    public getErrorCount(): number {
        return this.logs.filter(l => l.level === 'error').length;
    }

    public clearLogs() {
        this.logs = [];
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch {
            // Ignore
        }
        this.notifyListeners();
    }

    public exportLogsAsJson(): string {
        return JSON.stringify({
            application: 'SaasLink School Management System',
            owner: 'SaasLink Technologies Ltd',
            exportedAt: new Date().toISOString(),
            totalLogs: this.logs.length,
            errorCount: this.getErrorCount(),
            logs: this.logs
        }, null, 2);
    }
}

export const errorLogger = new ErrorLogger();
