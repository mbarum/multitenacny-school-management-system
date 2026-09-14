
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import Modal from '../common/Modal';
import { sendPasswordResetEmail } from '../../services/emailService';
import * as api from '../../services/api';
import { validateEmail } from '../../utils/validation';
import { ShieldCheck, ShieldAlert, KeyRound, UserCheck, AlertTriangle, LogOut, ArrowRight, Database } from 'lucide-react';
import { Role } from '../../types';

const Login: React.FC = () => {
    const { currentUser, handleLogout, schoolInfo, handleLogin: onLogin, addNotification } = useData();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [formErrors, setFormErrors] = useState<{ email?: string | null }>({});
    const [isLoading, setIsLoading] = useState(false);
    const [sessionTimeoutNotice, setSessionTimeoutNotice] = useState<string | null>(null);
    
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [isSubmittingReset, setIsSubmittingReset] = useState(false);

    useEffect(() => {
        // If explicit switch or logout requested via URL, clear session
        if (searchParams.get('switch') === 'true' || searchParams.get('logout') === 'true') {
            handleLogout();
        }

        try {
            const storedNotice = sessionStorage.getItem('saaslink_session_expired');
            if (storedNotice) {
                setSessionTimeoutNotice(storedNotice);
                sessionStorage.removeItem('saaslink_session_expired');
            } else if (searchParams.get('sessionExpired') === 'true' || searchParams.get('reason') === 'timeout') {
                setSessionTimeoutNotice('Your session timed out after 15 minutes of inactivity. Please sign in again.');
            }
        } catch {
            // ignore
        }
    }, [searchParams, handleLogout]);

    const validateForm = () => {
        const emailError = validateEmail(email);
        setFormErrors({ email: emailError });
        return !emailError;
    };

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!validateForm()) return;

        setIsLoading(true);

        try {
            const { user, token } = await api.login({ email, password });
            
            if (user.status === 'Disabled') {
                setError('Your account has been disabled. Please contact the administrator.');
                setIsLoading(false);
                return;
            }
            onLogin(user, token);
            
            // Navigate directly to role-appropriate dashboard
            if (user.role === Role.SuperAdmin) {
                navigate('/super-admin', { replace: true });
            } else if (user.role === Role.Teacher) {
                navigate('/teacher', { replace: true });
            } else if (user.role === Role.Parent) {
                navigate('/parent', { replace: true });
            } else {
                navigate('/', { replace: true });
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Invalid credentials or database connection error.";
            setError(errorMessage);
            setIsLoading(false);
        }
    };

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmittingReset(true);
        try {
            await sendPasswordResetEmail(resetEmail);
            addNotification("If an account with this email exists, a reset link will be sent.", 'info');
        } catch (err) {
            addNotification("Failed to send password reset email. Please try again later.", 'error');
        } finally {
            setIsSubmittingReset(false);
            setIsResetModalOpen(false);
            setResetEmail('');
        }
    };

    const getDashboardPath = (userRole?: Role) => {
        switch (userRole) {
            case Role.SuperAdmin: return '/super-admin';
            case Role.Teacher: return '/teacher';
            case Role.Parent: return '/parent';
            default: return '/';
        }
    };

    return (
        <>
            <div className="min-h-screen w-full bg-slate-50 lg:grid lg:grid-cols-2 relative">
                {/* Top Quick Navigation Bar */}
                <div className="absolute top-0 inset-x-0 z-30 p-4 sm:p-6 flex justify-between items-center bg-white/95 backdrop-blur-md border-b border-slate-200 lg:bg-transparent lg:border-none">
                    <Link
                        to="/"
                        id="btn-back-to-website"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-800 hover:text-slate-950 bg-white hover:bg-slate-100 shadow-sm border border-slate-200 transition-all hover:scale-[1.02]"
                        title="Return to SaasLink Website"
                    >
                        <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span>&larr; Back to Website</span>
                    </Link>
                    <div className="text-xs font-semibold text-slate-500 hidden sm:block">
                        SaasLink School Operating System
                    </div>
                </div>

                <div className="flex flex-col justify-center items-center p-8 pt-20 lg:p-12 relative z-10 bg-white">
                    <div className="w-full max-w-sm">
                        {/* Switch button above card */}
                        <div className="mb-6 flex justify-between items-center">
                            <Link
                                to="/"
                                className="text-xs font-bold text-slate-500 hover:text-primary-600 flex items-center gap-1 transition-colors"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                                Home / Landing Page
                            </Link>
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-primary-50 text-primary-700 px-2 py-0.5 rounded border border-primary-200">
                                Sign In Screen
                            </span>
                        </div>

                        <div className="mb-8 text-center">
                             <div className="flex items-center justify-center">
                                 {schoolInfo?.logoUrl && (
                                    <img src={schoolInfo.logoUrl} alt="School Logo" className="h-16 w-16 rounded-full object-cover border border-slate-100 shadow-sm" />
                                 )}
                                <span className="ml-4 text-3xl font-bold text-primary-700 tracking-tight">{schoolInfo?.name || 'Saaslink'}</span>
                             </div>
                             <h1 className="mt-6 text-3xl font-extrabold text-slate-900">Welcome Back</h1>
                             <p className="mt-2 text-slate-600 text-sm">Please sign in to access the portal.</p>
                        </div>

                        {sessionTimeoutNotice && (
                            <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs sm:text-sm flex items-start gap-3 shadow-sm animate-fade-in">
                                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    <strong className="font-bold block text-amber-950">Session Expired</strong>
                                    <span className="text-amber-800">{sessionTimeoutNotice}</span>
                                </div>
                            </div>
                        )}
                        
                        {currentUser ? (
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm text-center mb-6 animate-fade-in">
                                <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-700 mx-auto flex items-center justify-center mb-3">
                                    <UserCheck className="w-6 h-6" />
                                </div>
                                <h3 className="text-base font-bold text-slate-900">Active Session Detected</h3>
                                <p className="text-xs text-slate-600 mt-1">
                                    You are currently authenticated as:
                                </p>
                                <div className="my-3 py-2 px-3 bg-white rounded-xl border border-slate-200 inline-block text-left max-w-full">
                                    <p className="text-xs font-bold text-slate-800 truncate">{currentUser.name}</p>
                                    <p className="text-[11px] text-slate-500 font-mono truncate">{currentUser.email}</p>
                                    <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-200">
                                        {currentUser.role}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-2 mt-4">
                                    <button
                                        type="button"
                                        onClick={() => navigate(getDashboardPath(currentUser.role))}
                                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold shadow-md shadow-primary-500/20 transition"
                                    >
                                        <span>Continue to Portal</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            await handleLogout();
                                            setEmail('');
                                            setPassword('');
                                        }}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold transition"
                                    >
                                        <LogOut className="w-3.5 h-3.5 text-slate-500" />
                                        <span>Sign Out to Switch Account</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleLoginSubmit} className="space-y-6">
                                <div className="relative group">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors">
                                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
                                    </span>
                                    <input 
                                        type="email" 
                                        id="email" 
                                        value={email} 
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            if (formErrors.email) validateForm();
                                        }} 
                                        onBlur={validateForm}
                                        required 
                                        className={`peer block w-full px-10 py-3.5 border rounded-xl shadow-sm placeholder-transparent focus:outline-none focus:ring-2 focus:ring-offset-1 focus:border-primary-500 transition ${formErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-primary-500'}`} 
                                        placeholder="you@example.com"
                                    />
                                     <label htmlFor="email" className="absolute left-10 -top-2.5 text-sm text-slate-500 bg-white px-1 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-primary-600">Email Address</label>
                                    {formErrors.email && <p className="mt-1 text-xs text-red-600">{formErrors.email}</p>}
                                </div>

                                 <div className="relative group">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                    </span>
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        id="password" 
                                        value={password} 
                                        onChange={(e) => setPassword(e.target.value)} 
                                        required 
                                        className="peer block w-full px-10 py-3.5 border border-slate-300 rounded-xl shadow-sm placeholder-transparent focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-500 focus:border-primary-500 transition"
                                        placeholder="••••••••"
                                    />
                                    <label htmlFor="password" className="absolute left-10 -top-2.5 text-sm text-slate-500 bg-white px-1 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-primary-600">Password</label>
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1">
                                        {showPassword ? 
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                            : 
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a10.05 10.05 0 015.393-6.218l-2.717-2.717m5.058 5.058a3 3 0 014.242 0M9.879 9.879a3 3 0 01-4.242 0M9.879 9.879L6.12 6.12m9.759 9.759l3.75-3.75M3 3l3.75 3.75M9.879 9.879L14.12 14.12" /></svg>
                                        }
                                    </button>
                                </div>
                                
                                {error && (
                                    <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs sm:text-sm flex items-start gap-2.5 animate-fade-in">
                                        <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                                        <span className="font-medium">{error}</span>
                                    </div>
                                )}

                                <div className="flex justify-between items-center text-sm">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input type="checkbox" className="rounded text-primary-600 focus:ring-primary-500 w-4 h-4 border-slate-300"/>
                                        <span className="text-slate-600">Remember me</span>
                                    </label>
                                    <a href="#" onClick={(e) => {e.preventDefault(); setIsResetModalOpen(true)}} className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">Forgot Password?</a>
                                </div>

                                <div>
                                    <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-primary-500/30 text-lg font-bold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all transform hover:-translate-y-0.5 disabled:bg-slate-400 disabled:shadow-none h-[54px]">
                                        {isLoading ? 
                                            <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            : 'Sign In'}
                                    </button>
                                </div>

                                {/* Security Verification Notice */}
                                <div className="mt-6 pt-5 border-t border-slate-200">
                                    <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                                        <Database className="w-4 h-4 text-emerald-600 shrink-0" />
                                        <span>
                                            <strong className="text-slate-800 font-semibold">MySQL Secure Authentication:</strong> Passwords are encrypted with bcrypt. Mock access and fallback accounts are disabled.
                                        </span>
                                    </div>
                                </div>
                            </form>
                        )}

                        {/* Dedicated Return to Website Button */}
                        <div className="mt-8 pt-6 border-t border-slate-200/80 text-center">
                            <span className="text-xs text-slate-500 block mb-3">
                                Need to review curriculum coverage, pricing, or subscription plans?
                            </span>
                            <Link
                                to="/"
                                id="btn-login-to-landing-bottom"
                                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-800 transition-all hover:scale-[1.01] shadow-sm"
                            >
                                <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                <span>&larr; Back to Website</span>
                            </Link>
                        </div>
                    </div>
                     <p className="absolute bottom-8 text-center text-sm text-slate-400">
                        &copy; {new Date().getFullYear()} SaasLink Technologies Ltd. All rights reserved.
                    </p>
                </div>
                 <div className="hidden lg:block relative overflow-hidden">
                    <img 
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-[20s] hover:scale-105"
                        src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop"
                        alt="Integrated cloud-based school services"
                        aria-label="Integrated cloud-based school services"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary-900/90 via-primary-900/40 to-slate-900/20 flex flex-col justify-end p-16">
                         <div className="text-white max-w-lg animate-fade-in-up">
                             <div className="mb-4 inline-flex items-center px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-xs font-medium text-white">
                                🚀 The #1 School Management System
                             </div>
                            <h2 className="text-4xl font-bold leading-tight">Empowering African Education through Technology.</h2>
                            <p className="mt-6 text-lg text-slate-100 font-light leading-relaxed">
                                Streamline administration, automate fee collection, and generate AI-powered insights. Join thousands of schools transforming their operations with Saaslink.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Persistent Floating Back to Website Button */}
            <div className="fixed bottom-6 right-6 z-40">
                <Link
                    to="/"
                    id="floating-switch-to-landing"
                    className="inline-flex items-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-full shadow-2xl border border-slate-700 text-xs sm:text-sm font-bold transition-all hover:scale-105 group"
                    title="Return to SaasLink Website"
                >
                    <span className="w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center font-black text-xs group-hover:-translate-x-0.5 transition-transform">
                        &larr;
                    </span>
                    <span>Back to Website</span>
                </Link>
            </div>

            <Modal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} title="Reset Password">
                <form onSubmit={handlePasswordReset} className="space-y-4">
                    <p className="text-sm text-slate-600">Enter your email address and we will send you a link to reset your password.</p>
                    <div>
                        <label htmlFor="reset-email" className="block text-sm font-medium text-slate-700">Email Address</label>
                        <input
                            type="email"
                            id="reset-email"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                            placeholder="you@example.com"
                        />
                    </div>
                    <div className="flex justify-end pt-2">
                        <button type="submit" disabled={isSubmittingReset} className="px-6 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700 disabled:bg-slate-400">
                            {isSubmittingReset ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
};

export default Login;
