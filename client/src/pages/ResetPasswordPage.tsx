import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ArrowRight, Activity, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!token) {
      setError('Invalid or missing reset token');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password', { token, password });
      setIsSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      console.error('Password reset failed', err);
      setError(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white border border-slate-100 p-10 rounded-3xl shadow-2xl text-center"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-50 text-red-600 rounded-2xl mb-8">
            <AlertCircle className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">Invalid Link</h1>
          <p className="text-slate-500 font-medium italic mb-10 leading-relaxed">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <Link 
            to="/forgot-password" 
            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold uppercase tracking-[0.2em] text-[11px] hover:bg-slate-800 transition-all block text-center shadow-xl"
          >
            Request New Link
          </Link>
        </motion.div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white border border-slate-100 p-10 rounded-3xl shadow-2xl text-center"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-50 text-emerald-600 rounded-2xl shadow-sm mb-8">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">Success!</h1>
          <p className="text-slate-500 font-medium italic mb-10 leading-relaxed">
            Your password has been reset successfully. Redirecting you to login...
          </p>
          <Link 
            to="/login" 
            className="text-primary font-bold hover:underline uppercase tracking-widest text-xs"
          >
            Click here to login manually
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex flex-col items-center group mb-6">
            <div className="w-16 h-16 bg-primary rounded-xl shadow-lg flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-slate-900 group-hover:text-primary transition-colors">EduStream</span>
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Create New Password</h1>
          <p className="text-slate-500 mt-2 text-sm font-medium italic">Define a secure credential for your staff portal</p>
        </div>

        <div className="bg-white border border-slate-100 p-10 rounded-3xl shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-widest ml-1">New Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                <input
                  type="password"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:border-primary transition-all placeholder:text-slate-400 text-sm font-medium"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-widest ml-1">Confirm Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                <input
                  type="password"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:border-primary transition-all placeholder:text-slate-400 text-sm font-medium"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.p 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="text-red-500 text-xs font-bold italic ml-1"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold uppercase tracking-[0.2em] text-[11px] hover:bg-slate-800 transition-all flex items-center justify-center space-x-3 shadow-xl active:scale-[0.98] disabled:opacity-50"
            >
              <span>{isLoading ? 'Updating...' : 'Set New Password'}</span>
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-10 text-center border-t border-slate-50 pt-8">
            <Link to="/login" className="text-xs text-primary font-bold hover:underline flex items-center justify-center space-x-2 italic uppercase tracking-widest">
              <ArrowLeft className="w-4 h-4" />
              <span>Cancel & Login</span>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
