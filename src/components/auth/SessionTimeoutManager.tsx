import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useData } from '../../contexts/DataContext';
import { ShieldAlert, Clock, LogOut, RefreshCw } from 'lucide-react';

interface SessionTimeoutManagerProps {
    // Inactivity timeout in minutes (default 15 minutes)
    timeoutMinutes?: number;
    // Warning countdown in seconds before logout (default 60 seconds)
    warningSeconds?: number;
}

export const SessionTimeoutManager: React.FC<SessionTimeoutManagerProps> = ({
    timeoutMinutes = 15,
    warningSeconds = 60
}) => {
    const { currentUser, handleLogout } = useData();
    const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
    const [showWarning, setShowWarning] = useState<boolean>(false);
    const lastActivityRef = useRef<number>(Date.now());
    const throttleRef = useRef<number>(0);

    const totalTimeoutMs = timeoutMinutes * 60 * 1000;
    const warningMs = warningSeconds * 1000;

    // Reset activity timer and sync across browser tabs via localStorage
    const recordActivity = useCallback(() => {
        const now = Date.now();
        // Throttle updates to avoid unnecessary storage writes (at most once every 5 seconds)
        if (now - throttleRef.current < 5000) return;
        
        throttleRef.current = now;
        lastActivityRef.current = now;
        try {
            localStorage.setItem('saaslink_last_activity', now.toString());
        } catch {
            // In case localStorage is blocked
        }

        // If warning is currently showing and user explicitly interacted, dismiss warning
        if (showWarning) {
            setShowWarning(false);
            setSecondsRemaining(null);
        }
    }, [showWarning]);

    // Explicit "Stay Logged In" user action
    const handleStayLoggedIn = () => {
        const now = Date.now();
        throttleRef.current = now;
        lastActivityRef.current = now;
        try {
            localStorage.setItem('saaslink_last_activity', now.toString());
        } catch {
            // ignore
        }
        setShowWarning(false);
        setSecondsRemaining(null);
    };

    // Explicit manual logout
    const handleManualLogout = async () => {
        setShowWarning(false);
        setSecondsRemaining(null);
        await handleLogout();
    };

    // Attach user activity listeners
    useEffect(() => {
        if (!currentUser) {
            setShowWarning(false);
            setSecondsRemaining(null);
            return;
        }

        // Initialize last activity timestamp
        const now = Date.now();
        lastActivityRef.current = now;
        try {
            localStorage.setItem('saaslink_last_activity', now.toString());
        } catch {
            // ignore
        }

        const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll', 'click'];
        const handleEvent = () => recordActivity();

        events.forEach(evt => window.addEventListener(evt, handleEvent, { passive: true }));

        // Listen for storage events to synchronize across multi-tab sessions
        const handleStorage = (e: StorageEvent) => {
            if (e.key === 'saaslink_last_activity' && e.newValue) {
                const updatedTime = parseInt(e.newValue, 10);
                if (!isNaN(updatedTime)) {
                    lastActivityRef.current = updatedTime;
                    if (showWarning) {
                        setShowWarning(false);
                        setSecondsRemaining(null);
                    }
                }
            }
            // If another tab cleared authToken, log out this tab too
            if (e.key === 'authToken' && !e.newValue) {
                handleLogout();
            }
        };

        window.addEventListener('storage', handleStorage);

        return () => {
            events.forEach(evt => window.removeEventListener(evt, handleEvent));
            window.removeEventListener('storage', handleStorage);
        };
    }, [currentUser, recordActivity, showWarning, handleLogout]);

    // Interval checker for inactivity and countdown
    useEffect(() => {
        if (!currentUser) return;

        const interval = setInterval(() => {
            let lastActive = lastActivityRef.current;
            try {
                const stored = localStorage.getItem('saaslink_last_activity');
                if (stored) {
                    const parsed = parseInt(stored, 10);
                    if (!isNaN(parsed) && parsed > lastActive) {
                        lastActive = parsed;
                        lastActivityRef.current = parsed;
                    }
                }
            } catch {
                // ignore
            }

            const elapsed = Date.now() - lastActive;
            const remaining = totalTimeoutMs - elapsed;

            if (remaining <= 0) {
                // Inactivity threshold reached - execute secure logout
                clearInterval(interval);
                setShowWarning(false);
                setSecondsRemaining(null);
                try {
                    sessionStorage.setItem('saaslink_session_expired', 'Your session timed out after 15 minutes of inactivity. Please sign in again.');
                } catch {
                    // ignore
                }
                handleLogout();
            } else if (remaining <= warningMs) {
                // Within warning window (e.g. last 60 seconds)
                setShowWarning(true);
                setSecondsRemaining(Math.max(1, Math.ceil(remaining / 1000)));
            } else {
                if (showWarning) {
                    setShowWarning(false);
                    setSecondsRemaining(null);
                }
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [currentUser, totalTimeoutMs, warningMs, showWarning, handleLogout]);

    if (!currentUser || !showWarning || secondsRemaining === null) {
        return null;
    }

    return (
        <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="timeout-title"
        >
            <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 rounded-2xl shadow-2xl max-w-md w-full p-6 text-center transform transition-all duration-200 scale-100">
                {/* Visual Icon */}
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 mb-4 ring-8 ring-amber-50 dark:ring-amber-950/30">
                    <ShieldAlert className="h-7 w-7 animate-pulse" />
                </div>

                <h3 id="timeout-title" className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    Session Inactivity Warning
                </h3>

                <p className="text-sm text-slate-600 dark:text-slate-300 mb-5 leading-relaxed">
                    To safeguard institutional and financial data, your active session is about to expire due to inactivity.
                </p>

                {/* Countdown Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 font-mono font-bold text-lg mb-6">
                    <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
                    <span>Auto-logout in: {secondsRemaining}s</span>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        type="button"
                        onClick={handleStayLoggedIn}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white text-sm font-semibold rounded-xl shadow-md shadow-primary-600/20 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Stay Logged In
                    </button>
                    
                    <button
                        type="button"
                        onClick={handleManualLogout}
                        className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-slate-400"
                    >
                        <LogOut className="w-4 h-4" />
                        Log Out
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SessionTimeoutManager;
