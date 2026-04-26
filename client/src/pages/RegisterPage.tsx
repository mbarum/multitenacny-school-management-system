import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { 
  Lock, 
  User, 
  ArrowRight, 
  ArrowLeft, 
  Zap, 
  CheckCircle2,
  Smartphone,
  School,
  Globe,
  Activity,
  GraduationCap,
  CreditCard,
  Banknote,
  ChevronRight,
  Star
} from 'lucide-react';
import api from '../services/api';
import SEO from '../components/SEO';

const steps = [
  { id: 1, title: 'School Info', icon: <School className="w-4 h-4" /> },
  { id: 2, title: 'Administrator', icon: <User className="w-4 h-4" /> },
  { id: 3, title: 'Subscription', icon: <Zap className="w-4 h-4" /> },
  { id: 4, title: 'Verify', icon: <CheckCircle2 className="w-4 h-4" /> }
];

const plans = [
  { id: 'free', name: 'Free', monthlyPrice: 0, annualPrice: 0, desc: 'Essential school management tools.' },
  { id: 'basic', name: 'Basic', monthlyPrice: 1000, annualPrice: 10000, desc: 'Complete school management solution.' },
  { id: 'standard', name: 'Standard', monthlyPrice: 2000, annualPrice: 20000, desc: 'Multi-campus management and reporting.' },
  { id: 'premium', name: 'Premium', monthlyPrice: 3500, annualPrice: 35000, desc: 'Comprehensive enterprise-grade system.' }
];

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    schoolName: '',
    domain: '',
    adminEmail: '',
    adminPassword: '',
    plan: 'free',
    billingCycle: 'monthly' as 'monthly' | 'annual',
    phone: '',
    paymentMethod: 'mpesa' as 'mpesa' | 'stripe' | 'bank'
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const planParam = params.get('plan');
    if (planParam && plans.some(p => p.id === planParam)) {
      setFormData(prev => ({ ...prev, plan: planParam }));
      setCurrentStep(1); 
    }
  }, [location]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, 4));
  const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/register-school', {
        schoolName: formData.schoolName,
        domain: formData.domain,
        adminEmail: formData.adminEmail,
        adminPassword: formData.adminPassword,
        plan: formData.plan
      });

      localStorage.setItem('token', data.access_token);
      
      if (formData.plan !== 'free') {
        try {
          const selectedPlan = plans.find(p => p.id === formData.plan);
          const amount = formData.billingCycle === 'monthly' ? selectedPlan?.monthlyPrice : selectedPlan?.annualPrice;
          const amountVal = amount || 0;

          if (formData.paymentMethod === 'mpesa') {
            await api.post('/mpesa/stk-push', {
              phone: formData.phone,
              amount: amountVal,
              plan: formData.plan,
              billingCycle: formData.billingCycle
            });
            toast.success('Payment Initiation: Please check your phone for the M-Pesa prompt.');
          } else if (formData.paymentMethod === 'stripe') {
            // For stripe, we usually need to redirect to checkout
            // But since this is part of registration, we might want to handle it differently
            // For now, let's just trigger a redirect if possible or log it
            const { sessionId } = await api.post('/subscriptions/create-checkout-session', { 
               priceId: formData.plan === 'basic' ? 'price_basic' : (formData.plan === 'standard' ? 'price_standard' : 'price_premium')
            });
            // This logic is simplified; real prod would need matching priceIds
            toast.info('Redirecting to secure card payment...');
            const { getStripe } = await import('../services/stripe');
            const stripe = await getStripe();
            if (stripe) {
              await stripe.redirectToCheckout({ sessionId });
              return; // Stop here
            }
          } else if (formData.paymentMethod === 'bank') {
            const response = await api.post('/subscriptions/bank-transfer', { 
              amount: Number(amountVal), 
              plan: formData.plan,
              billingCycle: formData.billingCycle
            });
            toast.success('Invoice Generated. Please check your dashboard for details.');
          }
        } catch (payErr) {
          console.error('Payment initiation failed', payErr);
          toast.error('Payment initiation encountered an error.');
        }
      }

      toast.success('Registration Successful. Your school system is ready.');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Registration failed', err);
      setError(err.response?.data?.message || 'Registration Error: Identification failed.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-6 font-sans selection:bg-brand-gold selection:text-surface transition-colors duration-500">
      <SEO title="School Registration" description="Register your institution on SaaSLink and start managing your school with unified ERP tools." />
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,var(--color-on-canvas)_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      <div className="w-full max-w-4xl relative z-10">
        <div className="flex flex-col items-center mb-12">
          <Link to="/" className="mb-8 group flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-lg shadow-primary/20">
               <GraduationCap className="text-white" size={28} />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-slate-900 group-hover:text-primary transition-colors">SaaSLink Management</span>
          </Link>

          {/* Stepper */}
          <div className="flex items-center justify-between w-full max-w-xl px-4">
            {steps.map((step) => (
              <div key={step.id} className="flex flex-col items-center flex-1 relative">
                <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center z-10 transition-all duration-300 ${currentStep >= step.id ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-white border-slate-200 text-slate-400'}`}>
                  {currentStep > step.id ? <CheckCircle2 size={18} /> : step.icon}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-widest mt-3 transition-colors duration-300 ${currentStep >= step.id ? 'text-slate-900' : 'text-slate-400'}`}>
                  {step.title}
                </span>
                {step.id < 4 && (
                  <div className={`absolute top-5 left-1/2 w-full h-[2px] -z-0 transition-all duration-300 ${currentStep > step.id ? 'bg-primary' : 'bg-slate-100'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <motion.div 
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-100 p-8 md:p-12 shadow-2xl rounded-3xl"
        >
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 font-bold text-xs rounded-xl"
              >
                Registration Error: {error}
              </motion.div>
            )}
          </AnimatePresence>

          {currentStep === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-10">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Institution Details</h2>
                  <p className="text-slate-500 text-sm font-medium">Let's set up your school profile.</p>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-widest ml-1">School Name</label>
                    <input
                      type="text"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-primary transition-all font-medium text-sm placeholder:text-slate-400"
                      placeholder="e.g. Hillcrest High School"
                      value={formData.schoolName}
                      onChange={(e) => setFormData({...formData, schoolName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-widest ml-1">Custom Subdomain</label>
                    <div className="relative group">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary" />
                      <input
                        type="text"
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-primary transition-all font-medium text-sm lowercase placeholder:text-slate-400"
                        placeholder="hillcresthills"
                        value={formData.domain}
                        onChange={(e) => setFormData({...formData, domain: e.target.value})}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold tracking-tight">.saaslink.io</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="hidden md:flex flex-col items-center justify-center p-10 bg-slate-50 border border-slate-100 rounded-2xl">
                 <School size={48} className="text-primary mb-6 animate-pulse" />
                 <p className="text-sm font-medium text-slate-500 leading-relaxed text-center italic">
                   "Your dedicated school portal will be available immediately after verification."
                 </p>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="max-w-md mx-auto space-y-10 text-center">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Admin Credentials</h2>
                <p className="text-slate-500 text-sm font-medium">Create the primary administrator account.</p>
              </div>
              <div className="space-y-6 text-left">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-widest ml-1">Professional Email</label>
                  <input
                    type="email"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-primary transition-all font-medium text-sm placeholder:text-slate-400"
                    placeholder="admin@school.edu"
                    value={formData.adminEmail}
                    onChange={(e) => setFormData({...formData, adminEmail: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-widest ml-1">Secure Password</label>
                  <input
                    type="password"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-primary transition-all font-medium text-sm placeholder:text-slate-400"
                    placeholder="••••••••"
                    value={formData.adminPassword}
                    onChange={(e) => setFormData({...formData, adminPassword: e.target.value})}
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Select Plan</h2>
                  <p className="text-slate-500 text-sm font-medium">Choose a subscription that fits your institution.</p>
                </div>
                <div className="flex p-1 bg-slate-50 border border-slate-200 rounded-xl">
                  <button
                    onClick={() => setFormData({ ...formData, billingCycle: 'monthly' })}
                    className={`px-6 py-2 text-xs font-bold uppercase tracking-widest transition-all rounded-lg ${formData.billingCycle === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, billingCycle: 'annual' })}
                    className={`px-6 py-2 text-xs font-bold uppercase tracking-widest transition-all rounded-lg ${formData.billingCycle === 'annual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Annual
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => setFormData({...formData, plan: plan.id})}
                    className={`p-6 border rounded-2xl text-left transition-all group flex flex-col justify-between min-h-[240px] ${formData.plan === plan.id ? 'bg-primary border-primary text-white shadow-xl shadow-primary/20' : 'bg-white border-slate-100 text-slate-900 hover:border-slate-300'}`}
                  >
                    <div>
                      <div className="flex justify-between items-center mb-6">
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${formData.plan === plan.id ? 'text-white/80' : 'text-slate-400'}`}>{plan.name}</span>
                        {formData.plan === plan.id && <CheckCircle2 size={16} className="text-white" />}
                      </div>
                      <div className="text-2xl font-bold mb-1 tracking-tight">
                        KES {formData.billingCycle === 'monthly' ? plan.monthlyPrice.toLocaleString() : plan.annualPrice.toLocaleString()}
                      </div>
                      <div className={`text-[10px] font-bold uppercase tracking-widest ${formData.plan === plan.id ? 'text-white/60' : 'text-slate-400'}`}>
                        /{formData.billingCycle}
                      </div>
                    </div>
                    <p className={`text-[11px] font-medium leading-relaxed mt-6 ${formData.plan === plan.id ? 'text-white/80' : 'text-slate-500'}`}>
                      {plan.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="max-w-2xl mx-auto space-y-10">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Review & Activate</h2>
                <p className="text-slate-500 text-sm font-medium">Verify your configuration and select a payment method.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-slate-50 border border-slate-100 p-8 rounded-2xl space-y-6 self-start">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">School</span>
                    <span className="text-sm font-bold text-slate-900">{formData.schoolName}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Plan</span>
                    <span className="text-xs font-bold text-primary uppercase tracking-widest">
                      {formData.plan} ({formData.billingCycle})
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cost</span>
                    <span className="text-sm font-bold text-slate-900">
                      KES {formData.billingCycle === 'monthly' ? plans.find(p => p.id === formData.plan)?.monthlyPrice?.toLocaleString() : plans.find(p => p.id === formData.plan)?.annualPrice?.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="space-y-6">
                  {formData.plan !== 'free' ? (
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Payment Method</h3>
                      <div className="space-y-3">
                        <button
                          onClick={() => setFormData({ ...formData, paymentMethod: 'mpesa' })}
                          className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${formData.paymentMethod === 'mpesa' ? 'bg-primary/5 border-primary ring-1 ring-primary' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                        >
                          <div className="flex items-center space-x-3">
                            <Smartphone className={formData.paymentMethod === 'mpesa' ? 'text-primary' : 'text-slate-400'} size={18} />
                            <span className={`text-sm font-bold ${formData.paymentMethod === 'mpesa' ? 'text-slate-900' : 'text-slate-600'}`}>M-Pesa STK Push</span>
                          </div>
                          {formData.paymentMethod === 'mpesa' && <CheckCircle2 size={16} className="text-primary" />}
                        </button>

                        {formData.paymentMethod === 'mpesa' && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="px-2 py-2"
                          >
                            <input
                              type="text"
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-primary transition-all font-bold text-sm placeholder:text-slate-400"
                              placeholder="2547XXXXXXXX"
                              value={formData.phone}
                              onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            />
                            <p className="text-[9px] text-slate-500 font-medium italic mt-2">You will receive an M-Pesa prompt on your phone.</p>
                          </motion.div>
                        )}

                        <button
                          onClick={() => setFormData({ ...formData, paymentMethod: 'stripe' })}
                          className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${formData.paymentMethod === 'stripe' ? 'bg-primary/5 border-primary ring-1 ring-primary' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                        >
                          <div className="flex items-center space-x-3">
                            <CreditCard className={formData.paymentMethod === 'stripe' ? 'text-primary' : 'text-slate-400'} size={18} />
                            <span className={`text-sm font-bold ${formData.paymentMethod === 'stripe' ? 'text-slate-900' : 'text-slate-600'}`}>Card (Secure Stripe)</span>
                          </div>
                          {formData.paymentMethod === 'stripe' && <CheckCircle2 size={16} className="text-primary" />}
                        </button>

                        <button
                          onClick={() => setFormData({ ...formData, paymentMethod: 'bank' })}
                          className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${formData.paymentMethod === 'bank' ? 'bg-primary/5 border-primary ring-1 ring-primary' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                        >
                          <div className="flex items-center space-x-3">
                            <Banknote className={formData.paymentMethod === 'bank' ? 'text-primary' : 'text-slate-400'} size={18} />
                            <span className={`text-sm font-bold ${formData.paymentMethod === 'bank' ? 'text-slate-900' : 'text-slate-600'}`}>Direct Bank Transfer</span>
                          </div>
                          {formData.paymentMethod === 'bank' && <CheckCircle2 size={16} className="text-primary" />}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 bg-emerald-50 border border-emerald-100 rounded-2xl text-center">
                      <CheckCircle2 className="text-emerald-500 mx-auto mb-4" size={32} />
                      <h4 className="text-emerald-800 font-bold mb-1">Free Tier Selected</h4>
                      <p className="text-emerald-700/60 text-[11px] font-medium leading-relaxed italic">
                        "Start building your digital school foundation instantly - no credit card required."
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="mt-12 flex flex-col md:flex-row gap-6 items-center justify-between">
            {currentStep > 1 ? (
              <button 
                onClick={handleBack}
                className="group flex items-center space-x-3 text-slate-500 hover:text-slate-900 transition-all font-bold uppercase tracking-widest text-[10px]"
              >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                <span>Previous Step</span>
              </button>
            ) : (
              <Link to="/login" className="text-slate-500 hover:text-slate-900 transition-all font-bold uppercase tracking-widest text-[10px]">
                Already registered?
              </Link>
            )}

            <div className="flex gap-4 w-full md:w-auto">
              <Link 
                to="/" 
                className="flex-1 md:flex-none border border-slate-200 px-8 py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all text-center"
              >
                Cancel
              </Link>
              {currentStep < 4 ? (
                <button 
                  onClick={handleNext}
                  className="flex-1 md:flex-none bg-slate-900 text-white px-10 py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all flex items-center justify-center space-x-3 shadow-xl active:scale-[0.98]"
                >
                  <span>Continue</span>
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 md:flex-none bg-primary text-white px-10 py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-primary-dark transition-all flex items-center justify-center space-x-3 shadow-xl shadow-primary/20 disabled:opacity-50 active:scale-[0.98]"
                >
                  <span>{loading ? 'Processing...' : 'Complete Registration'}</span>
                  {!loading && <Zap size={16} className="fill-current" />}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RegisterPage;
