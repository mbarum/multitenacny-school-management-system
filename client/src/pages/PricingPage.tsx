import { CheckCircle, CreditCard, Smartphone, Banknote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import api from '../services/api';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const plans = [
  {
    name: 'Basic',
    price: 100,
    interval: 'KES / student / month',
    stripePriceId: 'price_1PCOaBAb3B8t9B5c5B8b3B8c',
    features: ['Student Records', 'Fee Management', 'Basic Reporting'],
  },
  {
    name: 'Premium',
    price: 250,
    interval: 'KES / student / month',
    stripePriceId: 'price_1PCOaBAb3B8t9B5c5B8b3B8d',
    features: ['All Basic Features', 'LMS Integration', 'Advanced Reporting', 'Parent Portal'],
  },
];

const PricingPage = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);

  const handleStripeSubscribe = async (priceId) => {
    try {
      const { sessionId } = await api.post('/subscriptions/create-checkout-session', { priceId });
      const stripe = await stripePromise;
      await stripe.redirectToCheckout({ sessionId });
    } catch (error) {
      console.error('Error creating checkout session:', error);
    }
  };

  const handleMpesaSubscribe = async (amount) => {
    const phone = prompt('Please enter your M-Pesa phone number (e.g., 2547...):');
    if (phone) {
      try {
        await api.post('/mpesa/stk-push', { phone, amount });
        alert('STK Push sent to your phone. Please complete the transaction.');
        setSelectedPlan(null);
      } catch (error) {
        console.error('Error initiating M-Pesa payment:', error);
        alert('Failed to initiate M-Pesa payment.');
      }
    }
  };

  const handleBankTransferSubscribe = async (amount) => {
    const reference = `BT-${Date.now()}`;
    try {
      await api.post('/payments/bank-transfer', { amount, reference });
      alert('Bank transfer request sent. Please check your email for payment instructions. Your account will be activated upon confirmation.');
      setSelectedPlan(null);
    } catch (error) {
      console.error('Error creating bank transfer request:', error);
      alert('Failed to create bank transfer request.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pt-24 pb-16 max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">Simple, transparent pricing</h1>
          <p className="mt-4 text-lg text-gray-600">Choose the plan that's right for your institution.</p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              className="rounded-2xl border border-gray-200 p-8 bg-white shadow-lg"
              whileHover={{ y: -5, scale: 1.02 }}
            >
              <h2 className="text-2xl font-semibold">{plan.name}</h2>
              <p className="mt-4">
                <span className="text-5xl font-bold">{plan.price}</span>
                <span className="text-gray-500"> {plan.interval}</span>
              </p>
              <button
                onClick={() => setSelectedPlan(plan)}
                className="mt-8 w-full py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
              >
                Choose Plan
              </button>
              <ul className="mt-8 space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setSelectedPlan(null)}
          >
            <motion.div
              initial={{ y: 50, scale: 0.9 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 50, scale: 0.9 }}
              className="bg-white rounded-2xl p-8 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold">Choose Payment Method</h2>
              <p className="mt-2 text-gray-600">You have selected the <strong>{selectedPlan.name}</strong> plan.</p>
              <div className="mt-6 space-y-4">
                <button
                  onClick={() => handleStripeSubscribe(selectedPlan.stripePriceId)}
                  className="w-full flex items-center justify-center py-4 px-6 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <CreditCard className="h-6 w-6 mr-3" />
                  Pay with Card (Stripe)
                </button>
                <button
                  onClick={() => handleMpesaSubscribe(selectedPlan.price)}
                  className="w-full flex items-center justify-center py-4 px-6 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Smartphone className="h-6 w-6 mr-3" />
                  Pay with M-Pesa
                </button>
                <button
                  onClick={() => handleBankTransferSubscribe(selectedPlan.price)}
                  className="w-full flex items-center justify-center py-4 px-6 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Banknote className="h-6 w-6 mr-3" />
                  Pay with Bank Transfer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PricingPage;

