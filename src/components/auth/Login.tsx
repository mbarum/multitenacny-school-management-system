import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import Modal from '../common/Modal';
import { sendPasswordResetEmail } from '../../services/emailService';
import * as api from '../../services/api';
import { validateEmail } from '../../utils/validation';

const Login: React.FC = () => {
    const { schoolInfo, handleLogin: onLogin, addNotification } = useData();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [formErrors, setFormErrors] = useState<{ email?: string | null }>({});
    const [isLoading, setIsLoading] = useState(false);
    
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [isSubmittingReset, setIsSubmittingReset] = useState(false);

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

        if (!schoolInfo) {
            setError("Application data is not loaded yet. Please wait a moment and try again.");
            setIsLoading(false);
            return;
        }

        try {
            const { user, token } = await api.login({ email, password });
            if (user.status === 'Disabled') {
                setError('Your account has been disabled. Please contact the administrator.');
                setIsLoading(false);
                return;
            }
            onLogin(user, token);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
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

    return (
        <>
            <div className="min-h-screen w-full bg-slate-50 lg:grid lg:grid-cols-2">
                <div className="flex flex-col justify-center items-center p-8 lg:p-12 relative">
                    <div className="w-full max-w-sm">
                        <div className="mb-10 text-center">
                             <div className="flex items-center justify-center">
                                 {schoolInfo?.logoUrl && (
                                    <img src={schoolInfo.logoUrl} alt="School Logo" className="h-14 w-14 rounded-full object-cover" />
                                 )}
                                <span className="ml-4 text-4xl font-bold text-primary-700 tracking-tight">{schoolInfo?.name}</span>
                             </div>
                             <h1 className="mt-8 text-3xl font-extrabold text-slate-900">Welcome Back</h1>
                             <p className="mt-2 text-slate-600">Please sign in to continue.</p>
                        </div>
                        
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
                                    className={`peer block w-full px-10 py-3 border rounded-lg shadow-sm placeholder-transparent focus:outline-none focus:ring-2  focus:border-primary-500 transition ${formErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-primary-500'}`} 
                                    placeholder="you@example.com"
                                />
                                 <label htmlFor="email" className="absolute left-10 -top-2.5 text-sm text-slate-500 bg-slate-50 px-1 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-primary-600">Email Address</label>
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
                                    className="peer block w-full px-10 py-3 border border-slate-300 rounded-lg shadow-sm placeholder-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                                    placeholder="••••••••"
                                />
                                <label htmlFor="password" className="absolute left-10 -top-2.5 text-sm text-slate-500 bg-slate-50 px-1 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-primary-600">Password</label>
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    {showPassword ? 
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        : 
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a10.05 10.05 0 015.393-6.218l-2.717-2.717m5.058 5.058a3 3 0 014.242 0M9.879 9.879a3 3 0 01-4.242 0M9.879 9.879L6.12 6.12m9.759 9.759l3.75-3.75M3 3l3.75 3.75M9.879 9.879L14.12 14.12" /></svg>
                                    }
                                </button>
                            </div>
                            
                            {error && <p className="text-red-600 text-sm text-center">{error}</p>}

                            <div className="flex justify-between items-center text-sm">
                                <label className="flex items-center space-x-2">
                                    <input type="checkbox" className="rounded text-primary-600 focus:ring-primary-500"/>
                                    <span className="text-slate-600">Remember me</span>
                                </label>
                                <a href="#" onClick={(e) => {e.preventDefault(); setIsResetModalOpen(true)}} className="font-medium text-primary-600 hover:text-primary-500">Forgot Password?</a>
                            </div>

                            <div>
                                <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:bg-slate-400 h-[52px]">
                                    {isLoading ? 
                                        <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        : 'Login'}
                                </button>
                            </div>
                        </form>
                    </div>
                     <p className="absolute bottom-8 text-center text-sm text-slate-500">
                        &copy; {new Date().getFullYear()} Saaslink Technologies Ltd. All rights reserved.
                    </p>
                </div>
                 <div className="hidden lg:block relative">
                    <img 
                        className="absolute inset-0 h-full w-full object-cover"
                        src="https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=2070&auto=format&fit=crop"
                        alt="A bright classroom with students"
                    />
                    <div className="absolute inset-0 bg-slate-900 bg-opacity-60 flex items-center justify-center p-12">
                         <div className="text-white max-w-md">
                            <h2 className="text-4xl font-bold">Empowering Education,</h2>
                            <h2 className="text-4xl font-bold text-primary-300 mt-2">Connecting Communities.</h2>
                            <p className="mt-4 text-slate-300">Our platform provides a seamless, integrated experience for administrators, teachers, parents, and students.</p>
                        </div>
                    </div>
                </div>
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
                            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md"
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