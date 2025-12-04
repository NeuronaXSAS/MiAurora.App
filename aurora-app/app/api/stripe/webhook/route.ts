/**
 * Aurora Premium - Stripe Webhook Handler
 * 
 * Handles all Stripe events for:
 * - Subscription lifecycle (created, updated, deleted)
 * - Credit purchases
 * - Payment failures and retries
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
    console.log('Stripe webhook not configured');
    return NextResponse.json(
      { error: 'Webhook not configured' },
      { status: 503 }
    );
  }

  try {
    // Dynamic import of Stripe
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

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    console.log(`Processing Stripe event: ${event.type}`);

    switch (event.type) {
      // ============================================
      // CHECKOUT COMPLETED
      // ============================================
      case 'checkout.session.completed': {
        const session = event.data.object;
        const metadata = session.metadata || {};
        const userId = metadata.userId as Id<"users">;
        
        if (!userId) {
          console.error('No userId in checkout session metadata');
          break;
        }

        if (metadata.type === 'subscription') {
          // Handle subscription checkout
          const tier = metadata.tier;
          const billingCycle = metadata.billingCycle as 'monthly' | 'annual';
          
          await convex.mutation(api.subscriptions.createSubscription, {
            userId,
            tier,
            billingCycle,
            stripeSubscriptionId: session.subscription as string,
            stripeCustomerId: session.customer as string,
          });
          
          console.log(`Subscription created for user ${userId}: ${tier} (${billingCycle})`);
          
        } else if (metadata.type === 'credits') {
          // Handle credit purchase
          const packageId = metadata.packageId;
          
          await convex.mutation(api.credits.purchaseCredits, {
            userId,
            packageId,
            stripePaymentId: session.payment_intent as string,
          });
          
          console.log(`Credits purchased for user ${userId}: ${packageId}`);
        }
        break;
      }

      // ============================================
      // SUBSCRIPTION EVENTS
      // ============================================
      case 'customer.subscription.created': {
        const subscription = event.data.object;
        const metadata = subscription.metadata || {};
        const userId = metadata.userId as Id<"users">;
        
        if (userId) {
          console.log(`Subscription created via webhook for user ${userId}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const metadata = subscription.metadata || {};
        const userId = metadata.userId as Id<"users">;
        
        if (userId) {
          await convex.mutation(api.subscriptions.handleStripeWebhook, {
            eventType: 'customer.subscription.updated',
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: subscription.customer as string,
            status: subscription.status,
          });
          
          console.log(`Subscription updated for user ${userId}: ${subscription.status}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const metadata = subscription.metadata || {};
        const userId = metadata.userId as Id<"users">;
        
        if (userId) {
          await convex.mutation(api.subscriptions.handleStripeWebhook, {
            eventType: 'customer.subscription.deleted',
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: subscription.customer as string,
          });
          
          console.log(`Subscription cancelled for user ${userId}`);
        }
        break;
      }

      // ============================================
      // INVOICE EVENTS
      // ============================================
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        
        if (subscriptionId) {
          await convex.mutation(api.subscriptions.handleStripeWebhook, {
            eventType: 'invoice.payment_succeeded',
            stripeSubscriptionId: subscriptionId as string,
          });
          
          console.log(`Invoice payment succeeded for subscription ${subscriptionId}`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        
        if (subscriptionId) {
          await convex.mutation(api.subscriptions.handleStripeWebhook, {
            eventType: 'invoice.payment_failed',
            stripeSubscriptionId: subscriptionId as string,
          });
          
          console.log(`Invoice payment failed for subscription ${subscriptionId}`);
        }
        break;
      }

      // ============================================
      // PAYMENT INTENT EVENTS (for one-time purchases)
      // ============================================
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        console.log(`Payment intent succeeded: ${paymentIntent.id}`);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        console.log(`Payment intent failed: ${paymentIntent.id}`);
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

// Note: In Next.js App Router, body parsing is handled automatically
// The raw body is available via request.text() which we use above
