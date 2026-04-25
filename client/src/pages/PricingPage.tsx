import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  CreditCard, 
  Smartphone, 
  Banknote, 
  Zap, 
  Shield, 
  Star, 
  Globe, 
  ArrowRight, 
  AlertTriangle, 
  LogOut,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getStripe } from '../services/stripe';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const plans = [
  {
    name: 'Basic',
    icon: <Zap className="w-6 h-6" />,
    monthlyPrice: 1000,
    annualPrice: 10000,
    interval: 'KES',
    monthlyPriceId: 'price_basic_monthly',
    annualPriceId: 'price_basic_annual',
    features: ['Student Records', 'Fee Management', 'Basic Reporting', 'Attendance Tracking'],
  },
  {
    name: 'Standard',
    icon: <Shield className="w-6 h-6" />,
    monthlyPrice: 2000,
    annualPrice: 20000,
    interval: 'KES',
    monthlyPriceId: 'price_standard_monthly',
    annualPriceId: 'price_standard_annual',
    features: ['All Basic Features', 'LMS Integration', 'Parent Portal', 'SMS Notifications'],
  },
  {
    name: 'Premium',
    icon: <Star className="w-6 h-6" />,
    monthlyPrice: 3500,
    annualPrice: 35000,
    interval: 'KES',
    monthlyPriceId: 'price_premium_monthly',
    annualPriceId: 'price_premium_annual',
    features: ['All Standard Features', 'Advanced Analytics', 'Custom Timetabling', 'Priority Support'],
    popular: true
  },
  {
    name: 'Enterprise',
    icon: <Globe className="w-6 h-6" />,
    monthlyPrice: 'Custom',
    annualPrice: 'Custom',
    interval: 'Contact Sales',
    features: ['Unlimited Students', 'Multi-Campus Management', 'Dedicated Account Manager', 'Custom Integrations'],
    isEnterprise: true
  },
];

