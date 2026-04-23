import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Lock, 
  User, 
  ArrowRight, 
  ArrowLeft, 
  Zap, 
  ShieldCheck, 
  Globe, 
  School, 
  CheckCircle2,
  Smartphone,
  CreditCard,
  Banknote
} from 'lucide-react';
import api from '../services/api';

const steps = [
  { id: 1, title: 'School Info', icon: <School className="w-5 h-5" /> },
  { id: 2, title: 'Admin Account', icon: <User className="w-5 h-5" /> },
  { id: 3, title: 'Choose Plan', icon: <Zap className="w-5 h-5" /> },
  { id: 4, title: 'Finalize', icon: <CheckCircle2 className="w-5 h-5" /> }
];

const plans = [
  { id: 'free', name: 'Free', monthlyPrice: 0, annualPrice: 0, features: ['Up to 50 students', 'Basic Attendance', 'Basic Reports'] },
  { id: 'basic', name: 'Basic', monthlyPrice: 1000, annualPrice: 10000, features: ['Up to 200 students', 'Fee Management', 'SMS Alerts'] },
  { id: 'standard', name: 'Standard', monthlyPrice: 2000, annualPrice: 20000, features: ['Unlimited students', 'LMS Integration', 'Advanced Analytics'] },
  { id: 'premium', name: 'Premium', monthlyPrice: 3500, annualPrice: 35000, features: ['Priority Support', 'Custom Domain', 'Multi-campus'] }
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
    phone: ''
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const planParam = params.get('plan');
    if (planParam && plans.some(p => p.id === planParam)) {
      setFormData(prev => ({ ...prev, plan: planParam }));
      setCurrentStep(1); // Start at step 1 but with plan pre-selected
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
      // 1. Register School & Admin
      const { data } = await api.post('/auth/register-school', {
        schoolName: formData.schoolName,
        domain: formData.domain,
        adminEmail: formData.adminEmail,
        adminPassword: formData.adminPassword,
        plan: formData.plan
      });

      // 2. Store token
      localStorage.setItem('token', data.access_token);
      
      // 3. If plan is not free, initiate payment
      if (formData.plan !== 'free' && formData.phone) {
        try {
          const selectedPlan = plans.find(p => p.id === formData.plan);
          const amount = formData.billingCycle === 'monthly' ? selectedPlan?.monthlyPrice : selectedPlan?.annualPrice;
          
          // The token is now in localStorage, so api.post will include it
          await api.post('/mpesa/stk-push', {
            phone: formData.phone,
            amount: amount || 0,
            plan: formData.plan,
            billingCycle: formData.billingCycle
          });
          toast.success('STK Push sent! Please complete payment on your phone.');
        } catch (payErr) {
          console.error('Payment initiation failed', payErr);
          // We still registered successfully, so we can continue to dashboard
        }
      }

      navigate('/dashboard');
    } catch (err: any) {
      console.error('Registration failed', err);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-green flex items-center justify-center p-6 font-sans selection:bg-brand-sand selection:text-brand-dark">
      <div className="w-full max-w-2xl">
        {/* Progress Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step) => (
              <div key={step.id} className="flex flex-col items-center flex-1 relative">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all duration-500 ${currentStep >= step.id ? 'bg-brand-sand text-brand-dark shadow-lg shadow-brand-sand/20' : 'bg-white/10 text-brand-white/40'}`}>
                  {currentStep > step.id ? <CheckCircle2 className="w-5 h-5" /> : step.icon}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-widest mt-3 transition-opacity duration-500 ${currentStep >= step.id ? 'text-brand-white' : 'text-brand-white/20'}`}>
                  {step.title}
                </span>
                {step.id < 4 && (
                  <div className={`absolute top-5 left-1/2 w-full h-[2px] -z-0 transition-all duration-500 ${currentStep > step.id ? 'bg-brand-sand' : 'bg-white/10'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <motion.div 
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-[40px] shadow-2xl relative overflow-hidden"
        >
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-2xl text-red-200 text-sm font-medium">
              {error}
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-brand-white mb-2">School Details</h2>
                <p className="text-brand-white/40 text-sm">Tell us about your institution.</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-brand-white/60 ml-1">Institution Name</label>
                  <input
                    type="text"
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-brand-white focus:outline-none focus:border-brand-sand transition-colors"
                    placeholder="e.g. St. Andrews Academy"
                    value={formData.schoolName}
                    onChange={(e) => setFormData({...formData, schoolName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-brand-white/60 ml-1">Preferred Domain</label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-sand" />
                    <input
                      type="text"
                      className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-brand-white focus:outline-none focus:border-brand-sand transition-colors"
                      placeholder="schoolname"
                      value={formData.domain}
                      onChange={(e) => setFormData({...formData, domain: e.target.value})}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-white/20 text-xs font-bold">.saaslink.tech</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-brand-white mb-2">Admin Account</h2>
                <p className="text-brand-white/40 text-sm">Create the primary administrator account.</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-brand-white/60 ml-1">Admin Email</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-sand" />
                    <input
                      type="email"
                      className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-brand-white focus:outline-none focus:border-brand-sand transition-colors"
                      placeholder="admin@school.com"
                      value={formData.adminEmail}
                      onChange={(e) => setFormData({...formData, adminEmail: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-brand-white/60 ml-1">Secure Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-sand" />
                    <input
                      type="password"
                      className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-brand-white focus:outline-none focus:border-brand-sand transition-colors"
                      placeholder="••••••••"
                      value={formData.adminPassword}
                      onChange={(e) => setFormData({...formData, adminPassword: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-brand-white mb-2">Select a Plan</h2>
                  <p className="text-brand-white/40 text-sm">Choose the best fit for your institution.</p>
                </div>
                <div className="flex items-center space-x-4 bg-white/5 p-2 rounded-2xl border border-white/10">
                  <button
                    onClick={() => setFormData({ ...formData, billingCycle: 'monthly' })}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${formData.billingCycle === 'monthly' ? 'bg-brand-sand text-brand-dark shadow-md' : 'text-brand-white/40 hover:text-brand-white'}`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, billingCycle: 'annual' })}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${formData.billingCycle === 'annual' ? 'bg-brand-sand text-brand-dark shadow-md' : 'text-brand-white/40 hover:text-brand-white'}`}
                  >
                    Annual
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => setFormData({...formData, plan: plan.id})}
                    className={`p-6 rounded-3xl border text-left transition-all ${formData.plan === plan.id ? 'bg-brand-sand/10 border-brand-sand shadow-lg shadow-brand-sand/10' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <span className={`text-xs font-bold uppercase tracking-widest ${formData.plan === plan.id ? 'text-brand-sand' : 'text-brand-white/40'}`}>{plan.name}</span>
                      {formData.plan === plan.id && <CheckCircle2 className="w-4 h-4 text-brand-sand" />}
                    </div>
                    <div className="text-2xl font-bold text-brand-white mb-1">
                      KES {formData.billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice}
                    </div>
                    <div className="text-[10px] text-brand-white/40 font-bold uppercase tracking-tighter">
                      per {formData.billingCycle === 'monthly' ? 'month' : 'year'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-brand-white mb-2">Final Step</h2>
                <p className="text-brand-white/40 text-sm">Review and finalize your deployment.</p>
              </div>
              <div className="bg-white/5 rounded-3xl p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-brand-white/40 text-sm">School</span>
                  <span className="text-brand-white font-bold">{formData.schoolName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-brand-white/40 text-sm">Selected Plan</span>
                  <span className="text-brand-sand font-bold uppercase tracking-widest text-xs">
                    {formData.plan} ({formData.billingCycle})
                  </span>
                </div>
                {formData.plan !== 'free' && (
                  <div className="pt-4 border-t border-white/10 space-y-4">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-brand-white/60 ml-1">M-Pesa Number for Payment</label>
                    <div className="relative">
                      <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-sand" />
                      <input
                        type="text"
                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-brand-white focus:outline-none focus:border-brand-sand transition-colors"
                        placeholder="2547XXXXXXXX"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                    <p className="text-[10px] text-brand-white/40 italic">An STK push will be sent to this number upon clicking "Deploy System".</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-10 flex items-center justify-between">
            {currentStep > 1 ? (
              <button 
                onClick={handleBack}
                className="flex items-center space-x-2 text-brand-white/40 hover:text-brand-white transition-colors font-bold uppercase tracking-widest text-[10px]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <Link to="/login" className="text-brand-white/40 hover:text-brand-white transition-colors font-bold uppercase tracking-widest text-[10px]">
                Already have an account?
              </Link>
            )}

            {currentStep < 4 ? (
              <button 
                onClick={handleNext}
                className="bg-brand-sand text-brand-dark px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-[11px] hover:brightness-110 transition-all flex items-center space-x-2 shadow-lg shadow-brand-sand/20"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button 
                onClick={handleSubmit}
                disabled={loading}
                className="bg-brand-sand text-brand-dark px-10 py-4 rounded-2xl font-bold uppercase tracking-widest text-[11px] hover:brightness-110 transition-all flex items-center space-x-2 shadow-lg shadow-brand-sand/20 disabled:opacity-50"
              >
                {loading ? (
                  <span>Deploying...</span>
                ) : (
                  <>
                    <span>Deploy System</span>
                    <Zap className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>

        <div className="mt-8 text-center">
          <Link to="/" className="text-[10px] font-bold uppercase tracking-widest text-brand-white/20 hover:text-brand-white/60 transition-colors">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
