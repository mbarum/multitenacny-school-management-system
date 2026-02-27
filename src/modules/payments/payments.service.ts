import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private stripe: Stripe | null = null;

  private getStripeInstance(): Stripe {
    if (!this.stripe) {
      const secretKey = process.env.STRIPE_SECRET_KEY;
      if (!secretKey) {
        throw new Error('STRIPE_SECRET_KEY not found in environment variables. Please configure it to process payments.');
      }
      this.stripe = new Stripe(secretKey, {
        apiVersion: '2026-02-25.clover',
      });
    }
    return this.stripe;
  }

  async createPaymentIntent(amount: number) {
    const stripe = this.getStripeInstance();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Amount in cents
      currency: 'usd',
    });
    return { clientSecret: paymentIntent.client_secret };
  }
}
