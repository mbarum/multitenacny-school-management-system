import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  CreditCard, 
  Smartphone, 
  Banknote, 
  Zap, 
  ArrowRight, 
  AlertTriangle, 
  LogOut,
  GraduationCap,
  ChevronRight,
  Star,
  Users,
  ShieldCheck,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getStripe } from '../services/stripe';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const plans = [
  {
    name: 'Basic',
    icon: <Users className="w-6 h-6" />,
    monthlyPrice: 1000,
    annualPrice: 10000,
    interval: 'KES',
    monthlyPriceId: 'price_basic_monthly',
    annualPriceId: 'price_basic_annual',
    features: ['Up to 100 Students', 'Core Admissions', 'Basic Fee Collection', 'Attendance Tracking'],
    desc: 'For small learning centers.'
  },
  {
    name: 'Standard',
    icon: <GraduationCap className="w-6 h-6" />,
    monthlyPrice: 2000,
    annualPrice: 20000,
    interval: 'KES',
    monthlyPriceId: 'price_standard_monthly',
    annualPriceId: 'price_standard_annual',
    features: ['Up to 500 Students', 'Full LMS Integration', 'Parent Portal', 'SMS Notifications'],
    desc: 'Perfect for established schools.',
    popular: true
  },
  {
    name: 'Premium',
    icon: <ShieldCheck className="w-6 h-6" />,
    monthlyPrice: 3500,
    annualPrice: 35000,
    interval: 'KES',
    monthlyPriceId: 'price_premium_monthly',
    annualPriceId: 'price_premium_annual',
    features: ['Unlimited Students', 'Advanced Analytics', 'Budgeting & P&L', 'Priority Support'],
    desc: 'Comprehensive campus management.'
  },
  {
    name: 'Enterprise',
    icon: <Globe className="w-6 h-6" />,
    monthlyPrice: 'Custom',
    annualPrice: 'Custom',
    interval: 'Contact Sales',
    features: ['Multi-Campus Sync', 'White-labeled App', 'Dedicated Support', 'Custom API Access'],
    desc: 'For educational groups.',
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
        alert('Payment prompt sent to your phone. Please confirm.');
        setSelectedPlan(null);
      } catch (error) {
        console.error('Error initiating M-Pesa payment:', error);
        alert('Payment initiation failed.');
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
      
      alert(`Invoice generated (Ref: ${reference}). Please transfer the funds and share the receipt with support.`);
      setSelectedPlan(null);
      
      navigate('/dashboard?status=pending');
    } catch (error) {
      console.error('Error in bank transfer:', error);
      alert('Failed to process bank transfer request.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-primary/20 transition-colors duration-500">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 h-20 flex items-center">
        <div className="max-w-7xl mx-auto w-full px-6 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-md">
              <GraduationCap className="text-white" size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">EduStream</span>
          </Link>

          <div className="flex items-center space-x-6">
            <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors italic">Portal Login</Link>
            <Link to="/register" className="bg-slate-900 text-white px-6 py-2.5 text-sm font-bold rounded-lg hover:bg-slate-800 transition-all shadow-lg">Start Free</Link>
          </div>
        </div>
      </nav>

      <div className="pt-40 pb-32 max-w-7xl mx-auto px-6">
        {isLocked && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16 bg-red-50 border border-red-100 p-8 rounded-2xl flex flex-col md:flex-row items-center gap-8 justify-between shadow-sm"
          >
            <div className="flex items-center space-x-6">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-red-700 font-bold text-lg">Subscription Required</h3>
                <p className="text-red-600/70 text-sm font-medium italic">Please renew your plan to restore institutional access.</p>
              </div>
            </div>
            {isLoggedIn && (
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all shadow-lg shadow-red-200"
              >
                <LogOut size={16} />
                <span>Log Out</span>
              </button>
            )}
          </motion.div>
        )}

        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-8">
              Choose your <span className="text-primary">growth plan</span>.
            </h1>
            <p className="text-lg text-slate-600 italic font-medium leading-relaxed">
              Transparent pricing tailored for institutions of all sizes. 
              Save 20% with an annual commitment.
            </p>
          </motion.div>

          <div className="mt-12 flex items-center justify-center space-x-4">
            <span className={`text-sm font-bold transition-colors ${billingCycle === 'monthly' ? 'text-slate-900' : 'text-slate-400'}`}>Monthly</span>
            <button 
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
              className="w-14 h-8 bg-slate-200 rounded-full relative p-1 transition-all"
            >
              <motion.div 
                animate={{ x: billingCycle === 'monthly' ? 0 : 24 }}
                className="w-6 h-6 bg-primary rounded-full shadow-md"
              />
            </button>
            <span className={`text-sm font-bold transition-colors ${billingCycle === 'annual' ? 'text-slate-900' : 'text-slate-400'}`}>
              Annual <span className="text-emerald-500 ml-1 text-xs">(-20%)</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`relative rounded-3xl p-8 bg-white border transition-all flex flex-col ${plan.popular ? 'border-primary shadow-2xl shadow-primary/10 ring-4 ring-primary/5' : 'border-slate-100 shadow-sm'}`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                  Most Popular
                </div>
              )}
              
              <div className="w-12 h-12 bg-slate-50 text-primary rounded-xl flex items-center justify-center mb-8">
                {plan.icon}
              </div>

              <h2 className="text-xl font-bold text-slate-900 mb-2">{plan.name} Plan</h2>
              <p className="text-xs text-slate-500 font-medium mb-8 italic">{plan.desc}</p>
              
              <div className="flex items-baseline space-x-2 mb-10">
                <span className="text-4xl font-extrabold text-slate-900">
                  {plan.isEnterprise ? 'Custom' : (billingCycle === 'monthly' ? plan.monthlyPrice.toLocaleString() : plan.annualPrice.toLocaleString())}
                </span>
                <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                  {plan.isEnterprise ? '' : `${plan.interval} / ${billingCycle}`}
                </span>
              </div>

              <button
                onClick={() => {
                  if (plan.isEnterprise) {
                    window.location.href = 'mailto:hello@edustream.io';
                  } else if (!isLoggedIn) {
                    navigate(`/register?plan=${plan.name.toLowerCase()}`);
                  } else {
                    setSelectedPlan(plan);
                  }
                }}
                className={`w-full py-4 rounded-xl font-bold text-sm transition-all active:scale-95 mb-10 ${plan.popular ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
              >
                {plan.isEnterprise ? 'Contact Sales' : (isLoggedIn ? `Select ${plan.name}` : `Get Started`)}
              </button>

              <div className="space-y-4 pt-8 border-t border-slate-50 flex-grow">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start text-xs font-medium text-slate-600 italic">
                    <CheckCircle className="h-4 w-4 text-emerald-500 mr-3 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
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
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[200] p-6"
            onClick={() => setSelectedPlan(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-10 w-full max-w-md shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center space-x-4 mb-10">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white">
                  <Star size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Activate Plan</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{selectedPlan.name} • {billingCycle}</p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { id: 'mpesa', name: 'Pay via M-Pesa', icon: <Smartphone className="text-primary" /> },
                  { id: 'stripe', name: 'Credit/Debit Card', icon: <CreditCard className="text-primary" /> },
                  { id: 'bank', name: 'Direct Bank Transfer', icon: <Banknote className="text-primary" /> }
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => {
                       if (method.id === 'mpesa') handleMpesaSubscribe(billingCycle === 'monthly' ? selectedPlan.monthlyPrice : selectedPlan.annualPrice, selectedPlan.name);
                       if (method.id === 'stripe') handleStripeSubscribe(billingCycle === 'monthly' ? selectedPlan.monthlyPriceId : selectedPlan.annualPriceId);
                       if (method.id === 'bank') handleBankTransferSubscribe(billingCycle === 'monthly' ? selectedPlan.monthlyPrice : selectedPlan.annualPrice, selectedPlan.name);
                    }}
                    className="w-full flex items-center justify-between p-5 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:border-primary transition-all group shadow-sm"
                  >
                    <div className="flex items-center">
                      <div className="mr-5 transform group-hover:scale-110 transition-transform">{method.icon}</div>
                      <span className="font-bold text-sm text-slate-900">{method.name}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-all" />
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setSelectedPlan(null)}
                className="mt-10 w-full text-center text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
              >
                Cancel Sequence
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="py-20 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-10 text-xs font-bold uppercase tracking-widest text-slate-400">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
                <GraduationCap className="text-white" size={18} />
              </div>
              <span className="text-slate-900 font-extrabold italic">EduStream</span>
            </Link>
            <div className="flex space-x-10">
              <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-primary transition-colors">Terms</Link>
              <Link to="/contact" className="hover:text-primary transition-colors">Contact</Link>
            </div>
            <div className="opacity-60">
              © 2026 EduStream Systems
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PricingPage;