const PricingPage: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const isLocked = new URLSearchParams(location.search).get('locked') === 'true';

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('token'));
  }, []);

  const handleStripeSubscribe = async (priceId: string) => {
    try {
      const { sessionId } = await api.post('/subscriptions/create-checkout-session', { priceId });
      const stripe = await getStripe();
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId });
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    }
  };

  const handleMpesaSubscribe = async (amount: number, planName: string) => {
    const phone = prompt('Please enter your M-Pesa phone number (e.g., 2547...):');
    if (phone) {
      try {
        await api.post('/mpesa/stk-push', { 
          phone, 
          amount, 
          plan: planName.toLowerCase(),
          billingCycle
        });
        alert('STK Push sent to your phone. Please complete the transaction.');
        setSelectedPlan(null);
      } catch (error) {
        console.error('Error initiating M-Pesa payment:', error);
        alert('Failed to initiate M-Pesa payment.');
      }
    }
  };

  const handleBankTransferSubscribe = async (amount: number, planName: string) => {
    try {
      const response = await api.post('/subscriptions/bank-transfer', { 
        amount: Number(amount), 
        plan: planName.toLowerCase(),
        billingCycle
      });
      
      const { invoiceData, reference } = response;
      
      const byteCharacters = atob(invoiceData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice-${reference}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert(`Bank transfer request created successfully (Reference: ${reference}). An invoice has been downloaded. Please complete the bank transfer and contact support for activation.`);
      setSelectedPlan(null);
      
      navigate('/dashboard?status=pending');
    } catch (error) {
      console.error('Error creating bank transfer request:', error);
      alert('Failed to create bank transfer request. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-on-canvas font-sans selection:bg-brand-gold selection:text-surface transition-colors duration-500">
      {/* Navigation - Minimal */}
      <nav className="fixed top-0 w-full z-50 bg-canvas/80 backdrop-blur-xl border-b border-border-muted h-20 flex items-center">
        <div className="max-w-7xl mx-auto w-full px-6 md:px-12 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-8 h-8 rounded-sm flex items-center justify-center bg-accent-color transition-transform group-hover:rotate-12">
              <Activity className="text-surface" size={16} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-widest uppercase italic leading-none">Saaslink</span>
              <div className="h-[2px] w-full bg-brand-gold mt-1 shadow-sm" />
            </div>
          </Link>

          <div className="flex items-center space-x-6">
            <Link to="/login" className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-on-canvas transition-colors">Access_Portal</Link>
            <Link to="/register" className="bg-on-canvas text-surface px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] rounded-sm hover:opacity-90 transition-all">Begin_Setup</Link>
          </div>
        </div>
      </nav>

      <div className="pt-40 pb-24 max-w-7xl mx-auto px-6 lg:px-8">
        {isLocked && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-16 bg-red-500/5 border border-red-500/20 p-8 flex flex-col md:flex-row items-center gap-8 justify-between"
          >
            <div className="flex items-center space-x-6">
              <AlertTriangle className="w-8 h-8 text-red-500 flex-shrink-0" />
              <div>
                <h3 className="text-red-500 font-serif italic text-xl mb-1 tracking-tight">System_Lock_Active</h3>
                <p className="text-gray-500 text-xs font-mono uppercase tracking-widest">Authorize subscription to restore node access.</p>
              </div>
            </div>
            {isLoggedIn && (
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="flex items-center space-x-3 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-sm transition-all text-[10px] font-mono font-bold uppercase tracking-widest"
              >
                <LogOut className="w-4 h-4" />
                <span>TERMINATE_SESSION</span>
              </button>
            )}
          </motion.div>
        )}

        <div className="text-center max-w-3xl mx-auto mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-center space-x-4 mb-8">
               <span className="h-px w-12 bg-brand-gold" />
               <span className="text-brand-gold text-[10px] font-mono font-bold uppercase tracking-[0.4em]">Protocol Selection</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-serif italic text-on-canvas tracking-tighter mb-10 leading-[0.85]">
              Modular <br />
              <span className="opacity-20">Investment Scale.</span>
            </h1>
            <p className="text-lg text-gray-500 font-sans italic leading-relaxed font-medium">
              Choose the architectural tier that matches your institutional density. 
              Optimize your budget with annual synchronization.
            </p>
          </motion.div>

          <div className="mt-16 flex items-center justify-center space-x-6">
            <span className={`text-[10px] font-mono font-bold uppercase tracking-widest transition-opacity ${billingCycle === 'monthly' ? 'text-on-canvas' : 'text-gray-400 opacity-40'}`}>MONTHLY_STREAM</span>
            <button 
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
              className="w-16 h-8 bg-surface border border-border-muted rounded-full relative p-1 transition-all hover:border-gray-400"
            >
              <motion.div 
                animate={{ x: billingCycle === 'monthly' ? 0 : 32 }}
                className="w-6 h-6 bg-accent-color rounded-full shadow-lg"
              />
            </button>
            <span className={`text-[10px] font-mono font-bold uppercase tracking-widest transition-opacity ${billingCycle === 'annual' ? 'text-on-canvas' : 'text-gray-400 opacity-40'}`}>
              ANNUAL_RESERVE <span className="text-brand-gold ml-2">(SAV_20%)</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -8 }}
              className={`relative rounded-sm p-10 bg-surface border transition-all flex flex-col min-h-[500px] ${plan.popular ? 'border-accent-color shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)]' : 'border-border-muted'}`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-10 -translate-y-1/2 bg-accent-color text-surface px-6 py-1.5 text-[10px] font-mono font-black uppercase tracking-[0.3em]">
                  Apex_Choice
                </div>
              )}
              
              <div className="w-12 h-12 bg-canvas border border-border-muted flex items-center justify-center mb-10 group transition-all group-hover:rotate-12">
                <div className="text-brand-gold">{plan.icon}</div>
              </div>

              <h2 className="text-2xl font-serif italic text-on-canvas mb-4">{plan.name}_Node</h2>
              <div className="flex items-baseline space-x-3 mb-12">
                <span className="text-4xl font-serif italic tracking-tighter text-on-canvas">
                  {plan.isEnterprise ? 'Custom' : (billingCycle === 'monthly' ? plan.monthlyPrice.toLocaleString() : plan.annualPrice.toLocaleString())}
                </span>
                <span className="text-gray-400 text-[10px] font-mono font-bold uppercase tracking-widest">
                  {plan.interval} {!plan.isEnterprise && `/${billingCycle}`}
                </span>
              </div>

              <button
                onClick={() => {
                  if (plan.isEnterprise) {
                    window.location.href = 'mailto:sales@saaslink.tech?subject=Enterprise Plan Inquiry';
                  } else if (!isLoggedIn) {
                    navigate(`/register?plan=${plan.name.toLowerCase()}`);
                  } else {
                    setSelectedPlan(plan);
                  }
                }}
                className={`w-full py-5 text-[11px] font-black uppercase tracking-[0.3em] transition-all active:scale-95 mb-10 ${plan.popular ? 'bg-on-canvas text-surface shadow-xl' : 'bg-canvas border border-border-muted text-on-canvas hover:bg-surface'}`}
              >
                {plan.isEnterprise ? 'CONTACT_UNIT' : (isLoggedIn ? `CONFIGURE_${plan.name}` : `GENERATE_NODE`)}
              </button>

              <ul className="space-y-6 pt-10 border-t border-border-muted">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start text-xs font-medium text-gray-500 italic">
                    <CheckCircle className="h-4 w-4 text-brand-gold mr-4 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {selectedPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-canvas/90 backdrop-blur-md flex items-center justify-center z-[100] p-6"
            onClick={() => setSelectedPlan(null)}
          >
            <motion.div
              initial={{ y: 50, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 50, scale: 0.95 }}
              className="bg-surface border border-border-muted rounded-sm p-12 w-full max-w-lg shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center space-x-6 mb-12">
                <div className="w-14 h-14 bg-accent-color flex items-center justify-center shadow-xl">
                  <Activity className="w-8 h-8 text-surface" />
                </div>
                <div>
                  <h2 className="text-2xl font-serif italic text-on-canvas tracking-tight">Authorization_Portal</h2>
                  <p className="text-xs font-mono font-bold uppercase tracking-widest text-gray-400">Node_Tier: {selectedPlan.name} ({billingCycle})</p>
                </div>
              </div>

              <div className="space-y-6">
                {[
                  { id: 'stripe', name: 'Credit/Debit Card', icon: <CreditCard className="text-brand-gold" /> },
                  { id: 'mpesa', name: 'M-Pesa Ledger Sync', icon: <Smartphone className="text-brand-gold" /> },
                  { id: 'bank', name: 'Direct Bank Transfer', icon: <Banknote className="text-brand-gold" /> }
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => {
                       if (method.id === 'stripe') handleStripeSubscribe(billingCycle === 'monthly' ? selectedPlan.monthlyPriceId : selectedPlan.annualPriceId);
                       if (method.id === 'mpesa') handleMpesaSubscribe(billingCycle === 'monthly' ? selectedPlan.monthlyPrice : selectedPlan.annualPrice, selectedPlan.name);
                       if (method.id === 'bank') handleBankTransferSubscribe(billingCycle === 'monthly' ? selectedPlan.monthlyPrice : selectedPlan.annualPrice, selectedPlan.name);
                    }}
                    className="w-full flex items-center justify-between p-6 bg-canvas border border-border-muted hover:border-on-canvas transition-all group"
                  >
                    <div className="flex items-center">
                      <div className="mr-6 transform group-hover:scale-110 transition-transform">{method.icon}</div>
                      <span className="font-mono font-bold uppercase tracking-[0.2em] text-[10px] text-on-canvas">{method.name}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all text-brand-gold" />
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setSelectedPlan(null)}
                className="mt-12 w-full text-center text-[10px] font-mono font-bold uppercase tracking-[0.4em] text-gray-400 hover:text-on-canvas transition-colors"
              >
                ABORT_SEQUENCE
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer - Consistent with Landing */}
      <footer className="py-24 bg-surface border-t border-border-muted">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12 text-[10px] font-mono font-bold uppercase tracking-[0.4em] text-gray-400">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-8 h-8 rounded-sm bg-on-canvas flex items-center justify-center">
                <Activity className="text-surface" size={16} />
              </div>
              <span className="text-on-canvas font-bold tracking-widest italic group-hover:text-brand-gold transition-colors">Saaslink</span>
            </Link>
            <div className="flex space-x-12">
              <Link to="/privacy" className="hover:text-on-canvas transition-colors italic">Privacy</Link>
              <Link to="/terms" className="hover:text-on-canvas transition-colors italic">Terms</Link>
              <Link to="/contact" className="hover:text-on-canvas transition-colors italic">Contact</Link>
            </div>
            <div className="opacity-60">
              © 2026 SAASLINK_STUDIO
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PricingPage;
