import { CheckCircle, CreditCard, Smartphone, Banknote, Zap, Shield, Star, Globe, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { getStripe } from '../services/stripe';
import api from '../services/api';

const plans = [
  {
    name: 'Basic',
    icon: <Zap className="w-6 h-6" />,
    monthlyPrice: 100,
    annualPrice: 1000,
    interval: 'KES / student',
    monthlyPriceId: 'price_basic_monthly',
    annualPriceId: 'price_basic_annual',
    features: ['Student Records', 'Fee Management', 'Basic Reporting', 'Attendance Tracking'],
  },
  {
    name: 'Standard',
    icon: <Shield className="w-6 h-6" />,
    monthlyPrice: 200,
    annualPrice: 2000,
    interval: 'KES / student',
    monthlyPriceId: 'price_standard_monthly',
    annualPriceId: 'price_standard_annual',
    features: ['All Basic Features', 'LMS Integration', 'Parent Portal', 'SMS Notifications'],
  },
  {
    name: 'Premium',
    icon: <Star className="w-6 h-6" />,
    monthlyPrice: 350,
    annualPrice: 3500,
    interval: 'KES / student',
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

const PricingPage = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

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
          plan: planName.toLowerCase() 
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
    const reference = `BT-${Date.now()}`;
    try {
      await api.post('/payments/bank-transfer', { 
        amount, 
        reference,
        plan: planName.toLowerCase()
      });
      alert('Bank transfer request sent. Please check your email for payment instructions.');
      setSelectedPlan(null);
    } catch (error) {
      console.error('Error creating bank transfer request:', error);
      alert('Failed to create bank transfer request.');
    }
  };

  return (
    <div className="min-h-screen bg-brand-green text-brand-white font-sans selection:bg-brand-sand selection:text-brand-dark">
      <div className="pt-32 pb-24 max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="text-brand-sand text-[11px] font-bold uppercase tracking-[0.3em] mb-6 block">
              Pricing & Plans
            </span>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-8">
              Simple, transparent <br />
              <span className="text-brand-sand italic font-serif">investment.</span>
            </h1>
            <p className="text-lg text-brand-white/60 leading-relaxed">
              Choose the plan that's right for your institution. Save up to 20% with annual billing.
            </p>
          </motion.div>

          {/* Billing Toggle */}
          <div className="mt-12 flex items-center justify-center space-x-4">
            <span className={`text-sm font-bold uppercase tracking-widest transition-opacity ${billingCycle === 'monthly' ? 'opacity-100' : 'opacity-40'}`}>Monthly</span>
            <button 
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
              className="w-14 h-7 bg-white/10 rounded-full relative p-1 transition-colors hover:bg-white/20"
            >
              <motion.div 
                animate={{ x: billingCycle === 'monthly' ? 0 : 28 }}
                className="w-5 h-5 bg-brand-sand rounded-full shadow-lg"
              />
            </button>
            <span className={`text-sm font-bold uppercase tracking-widest transition-opacity ${billingCycle === 'annual' ? 'opacity-100' : 'opacity-40'}`}>
              Annual <span className="text-brand-sand ml-1">(Save 20%)</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -10 }}
              className={`relative rounded-[32px] p-8 bg-white/5 border transition-all flex flex-col ${plan.popular ? 'border-brand-sand shadow-2xl shadow-brand-sand/10' : 'border-white/5'}`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-8 -translate-y-1/2 bg-brand-sand text-brand-dark px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                  Most Popular
                </div>
              )}
              
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-8">
                <div className="text-brand-sand">{plan.icon}</div>
              </div>

              <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
              <div className="flex items-baseline space-x-2 mb-8">
                <span className="text-4xl font-bold tracking-tighter">
                  {plan.isEnterprise ? 'Custom' : (billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice)}
                </span>
                <span className="text-brand-white/40 text-[10px] font-bold uppercase tracking-widest">
                  {plan.interval} {!plan.isEnterprise && `/ ${billingCycle}`}
                </span>
              </div>

              <button
                onClick={() => {
                  if (plan.isEnterprise) {
                    window.location.href = 'mailto:sales@saaslink.tech?subject=Enterprise Plan Inquiry';
                  } else {
                    setSelectedPlan(plan);
                  }
                }}
                className={`w-full py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-all active:scale-95 mt-auto ${plan.popular ? 'bg-brand-sand text-brand-dark shadow-lg shadow-brand-sand/20' : 'bg-white/10 text-brand-white hover:bg-white/20'}`}
              >
                {plan.isEnterprise ? 'Contact Sales' : `Choose ${plan.name}`}
              </button>

              <ul className="mt-10 space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start text-[13px] text-brand-white/60">
                    <CheckCircle className="h-4 w-4 text-brand-sand mr-3 flex-shrink-0 mt-0.5" />
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
            className="fixed inset-0 bg-brand-dark/80 backdrop-blur-md flex items-center justify-center z-[100] p-6"
            onClick={() => setSelectedPlan(null)}
          >
            <motion.div
              initial={{ y: 50, scale: 0.9 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 50, scale: 0.9 }}
              className="bg-brand-green border border-white/10 rounded-[32px] p-10 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center space-x-4 mb-8">
                <div className="w-12 h-12 bg-brand-sand/10 rounded-2xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-brand-sand" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Secure Checkout</h2>
                  <p className="text-sm text-brand-white/40">Plan: {selectedPlan.name} ({billingCycle})</p>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => handleStripeSubscribe(billingCycle === 'monthly' ? selectedPlan.monthlyPriceId : selectedPlan.annualPriceId)}
                  className="w-full flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all group"
                >
                  <div className="flex items-center">
                    <CreditCard className="h-6 w-6 mr-4 text-brand-sand" />
                    <span className="font-bold uppercase tracking-widest text-[11px]">Credit / Debit Card</span>
                  </div>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
                </button>

                <button
                  onClick={() => handleMpesaSubscribe(billingCycle === 'monthly' ? selectedPlan.monthlyPrice : selectedPlan.annualPrice, selectedPlan.name)}
                  className="w-full flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all group"
                >
                  <div className="flex items-center">
                    <Smartphone className="h-6 w-6 mr-4 text-brand-sand" />
                    <span className="font-bold uppercase tracking-widest text-[11px]">M-Pesa Mobile Money</span>
                  </div>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
                </button>

                <button
                  onClick={() => handleBankTransferSubscribe(billingCycle === 'monthly' ? selectedPlan.monthlyPrice : selectedPlan.annualPrice, selectedPlan.name)}
                  className="w-full flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all group"
                >
                  <div className="flex items-center">
                    <Banknote className="h-6 w-6 mr-4 text-brand-sand" />
                    <span className="font-bold uppercase tracking-widest text-[11px]">Direct Bank Transfer</span>
                  </div>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
                </button>
              </div>

              <button 
                onClick={() => setSelectedPlan(null)}
                className="mt-8 w-full text-center text-[10px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity"
              >
                Cancel Transaction
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PricingPage;

