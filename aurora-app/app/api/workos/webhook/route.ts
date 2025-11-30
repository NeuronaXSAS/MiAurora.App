/**
 * Aurora App - WorkOS Webhook Handler
 * 
 * Handles user lifecycle events from WorkOS for GDPR-compliant data management.
 * When a user is deleted from WorkOS, this webhook automatically cleans up
 * all associated data in Convex.
 * 
 * Setup in WorkOS Dashboard:
 * 1. Go to Webhooks section
 * 2. Add endpoint: https://yourdomain.com/api/workos/webhook
 * 3. Select events: user.deleted, user.updated
 * 4. Copy the signing secret to WORKOS_WEBHOOK_SECRET env var
 */

import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import crypto from 'crypto';

const webhookSecret = process.env.WORKOS_WEBHOOK_SECRET;
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// WorkOS webhook event types
interface WorkOSWebhookEvent {
  id: string;
  event: string;
  data: {
    id: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    [key: string]: unknown;
  };
  created_at: string;
}

/**
 * Verify WorkOS webhook signature
 * WorkOS uses HMAC-SHA256 for webhook verification
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    // WorkOS signature format: "t=timestamp,v1=signature"
    const parts = signature.split(',');
    const timestampPart = parts.find(p => p.startsWith('t='));
    const signaturePart = parts.find(p => p.startsWith('v1='));

    if (!timestampPart || !signaturePart) {
      console.error('Invalid signature format');
      return false;
    }

    const timestamp = timestampPart.replace('t=', '');
    const expectedSignature = signaturePart.replace('v1=', '');

    // Check timestamp is within 5 minutes to prevent replay attacks
    const timestampMs = parseInt(timestamp) * 1000;
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    if (Math.abs(now - timestampMs) > fiveMinutes) {
      console.error('Webhook timestamp too old');
      return false;
    }

    // Compute expected signature
    const signedPayload = `${timestamp}.${payload}`;
    const computedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');

    // Constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(computedSignature)
    );
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  // Check if webhook is configured
  if (!webhookSecret) {
    console.error('WORKOS_WEBHOOK_SECRET not configured');
    return NextResponse.json(
      { error: 'Webhook not configured' },
      { status: 503 }
    );
  }

  try {
    const body = await request.text();
    const signature = request.headers.get('workos-signature');

    if (!signature) {
      console.error('Missing WorkOS signature header');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 401 }
      );
    }

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature, webhookSecret)) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const event: WorkOSWebhookEvent = JSON.parse(body);
    console.log(`WorkOS webhook received: ${event.event}`, { eventId: event.id });

    switch (event.event) {
      case 'user.deleted': {
        // User was deleted from WorkOS - clean up all their data
        const workosId = event.data.id;
        console.log(`Processing user deletion for WorkOS ID: ${workosId}`);

        try {
          // First, mark user as deleted and get their Convex ID
          const markResult = await convex.mutation(api.users.deleteUserByWorkosId, {
            workosId,
          });

          if (markResult.userId) {
            // Then perform complete data deletion
            await convex.mutation(api.users.deleteUserComplete, {
              userId: markResult.userId,
            });
            console.log(`Complete data deletion finished for user: ${markResult.userId}`);
          }
        } catch (error) {
          console.error(`Error deleting user data for ${workosId}:`, error);
          // Don't throw - we still want to acknowledge the webhook
        }
        break;
      }

      case 'user.updated': {
        // User profile was updated in WorkOS
        const workosId = event.data.id;
        const email = event.data.email;
        const firstName = event.data.first_name;
        const lastName = event.data.last_name;
        
        console.log(`User updated in WorkOS: ${workosId}`);
        
        // Optionally sync profile changes
        // This could update email, name, etc. if needed
        // For now, we just log it
        break;
      }

      case 'user.created': {
        // New user created in WorkOS
        // Usually handled by the login flow, but log for monitoring
        console.log(`New user created in WorkOS: ${event.data.id}`);
        break;
      }

      default:
        console.log(`Unhandled WorkOS event type: ${event.event}`);
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ 
      received: true,
      eventId: event.id,
      eventType: event.event,
    });

  } catch (error) {
    console.error('WorkOS webhook error:', error);
    
    // Return 500 so WorkOS will retry
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    service: 'workos-webhook',
    configured: !!webhookSecret,
  });
}
