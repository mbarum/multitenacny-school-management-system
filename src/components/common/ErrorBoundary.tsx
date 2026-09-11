
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { errorLogger } from '../../utils/errorLogger';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
  showDetails: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false,
    showDetails: false
  };

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    // Log to our central diagnostic error logger
    errorLogger.log('error', `React Component Error: ${error.message || String(error)}`, {
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }

  private handleCopyDiagnostic = async () => {
    try {
      const payload = {
        application: 'SaasLink School Management System',
        owner: 'SaasLink Technologies Ltd',
        timestamp: new Date().toISOString(),
        error: this.state.error?.message,
        stack: this.state.error?.stack,
        componentStack: this.state.errorInfo?.componentStack,
        url: window.location.href,
        userAgent: navigator.userAgent
      };
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2500);
    } catch {
      // Ignore
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] h-full p-8 bg-slate-50 dark:bg-slate-900 text-center rounded-2xl border border-slate-200 dark:border-slate-800 m-4 shadow-sm">
          <div className="bg-red-100 dark:bg-red-950/50 p-4 rounded-full mb-4 border border-red-200 dark:border-red-900/60">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">Something went wrong</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md text-sm leading-relaxed">
            The application encountered an unexpected error. This incident has been logged in the local diagnostic ledger for rapid troubleshooting.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
            >
              Reload Page
            </button>
            <button
              onClick={this.handleCopyDiagnostic}
              className="px-5 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-all active:scale-95"
            >
              {this.state.copied ? 'Copied Diagnostics!' : 'Copy Error Details'}
            </button>
            <button
              onClick={() => this.setState({ showDetails: !this.state.showDetails })}
              className="px-4 py-2.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium underline"
            >
              {this.state.showDetails ? 'Hide Diagnostics' : 'View Diagnostics'}
            </button>
          </div>

          {this.state.showDetails && this.state.error && (
            <div className="mt-6 p-4 bg-slate-900 text-red-300 text-xs text-left rounded-xl overflow-auto max-w-3xl w-full font-mono border border-slate-800">
              <div className="font-bold text-white mb-1">Exception Message:</div>
              <div className="mb-3 text-red-400">{this.state.error.toString()}</div>
              {this.state.errorInfo && (
                <>
                  <div className="font-bold text-slate-400 mb-1">Component Hierarchy:</div>
                  <pre className="text-[11px] text-slate-300 whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                </>
              )}
            </div>
          )}
        </div>
      );
    }

    // Force cast to avoid strict typing issues in some environments where inheriting props is flaky
    return (this as any).props.children;
  }
}

export default ErrorBoundary;
