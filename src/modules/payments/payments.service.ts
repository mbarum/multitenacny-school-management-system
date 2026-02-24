import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY not found in environment variables');
    }
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2026-01-28.clover',
    });
  }

  async createPaymentIntent(amount: number) {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: amount * 100, // Amount in cents
      currency: 'usd',
    });
    return { clientSecret: paymentIntent.client_secret };
  }
}
