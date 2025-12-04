/**
 * Aurora Premium - Stripe Checkout API
 * 
 * Creates Stripe Checkout sessions for:
 * - Premium subscriptions (Plus, Pro, Elite)
 * - Credit package purchases
 * 
 * Supports regional pricing and multiple payment methods.
 */

import { NextRequest, NextResponse } from 'next/server';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.miaurora.app';

// Stripe Price IDs (configure in Stripe Dashboard)
const PRICE_IDS = {
  subscriptions: {
    plus: {
      monthly: process.env.STRIPE_PLUS_MONTHLY_PRICE_ID,
      annual: process.env.STRIPE_PLUS_ANNUAL_PRICE_ID,
    },
    pro: {
      monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
      annual: process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
    },
    elite: {
      monthly: process.env.STRIPE_ELITE_MONTHLY_PRICE_ID,
      annual: process.env.STRIPE_ELITE_ANNUAL_PRICE_ID,
    },
  },
  credits: {
    small: process.env.STRIPE_CREDITS_SMALL_PRICE_ID,
    medium: process.env.STRIPE_CREDITS_MEDIUM_PRICE_ID,
    large: process.env.STRIPE_CREDITS_LARGE_PRICE_ID,
    xl: process.env.STRIPE_CREDITS_XL_PRICE_ID,
  },
};

// Regional payment methods by country
const REGIONAL_PAYMENT_METHODS: Record<string, string[]> = {
  US: ['card'],
  GB: ['card'],
  EU: ['card', 'sepa_debit', 'ideal', 'bancontact'],
  NL: ['card', 'ideal'],
  DE: ['card', 'sepa_debit', 'giropay'],
  IN: ['card'], // UPI via Stripe India
  BR: ['card'], // PIX via Stripe Brazil
  AU: ['card'],
  CA: ['card'],
  MX: ['card', 'oxxo'],
  JP: ['card'],
  default: ['card'],
};

// PPP (Purchasing Power Parity) multipliers
const PPP_MULTIPLIERS: Record<string, number> = {
  US: 1.0,
  GB: 0.95,
  EU: 0.90,
  CA: 0.95,
  AU: 0.95,
  IN: 0.35,
  BR: 0.45,
  MX: 0.50,
  PH: 0.40,
  NG: 0.30,
  KE: 0.35,
  ZA: 0.50,
  default: 1.0,
};

function getPaymentMethods(country: string): string[] {
  return REGIONAL_PAYMENT_METHODS[country] || REGIONAL_PAYMENT_METHODS.default;
}

