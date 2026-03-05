import { loadStripe, Stripe } from '@stripe/stripe-js';
import api from './api';

let stripePromise: Promise<Stripe | null> | null = null;

export const getStripe = async () => {
  if (!stripePromise) {
    try {
      const response = await api.get('/config');
      const { stripePublishableKey } = response.data;
      if (stripePublishableKey) {
        stripePromise = loadStripe(stripePublishableKey);
      } else {
        console.error('Stripe publishable key not found in config');
        return null;
      }
    } catch (error) {
      console.error('Error fetching config:', error);
      return null;
    }
  }
  return stripePromise;
};
