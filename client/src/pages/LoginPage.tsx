import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Lock, User, ArrowRight, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../services/api';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { username, password });
      login(response.data.access_token);
    } catch (error) {
      console.error('Login failed', error);
      toast.error('Verification failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-6 font-sans selection:bg-brand-gold selection:text-surface transition-colors duration-500">
      {/* Decorative Matrix Background */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,var(--color-on-canvas)_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-12">
          <Link to="/" className="inline-flex flex-col items-center group">
            <div className="w-16 h-16 bg-accent-color rounded-sm shadow-2xl flex items-center justify-center mb-6 transition-transform group-hover:rotate-6">
              <Activity className="w-8 h-8 text-surface" />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold tracking-[0.3em] uppercase italic leading-none text-on-canvas">Saaslink</span>
              <div className="h-[2px] w-12 bg-brand-gold mt-1.5 shadow-sm" />
            </div>
          </Link>
          <h1 className="text-3xl font-serif italic font-medium text-on-canvas mt-10 tracking-tight">System_Verification</h1>
          <p className="text-gray-400 mt-3 text-xs uppercase tracking-[0.3em] font-bold opacity-60">Authorize portal session</p>
        </div>

        <div className="bg-surface border border-border-muted p-10 md:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] rounded-sm">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-mono font-bold uppercase tracking-[0.4em] text-gray-400 ml-1">Identity_Node</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-brand-gold transition-colors">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-canvas border border-border-muted rounded-0 text-on-canvas focus:outline-none focus:border-on-canvas transition-all placeholder:text-gray-600 font-mono text-sm"
                  placeholder="USERNAME_INDEX"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-mono font-bold uppercase tracking-[0.4em] text-gray-400 ml-1">Access_Cipher</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-brand-gold transition-colors">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-canvas border border-border-muted rounded-0 text-on-canvas focus:outline-none focus:border-on-canvas transition-all placeholder:text-gray-600 font-mono text-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="flex justify-end pt-1">
                <Link to="/forgot-password" hidden={false} className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-500 hover:text-brand-gold transition-colors">
                  lost_cipher?
                </Link>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-on-canvas text-surface py-5 font-black uppercase tracking-[0.4em] text-[11px] hover:opacity-90 transition-all flex items-center justify-center space-x-4 shadow-xl shadow-accent-color/10 active:scale-[0.98] disabled:opacity-50"
            >
              <span>{loading ? 'SYNCHRONIZING...' : 'AUTHORIZE_SESSION'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-12 text-center border-t border-border-muted pt-8">
            <p className="text-xs text-gray-500 font-mono uppercase tracking-widest leading-loose">
              No authorization node? <br />
              <Link to="/register" className="text-on-canvas font-black hover:text-brand-gold transition-colors underline underline-offset-4 decoration-brand-gold/30">Connect Your Institution</Link>
            </p>
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <Link to="/" className="text-[10px] font-mono font-bold uppercase tracking-[0.6em] text-gray-500 hover:text-on-canvas transition-colors">
            ROOT_ORIGIN
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
