import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Lock, User, ArrowRight, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/login', { username, password });
      login(response.data.access_token);
    } catch (error) {
      console.error('Login failed', error);
      alert('Invalid credentials. Please try again.');
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
            <Zap className="w-8 h-8 text-brand-dark fill-current" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-white">Welcome Back</h1>
          <p className="text-brand-white/40 mt-2 text-sm uppercase tracking-widest font-bold">Access your institution portal</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-[32px] shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-brand-white/60 ml-1">Username</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-sand" />
                <input
                  type="text"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-brand-white focus:outline-none focus:border-brand-sand transition-colors"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-brand-white/60 ml-1">Password</label>
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
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-sm text-brand-white/40">
              Don't have an account?{' '}
              <Link to="/register" className="text-brand-sand font-bold hover:underline">Create one</Link>
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

export default LoginPage;
