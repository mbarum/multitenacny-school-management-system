import React, { useEffect, useState } from 'react';
import { Stripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { CreditCard, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import CheckoutForm from '../components/CheckoutForm';
import { getStripe } from '../services/stripe';

const PaymentsPage: React.FC = () => {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  useEffect(() => {
    setStripePromise(getStripe());
  }, []);

  if (!stripePromise) {
    return (
      <div className="h-screen flex items-center justify-center bg-canvas">
        <Zap className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas pb-24 font-sans italic selection:bg-primary/10 selection:text-primary">
      <header className="bg-surface border-b border-border-muted overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto px-8 py-20 relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center space-x-2 text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span>Financial Gateway</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-on-surface tracking-tighter leading-[0.9] mb-4 uppercase italic">
              Secure <span className="text-slate-300 dark:text-slate-700 block md:inline font-normal">Fee Settlement</span>
            </h1>
            <p className="text-slate-500 text-sm font-bold tracking-tight max-w-xl italic">
              Encrypted transaction portal for school fee processing and digital ledger updates.
            </p>
          </motion.div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-8 -mt-12 relative z-20 pb-20">
        <div className="grid grid-cols-1 gap-12">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-surface p-12 rounded-[3.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] border border-border-muted group hover:shadow-[0_40px_120px_-20px_rgba(0,0,0,0.15)] transition-all duration-700"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 pb-10 border-b border-border-muted gap-8">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-slate-900 dark:bg-primary rounded-3xl flex items-center justify-center text-white shadow-2xl rotate-3 group-hover:rotate-0 transition-transform duration-500">
                  <ShieldCheck size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-on-surface uppercase tracking-tighter italic mb-1">PCI-DSS Checkout</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-full">Secure SSL</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">V4-AUTH READY</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 border border-border-muted px-6 py-3 rounded-2xl">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">External API Link: Established</span>
              </div>
            </div>
            
            <div className="max-w-md mx-auto py-8">
              <Elements stripe={stripePromise}>
                <CheckoutForm />
              </Elements>
            </div>

            <div className="mt-20 pt-10 border-t border-border-muted flex flex-wrap items-center justify-center gap-12 grayscale contrast-200 opacity-20">
               {['Visa', 'Mastercard', 'M-Pesa', 'Stripe', 'Amex'].map(provider => (
                 <span key={provider} className="text-[11px] font-black uppercase tracking-[0.5em]">{provider}</span>
               ))}
            </div>
          </motion.div>
        </div>
      </main>

      {/* Ticker Footer */}
      <footer className="fixed bottom-0 w-full bg-surface/80 backdrop-blur-xl border-t border-border-muted px-8 py-4 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[8px] font-black uppercase tracking-[0.4em] text-slate-400">
          <div className="flex items-center space-x-12">
            <div className="flex items-center">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-3 animate-pulse" />
              <span className="italic">Gateway Active</span>
            </div>
          </div>
          <div className="italic text-primary/40 hidden md:block">
            SaaSLink Finance Protocol // Transaction_ID: {Math.random().toString(36).substring(7).toUpperCase()}
          </div>
          <div className="flex items-center space-x-2 italic">
            <Zap size={10} className="mr-1 text-primary" />
            <span>Encrypted Tunnel</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PaymentsPage;
