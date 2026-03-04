import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, User, ArrowRight, Zap, ShieldCheck } from 'lucide-react';
import api from '../services/api';

const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', { username, password_hash: password, role: 'admin' });
      navigate('/login');
    } catch (error) {
      console.error('Registration failed', error);
      alert('Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-brand-green flex items-center justify-center p-6 font-sans selection:bg-brand-sand selection:text-brand-dark">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-sand rounded-2xl shadow-xl mb-6">
            <ShieldCheck className="w-8 h-8 text-brand-dark fill-current" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-white">Get Started</h1>
          <p className="text-brand-white/40 mt-2 text-sm uppercase tracking-widest font-bold">Deploy your institutional OS</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-[32px] shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-brand-white/60 ml-1">Admin Username</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-sand" />
                <input
                  type="text"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-brand-white focus:outline-none focus:border-brand-sand transition-colors"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-brand-white/60 ml-1">Secure Password</label>
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

            <button 
              type="submit" 
              className="w-full bg-brand-sand text-brand-dark py-4 rounded-2xl font-bold uppercase tracking-widest text-[11px] hover:brightness-110 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-brand-sand/20 active:scale-[0.98]"
            >
              <span>Create Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-sm text-brand-white/40">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-sand font-bold hover:underline">Sign In</Link>
            </p>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <Link to="/" className="text-[10px] font-bold uppercase tracking-widest text-brand-white/20 hover:text-brand-white/60 transition-colors">
            Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
