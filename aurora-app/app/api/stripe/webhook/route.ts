/**
 * Aurora Premium - Stripe Webhook Handler
 * 
 * Handles subscription events from Stripe.
 * Note: Stripe package is optional. Install with: npm install stripe
 */

import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  // Check if Stripe is configured
  if (!process.env.STRIPE_SECRET_KEY || !webhookSecret) {
    return NextResponse.json(
      { error: 'Webhook not configured' },
      { status: 503 }
    );
  }

  try {
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
        { error: 'Stripe not available' },
        { status: 503 }
      );
    }

    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        
        if (userId && session.subscription) {
          await convex.mutation(api.premium.activatePremium, {
            userId: userId as Id<"users">,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
          });
          console.log(`Premium activated for user: ${userId}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;
        
        if (userId) {
          await convex.mutation(api.premium.deactivatePremium, {
            userId: userId as Id<"users">,
          });
          console.log(`Premium deactivated for user: ${userId}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;
        
        // Handle subscription status changes (e.g., payment failed, reactivated)
        if (userId) {
          if (subscription.status === 'active') {
            console.log(`Subscription active for user: ${userId}`);
          } else if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
            console.log(`Subscription payment issue for user: ${userId}`);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log(`Payment failed for invoice: ${invoice.id}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
