import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, Zap, CheckCircle, AlertCircle } from 'lucide-react';
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
      <div className="min-h-screen bg-brand-green flex items-center justify-center p-6 font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-[32px] shadow-2xl text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-2xl mb-6">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-brand-white mb-4">Invalid Link</h1>
          <p className="text-brand-white/60 mb-8">
            This password reset link is invalid or has expired.
          </p>
          <Link 
            to="/forgot-password" 
            className="w-full bg-brand-sand text-brand-dark py-4 rounded-2xl font-bold uppercase tracking-widest text-[11px] hover:brightness-110 transition-all block text-center"
          >
            Request New Link
          </Link>
        </motion.div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-brand-green flex items-center justify-center p-6 font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-[32px] shadow-2xl text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-sand rounded-2xl shadow-xl mb-6">
            <CheckCircle className="w-8 h-8 text-brand-dark" />
          </div>
          <h1 className="text-2xl font-bold text-brand-white mb-4">Password Reset!</h1>
          <p className="text-brand-white/60 mb-8">
            Your password has been successfully updated. Redirecting you to login...
          </p>
          <Link 
            to="/login" 
            className="text-brand-sand font-bold hover:underline"
          >
            Click here if not redirected
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-green flex items-center justify-center p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-sand rounded-2xl shadow-xl mb-6">
            <Zap className="w-8 h-8 text-brand-dark fill-current" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-white">New Password</h1>
          <p className="text-brand-white/40 mt-2 text-sm uppercase tracking-widest font-bold">Create a secure password for your account</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-[32px] shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-brand-white/60 ml-1">New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-sand" />
                <input
                  type="password"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-brand-white focus:outline-none focus:border-brand-sand transition-colors"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-brand-white/60 ml-1">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-sand" />
                <input
                  type="password"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-brand-white focus:outline-none focus:border-brand-sand transition-colors"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-xs font-medium ml-1">{error}</p>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-brand-sand text-brand-dark py-4 rounded-2xl font-bold uppercase tracking-widest text-[11px] hover:brightness-110 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-brand-sand/20 active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? 'Updating...' : 'Reset Password'}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
