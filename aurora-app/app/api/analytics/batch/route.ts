import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * Batch Analytics Ingestion Endpoint
 * 
 * Receives batched analytics events from the client and stores them in Convex.
 * Handles high-volume event ingestion with rate limiting and validation.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { events } = body;

    // Validate request
    if (!events || !Array.isArray(events)) {
      return NextResponse.json(
        { error: 'Invalid request: events array required' },
        { status: 400 }
      );
    }

    // Limit batch size to prevent abuse
    if (events.length > 100) {
      return NextResponse.json(
        { error: 'Batch size too large (max 100 events)' },
        { status: 400 }
      );
    }

    // Validate each event
    for (const event of events) {
      if (!event.eventType || !event.sessionId || !event.timestamp) {
        return NextResponse.json(
          { error: 'Invalid event: missing required fields' },
          { status: 400 }
        );
      }
    }

    // Send to Convex
    await convex.mutation(api.analytics.logBatch, { events });

    return NextResponse.json({
      success: true,
      count: events.length,
    });
  } catch (error) {
    console.error('Analytics batch ingestion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'analytics-ingestion',
    timestamp: Date.now(),
  });
}
