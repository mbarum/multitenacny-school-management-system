import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Zap, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setIsSubmitted(true);
    } catch (err) {
      console.error('Forgot password request failed', err);
      setError('Something went wrong. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
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
          <h1 className="text-2xl font-bold text-brand-white mb-4">Check your email</h1>
          <p className="text-brand-white/60 mb-8">
            We've sent a password reset link to <span className="text-brand-sand font-bold">{email}</span>.
          </p>
          <Link 
            to="/login" 
            className="inline-flex items-center space-x-2 text-brand-sand font-bold hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Login</span>
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
          <h1 className="text-3xl font-bold tracking-tight text-brand-white">Reset Password</h1>
          <p className="text-brand-white/40 mt-2 text-sm uppercase tracking-widest font-bold">Enter your email to receive a link</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-[32px] shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-brand-white/60 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-sand" />
                <input
                  type="email"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-brand-white focus:outline-none focus:border-brand-sand transition-colors"
                  placeholder="name@institution.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="mt-10 text-center">
            <Link to="/login" className="text-sm text-brand-sand font-bold hover:underline flex items-center justify-center space-x-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