function getPPPMultiplier(country: string): number {
  return PPP_MULTIPLIERS[country] || PPP_MULTIPLIERS.default;
}

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { 
          error: 'Payment system not configured',
          message: 'Premium subscriptions will be available soon. Thank you for your interest! 💜'
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { 
      userId, 
      email, 
      type, // 'subscription' or 'credits'
      tier, // 'plus', 'pro', 'elite' for subscriptions
      billingCycle, // 'monthly' or 'annual'
      packageId, // 'small', 'medium', 'large', 'xl' for credits
      country, // For regional pricing
    } = body;

    if (!userId || !email || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Dynamic import of Stripe
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

    const paymentMethods = getPaymentMethods(country || 'US');
    const pppMultiplier = getPPPMultiplier(country || 'US');

    if (type === 'subscription') {
      // Subscription checkout
      if (!tier || !billingCycle) {
        return NextResponse.json(
          { error: 'Missing tier or billing cycle' },
          { status: 400 }
        );
      }

      const tierPrices = PRICE_IDS.subscriptions[tier as keyof typeof PRICE_IDS.subscriptions];
      if (!tierPrices) {
        return NextResponse.json(
          { error: 'Invalid subscription tier' },
          { status: 400 }
        );
      }

      const priceId = billingCycle === 'annual' ? tierPrices.annual : tierPrices.monthly;
      
      // If no price ID configured, create dynamic price
      let lineItems;
      if (priceId) {
        lineItems = [{ price: priceId, quantity: 1 }];
      } else {
        // Fallback: Create price dynamically (for development)
        const basePrices = {
          plus: { monthly: 500, annual: 4800 },
          pro: { monthly: 1200, annual: 11520 },
          elite: { monthly: 2500, annual: 24000 },
        };
        
        const basePrice = basePrices[tier as keyof typeof basePrices];
        const adjustedPrice = Math.round(
          (billingCycle === 'annual' ? basePrice.annual : basePrice.monthly) * pppMultiplier
        );

        lineItems = [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Aurora ${tier.charAt(0).toUpperCase() + tier.slice(1)}`,
              description: `${billingCycle === 'annual' ? 'Annual' : 'Monthly'} subscription`,
            },
            unit_amount: adjustedPrice,
            recurring: {
              interval: billingCycle === 'annual' ? 'year' : 'month',
            },
          },
          quantity: 1,
        }];
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: paymentMethods as any,
        line_items: lineItems,
        customer_email: email,
        metadata: {
          userId,
          type: 'subscription',
          tier,
          billingCycle,
          country: country || 'US',
        },
        success_url: `${APP_URL}/premium/success?session_id={CHECKOUT_SESSION_ID}&type=subscription`,
        cancel_url: `${APP_URL}/premium?canceled=true`,
        subscription_data: {
          metadata: {
            userId,
            tier,
            billingCycle,
          },
        },
        allow_promotion_codes: true,
        billing_address_collection: 'auto',
        tax_id_collection: { enabled: true },
      });

      return NextResponse.json({ 
        sessionId: session.id,
        url: session.url 
      });

    } else if (type === 'credits') {
      // Credit package checkout
      if (!packageId) {
        return NextResponse.json(
          { error: 'Missing package ID' },
          { status: 400 }
        );
      }

      const creditPriceId = PRICE_IDS.credits[packageId as keyof typeof PRICE_IDS.credits];
      
      // Credit package prices (in cents)
      const creditPackages = {
        small: { credits: 100, price: 100 },
        medium: { credits: 500, price: 400 },
        large: { credits: 1000, price: 700 },
        xl: { credits: 5500, price: 3000 }, // 5000 + 500 bonus
      };

      const pkg = creditPackages[packageId as keyof typeof creditPackages];
      if (!pkg) {
        return NextResponse.json(
          { error: 'Invalid credit package' },
          { status: 400 }
        );
      }

      const adjustedPrice = Math.round(pkg.price * pppMultiplier);

      let lineItems;
      if (creditPriceId) {
        lineItems = [{ price: creditPriceId, quantity: 1 }];
      } else {
        lineItems = [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${pkg.credits} Aurora Credits`,
              description: packageId === 'xl' ? 'Includes 500 bonus credits!' : undefined,
            },
            unit_amount: adjustedPrice,
          },
          quantity: 1,
        }];
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: paymentMethods as any,
        line_items: lineItems,
        customer_email: email,
        metadata: {
          userId,
          type: 'credits',
          packageId,
          credits: pkg.credits.toString(),
          country: country || 'US',
        },
        success_url: `${APP_URL}/premium/success?session_id={CHECKOUT_SESSION_ID}&type=credits`,
        cancel_url: `${APP_URL}/premium?canceled=true`,
        allow_promotion_codes: true,
      });

      return NextResponse.json({ 
        sessionId: session.id,
        url: session.url 
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid checkout type' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

// GET endpoint for regional pricing info
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country') || 'US';
  
  const multiplier = getPPPMultiplier(country);
  
  // Base prices in USD
  const basePrices = {
    subscriptions: {
      plus: { monthly: 5, annual: 48 },
      pro: { monthly: 12, annual: 115.20 },
      elite: { monthly: 25, annual: 240 },
    },
    credits: {
      small: { credits: 100, price: 1 },
      medium: { credits: 500, price: 4 },
      large: { credits: 1000, price: 7 },
      xl: { credits: 5500, price: 30 },
    },
  };

  // Apply PPP multiplier
  const adjustedPrices = {
    country,
    multiplier,
    subscriptions: {
      plus: {
        monthly: Math.round(basePrices.subscriptions.plus.monthly * multiplier * 100) / 100,
        annual: Math.round(basePrices.subscriptions.plus.annual * multiplier * 100) / 100,
      },
      pro: {
        monthly: Math.round(basePrices.subscriptions.pro.monthly * multiplier * 100) / 100,
        annual: Math.round(basePrices.subscriptions.pro.annual * multiplier * 100) / 100,
      },
      elite: {
        monthly: Math.round(basePrices.subscriptions.elite.monthly * multiplier * 100) / 100,
        annual: Math.round(basePrices.subscriptions.elite.annual * multiplier * 100) / 100,
      },
    },
    credits: {
      small: {
        credits: 100,
        price: Math.round(basePrices.credits.small.price * multiplier * 100) / 100,
      },
      medium: {
        credits: 500,
        price: Math.round(basePrices.credits.medium.price * multiplier * 100) / 100,
      },
      large: {
        credits: 1000,
        price: Math.round(basePrices.credits.large.price * multiplier * 100) / 100,
      },
      xl: {
        credits: 5500,
        price: Math.round(basePrices.credits.xl.price * multiplier * 100) / 100,
      },
    },
    paymentMethods: getPaymentMethods(country),
  };

  return NextResponse.json(adjustedPrices);
}
