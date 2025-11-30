/**
 * Aurora Premium - Stripe Checkout API
 * 
 * Creates a Stripe Checkout session for Premium subscription.
 * Price: $5 USD/month
 * 
 * Note: Stripe package is optional. Install with: npm install stripe
 */

import { NextRequest, NextResponse } from 'next/server';

const PREMIUM_PRICE_ID = process.env.STRIPE_PREMIUM_PRICE_ID;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.miaurora.app';

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY || !PREMIUM_PRICE_ID) {
      return NextResponse.json(
        { 
          error: 'Payment system not configured',
          message: 'Premium subscriptions will be available soon. Thank you for your interest! 💜'
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { userId, email } = body;

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Dynamic import of Stripe to avoid build errors if not installed
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    let stripe: any;
    try {
      const Stripe = require('stripe');
      stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { 
        apiVersion: '2023-10-16'
      });
    } catch {
      return NextResponse.json(
        { 
          error: 'Payment system not available',
          message: 'Premium subscriptions will be available soon. Thank you for your interest! 💜'
        },
        { status: 503 }
      );
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: PREMIUM_PRICE_ID,
          quantity: 1,
        },
      ],
      customer_email: email,
      metadata: {
        userId,
        plan: 'premium',
      },
      success_url: `${APP_URL}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/premium?canceled=true`,
      subscription_data: {
        metadata: {
          userId,
        },
      },
      // Allow promotion codes for discounts
      allow_promotion_codes: true,
    });

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
