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
  CheckCircle2,
  Smartphone,
  School,
  Globe,
  Activity
} from 'lucide-react';
import api from '../services/api';

const steps = [
  { id: 1, title: 'Node Info', icon: <School className="w-4 h-4" /> },
  { id: 2, title: 'Identity', icon: <User className="w-4 h-4" /> },
  { id: 3, title: 'Protocol', icon: <Zap className="w-4 h-4" /> },
  { id: 4, title: 'Verify', icon: <CheckCircle2 className="w-4 h-4" /> }
];

const plans = [
  { id: 'free', name: 'Standard', monthlyPrice: 0, annualPrice: 0, desc: 'Entry level academic ledger.' },
  { id: 'basic', name: 'Institutional', monthlyPrice: 1000, annualPrice: 10000, desc: 'Full campus orchestration.' },
  { id: 'standard', name: 'Enterprise', monthlyPrice: 2000, annualPrice: 20000, desc: 'Multi-campus synchronization.' },
  { id: 'premium', name: 'Apex', monthlyPrice: 3500, annualPrice: 35000, desc: 'Full-stack academic matrix.' }
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
      
      if (formData.plan !== 'free' && formData.phone) {
        try {
          const selectedPlan = plans.find(p => p.id === formData.plan);
          const amount = formData.billingCycle === 'monthly' ? selectedPlan?.monthlyPrice : selectedPlan?.annualPrice;
          
          await api.post('/mpesa/stk-push', {
            phone: formData.phone,
            amount: amount || 0,
            plan: formData.plan,
            billingCycle: formData.billingCycle
          });
          toast.success('System Provisioning: Authorizing STK Push...');
        } catch (payErr) {
          console.error('Payment initiation failed', payErr);
        }
      }

      toast.success('Identity Verified. Node Deployment Complete.');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Registration failed', err);
      setError(err.response?.data?.message || 'Deployment Error: Identification failed.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-6 font-sans selection:bg-brand-gold selection:text-surface transition-colors duration-500">
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,var(--color-on-canvas)_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      <div className="w-full max-w-4xl relative z-10">
        <div className="flex flex-col items-center mb-16">
          <Link to="/" className="mb-12 group flex items-center space-x-4">
            <div className="w-12 h-12 bg-accent-color rounded-sm flex items-center justify-center transition-transform group-hover:rotate-6">
               <Activity className="text-surface" size={24} />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-[0.3em] uppercase italic leading-none">Saaslink</span>
              <div className="h-[2px] w-full bg-brand-gold mt-1.5 shadow-sm" />
            </div>
          </Link>

          {/* Stepper */}
          <div className="flex items-center justify-between w-full max-w-2xl px-4">
            {steps.map((step) => (
              <div key={step.id} className="flex flex-col items-center flex-1 relative">
                <div className={`w-12 h-12 rounded-sm border flex items-center justify-center z-10 transition-all duration-500 ${currentStep >= step.id ? 'bg-on-canvas border-on-canvas text-surface shadow-xl shadow-accent-color/10' : 'bg-surface border-border-muted text-gray-400'}`}>
                  {currentStep > step.id ? <CheckCircle2 size={18} /> : step.icon}
                </div>
                <span className={`text-[10px] font-mono font-bold uppercase tracking-[0.2em] mt-4 transition-opacity duration-500 ${currentStep >= step.id ? 'text-on-canvas' : 'text-gray-400 opacity-40'}`}>
                  {step.title}
                </span>
                {step.id < 4 && (
                  <div className={`absolute top-6 left-1/2 w-full h-[1px] -z-0 transition-all duration-500 ${currentStep > step.id ? 'bg-on-canvas' : 'bg-border-muted'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <motion.div 
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface border border-border-muted p-10 md:p-16 shadow-[0_64px_128px_-32px_rgba(0,0,0,0.1)] rounded-sm"
        >
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-10 p-6 bg-red-500/5 border-l-4 border-red-500 text-red-600 font-mono text-[11px] uppercase tracking-widest"
              >
                ERROR_NODE: {error}
              </motion.div>
            )}
          </AnimatePresence>

          {currentStep === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              <div className="space-y-12">
                <div>
                  <h2 className="text-4xl font-serif italic text-on-canvas mb-4 tracking-tight">Institutional_Core</h2>
                  <p className="text-gray-400 text-sm italic font-medium leading-relaxed">Establish the base architectural parameters for your campus node.</p>
                </div>
                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-[0.4em] text-gray-400 ml-1">ADMIN_DESIGNATION</label>
                    <input
                      type="text"
                      className="w-full px-6 py-4 bg-canvas border border-border-muted rounded-0 text-on-canvas focus:outline-none focus:border-on-canvas transition-all font-mono text-sm uppercase placeholder:text-gray-600"
                      placeholder="e.g. Royal Academy"
                      value={formData.schoolName}
                      onChange={(e) => setFormData({...formData, schoolName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-[0.4em] text-gray-400 ml-1">NETWORK_ID</label>
                    <div className="relative group">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-brand-gold" />
                      <input
                        type="text"
                        className="w-full pl-12 pr-4 py-4 bg-canvas border border-border-muted rounded-0 text-on-canvas focus:outline-none focus:border-on-canvas transition-all font-mono text-sm lowercase placeholder:text-gray-600"
                        placeholder="school_node_v1"
                        value={formData.domain}
                        onChange={(e) => setFormData({...formData, domain: e.target.value})}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 text-[10px] font-mono font-bold tracking-widest">.SAASLINK.TECH</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="hidden md:flex items-center justify-center p-12 bg-canvas border border-border-muted relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4">
                    <School size={48} className="text-on-canvas opacity-[0.03]" />
                 </div>
                 <p className="text-[11px] font-mono text-gray-500 uppercase tracking-widest leading-loose italic text-center">
                    Validation required for system domain mapping. Global registry checks will execute upon deployment.
                 </p>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="max-w-xl mx-auto space-y-12 text-center">
              <div>
                <h2 className="text-4xl font-serif italic text-on-canvas mb-4 tracking-tight">Identity_Genesis</h2>
                <p className="text-gray-400 text-sm italic font-medium">Define the root administrator credential for this node.</p>
              </div>
              <div className="space-y-8 text-left">
                <div className="space-y-3">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-[0.4em] text-gray-400 ml-1">PRIMARY_IDENTITY</label>
                  <input
                    type="email"
                    className="w-full px-8 py-4 bg-canvas border border-border-muted rounded-0 text-on-canvas focus:outline-none focus:border-on-canvas transition-all font-mono text-sm placeholder:text-gray-600"
                    placeholder="admin@institution.io"
                    value={formData.adminEmail}
                    onChange={(e) => setFormData({...formData, adminEmail: e.target.value})}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-[0.4em] text-gray-400 ml-1">SECURE_CIPHER</label>
                  <input
                    type="password"
                    className="w-full px-8 py-4 bg-canvas border border-border-muted rounded-0 text-on-canvas focus:outline-none focus:border-on-canvas transition-all font-mono text-sm placeholder:text-gray-600"
                    placeholder="••••••••"
                    value={formData.adminPassword}
                    onChange={(e) => setFormData({...formData, adminPassword: e.target.value})}
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-12">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div>
                  <h2 className="text-4xl font-serif italic text-on-canvas mb-4 tracking-tight">Protocol_Select</h2>
                  <p className="text-gray-400 text-sm italic font-medium">Establish a subscription layer for system operation.</p>
                </div>
                <div className="flex p-1 bg-canvas border border-border-muted rounded-sm">
                  <button
                    onClick={() => setFormData({ ...formData, billingCycle: 'monthly' })}
                    className={`px-6 py-2.5 text-[10px] font-mono font-bold uppercase tracking-widest transition-all ${formData.billingCycle === 'monthly' ? 'bg-on-canvas text-surface' : 'text-gray-500 hover:text-on-canvas'}`}
                  >
                    MONTHLY
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, billingCycle: 'annual' })}
                    className={`px-6 py-2.5 text-[10px] font-mono font-bold uppercase tracking-widest transition-all ${formData.billingCycle === 'annual' ? 'bg-on-canvas text-surface' : 'text-gray-500 hover:text-on-canvas'}`}
                  >
                    ANNUAL
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => setFormData({...formData, plan: plan.id})}
                    className={`p-8 border rounded-sm text-left transition-all group flex flex-col justify-between min-h-[300px] ${formData.plan === plan.id ? 'bg-accent-color border-accent-color text-surface shadow-2xl' : 'bg-canvas border-border-muted text-on-canvas hover:border-gray-400'}`}
                  >
                    <div>
                      <div className="flex justify-between items-center mb-10">
                        <span className={`text-[10px] font-mono font-bold uppercase tracking-[0.3em] ${formData.plan === plan.id ? 'text-brand-gold' : 'text-gray-400'}`}>{plan.name}</span>
                        {formData.plan === plan.id && <CheckCircle2 size={16} className="text-surface" />}
                      </div>
                      <div className="text-3xl font-serif italic mb-2">
                        KES {formData.billingCycle === 'monthly' ? plan.monthlyPrice.toLocaleString() : plan.annualPrice.toLocaleString()}
                      </div>
                      <div className={`text-[10px] font-mono font-bold uppercase tracking-widest ${formData.plan === plan.id ? 'text-surface/60' : 'text-gray-400'}`}>
                        /{formData.billingCycle}
                      </div>
                    </div>
                    <p className={`text-[11px] font-sans italic leading-relaxed mt-10 ${formData.plan === plan.id ? 'text-surface/80' : 'text-gray-500'}`}>
                      {plan.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="max-w-xl mx-auto space-y-12">
              <div className="text-center">
                <h2 className="text-4xl font-serif italic text-on-canvas mb-4 tracking-tight">System_Verification</h2>
                <p className="text-gray-400 text-sm italic font-medium">Final review of architectural parameters.</p>
              </div>
              <div className="bg-canvas border border-border-muted p-10 space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                   <Activity size={32} className="text-on-canvas opacity-[0.03]" />
                </div>
                <div className="flex justify-between items-center border-b border-border-muted pb-6">
                  <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Node_Domain</span>
                  <span className="text-sm font-bold text-on-canvas italic">{formData.schoolName}</span>
                </div>
                <div className="flex justify-between items-center border-b border-border-muted pb-6">
                  <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Protocol_Tier</span>
                  <span className="text-[10px] font-mono font-bold text-brand-gold uppercase tracking-[0.3em]">
                    {formData.plan} // {formData.billingCycle}
                  </span>
                </div>
                {formData.plan !== 'free' && (
                  <div className="space-y-6 pt-4">
                    <div className="space-y-3">
                      <label className="text-[10px] font-mono font-bold uppercase tracking-[0.4em] text-gray-400 ml-1">PAYMENT_IDENTITY (M-PESA)</label>
                      <div className="relative">
                        <Smartphone className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gold" />
                        <input
                          type="text"
                          className="w-full pl-16 pr-6 py-5 bg-surface border border-border-muted rounded-0 text-on-canvas focus:outline-none focus:border-on-canvas transition-all font-mono text-sm placeholder:text-gray-600"
                          placeholder="2547XXXXXXXX"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        />
                      </div>
                      <p className="text-[10px] text-gray-500 italic uppercase tracking-wider">Sync will execute upon authorization.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-16 flex flex-col md:flex-row gap-8 items-center justify-between">
            {currentStep > 1 ? (
              <button 
                onClick={handleBack}
                className="group flex items-center space-x-4 text-gray-500 hover:text-on-canvas transition-all font-mono font-bold uppercase tracking-[0.4em] text-[10px]"
              >
                <ArrowLeft size={16} className="group-hover:-translate-x-2 transition-transform" />
                <span>PREV_NODE</span>
              </button>
            ) : (
              <Link to="/login" className="text-gray-500 hover:text-on-canvas transition-all font-mono font-bold uppercase tracking-[0.4em] text-[10px]">
                EXISTING_IDENTITY?
              </Link>
            )}

            <div className="flex gap-6 w-full md:w-auto">
              <Link 
                to="/" 
                className="flex-1 md:flex-none border border-border-muted px-10 py-5 text-[10px] font-mono font-bold uppercase tracking-[0.4em] hover:bg-canvas transition-all text-center"
              >
                ABORT
              </Link>
              {currentStep < 4 ? (
                <button 
                  onClick={handleNext}
                  className="flex-1 md:flex-none bg-on-canvas text-surface px-12 py-5 font-black uppercase tracking-[0.4em] text-[11px] hover:opacity-90 transition-all flex items-center justify-center space-x-4 shadow-2xl active:scale-[0.98]"
                >
                  <span>NEXT_NODE</span>
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 md:flex-none bg-accent-color text-surface px-12 py-5 font-black uppercase tracking-[0.4em] text-[11px] hover:brightness-110 transition-all flex items-center justify-center space-x-4 shadow-2xl shadow-accent-color/20 disabled:opacity-50 active:scale-[0.98]"
                >
                  <span>{loading ? 'DEPLOYING...' : 'INITIALIZE_SYNC'}</span>
                  {!loading && <Zap size={16} className="text-brand-gold fill-brand-gold" />}
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
