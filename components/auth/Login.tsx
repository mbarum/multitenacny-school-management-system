import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import Modal from '../common/Modal';
import { sendPasswordResetEmail } from '../../services/emailService';
import * as api from '../../services/api';

const Login: React.FC = () => {
    const { schoolInfo, handleLogin: onLogin, addNotification } = useData();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [isSubmittingReset, setIsSubmittingReset] = useState(false);

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
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
                return;
            }
            onLogin(user, token);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            setError(errorMessage);
        } finally {
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
            <div className="min-h-screen w-full lg:grid lg:grid-cols-2">
                <div className="flex items-center justify-center p-8 lg:p-12">
                    <div className="w-full max-w-md">
                        <div className="mb-8 text-center lg:text-left">
                             <div className="flex items-center justify-center lg:justify-start">
                                 {schoolInfo?.logoUrl && (
                                    <img src={schoolInfo.logoUrl} alt="School Logo" className="h-12 w-12 rounded-full object-cover" />
                                 )}
                                <span className="ml-3 text-3xl font-bold text-primary-700">{schoolInfo?.name}</span>
                             </div>
                             <h1 className="mt-6 text-3xl font-extrabold text-slate-900">Welcome Back</h1>
                             <p className="mt-2 text-slate-600">Empowering Education, Connecting Communities.</p>
                        </div>

                        {error && <p className="bg-red-100 text-red-700 text-sm p-3 rounded-md mb-4 text-center">{error}</p>}
                        
                        <form onSubmit={handleLoginSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email Address</label>
                                <input 
                                    type="email" 
                                    id="email" 
                                    value={email} 
                                    onChange={(e) => setEmail(e.target.value)} 
                                    required 
                                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition" 
                                    placeholder="you@example.com"
                                />
                            </div>
                            <div>
                                <div className="flex justify-between items-center">
                                    <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
                                     <a href="#" onClick={(e) => {e.preventDefault(); setIsResetModalOpen(true)}} className="text-sm font-medium text-primary-600 hover:text-primary-500">Forgot Password?</a>
                                </div>
                                <input 
                                    type="password" 
                                    id="password" 
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)} 
                                    required 
                                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div>
                                <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:bg-slate-400">
                                    {isLoading ? 'Logging in...' : 'Login'}
                                </button>
                            </div>
                        </form>
                         <p className="mt-8 text-center text-sm text-slate-500">
                            &copy; {new Date().getFullYear()} Saaslink Technologies Ltd. All rights reserved.
                        </p>
                    </div>
                </div>
                 <div className="hidden lg:block relative">
                    <img 
                        className="absolute inset-0 h-full w-full object-cover"
                        src="https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=2070&auto=format&fit=crop"
                        alt="A bright classroom with students"
                    />
                    <div className="absolute inset-0 bg-slate-900 bg-opacity-60"></div>
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
