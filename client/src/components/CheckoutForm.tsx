import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '../services/api';

const CheckoutForm: React.FC = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [amount, setAmount] = useState('');
  const [succeeded, setSucceeded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setProcessing(true);

    const { data: { clientSecret } } = await api.post('/payments/create-payment-intent', {
      amount: Number(amount),
    });

    const payload = await stripe!.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements!.getElement(CardElement)!,
      },
    });

    if (payload.error) {
      setError(`Payment failed: ${payload.error.message}`);
      setProcessing(false);
    } else {
      setError(null);
      setProcessing(false);
      setSucceeded(true);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="block text-gray-700">Amount</label>
        <input
          type="number"
          className="w-full px-3 py-2 border rounded-lg"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">Card Details</label>
        <CardElement className="w-full px-3 py-2 border rounded-lg" />
      </div>
      <button
        type="submit"
        className="w-full bg-blue-500 text-white py-2 rounded-lg"
        disabled={processing || !stripe}
      >
        {processing ? 'Processing...' : 'Pay'}
      </button>
      {error && <div className="text-red-500 mt-4">{error}</div>}
      {succeeded && <div className="text-green-500 mt-4">Payment succeeded!</div>}
    </form>
  );
};

export default CheckoutForm;
