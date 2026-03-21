import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import {
  checkRequestRateLimit,
  isTrustedAppRequest,
  readRequestSession,
} from "@/lib/api-security";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const MAX_BATCH_SIZE = 50;
const MAX_REQUEST_BYTES = 100_000;
const MAX_METADATA_CHARS = 2_000;
const EVENT_NAME_PATTERN = /^[a-z0-9_:-]{1,64}$/i;

/**
 * Batch Analytics Ingestion Endpoint
 * 
 * Receives batched analytics events from the client and stores them in Convex.
 * Handles high-volume event ingestion with rate limiting and validation.
 */
export async function POST(request: NextRequest) {
  try {
    if (!isTrustedAppRequest(request)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const contentLength = Number(request.headers.get("content-length") || "0");
    if (contentLength > MAX_REQUEST_BYTES) {
      return NextResponse.json(
        { error: 'Payload too large' },
        { status: 413 }
      );
    }

    const session = await readRequestSession(request);
    const rateLimitResult = await checkRequestRateLimit(
      request,
      'analyticsIngest',
      { session },
    );
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          remaining: rateLimitResult.remaining,
          resetIn: rateLimitResult.resetIn,
        },
        { status: 429 }
      );
    }

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
    if (events.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        { error: `Batch size too large (max ${MAX_BATCH_SIZE} events)` },
        { status: 400 }
      );
    }

    const sanitizedEvents = events.map((event: Record<string, unknown>) => {
      const eventType = typeof event.eventType === "string" ? event.eventType : "";
      const sessionId = typeof event.sessionId === "string" ? event.sessionId : "";
      const timestamp = typeof event.timestamp === "number" ? event.timestamp : 0;

      if (!eventType || !sessionId || !timestamp) {
        return null;
      }

      if (!EVENT_NAME_PATTERN.test(eventType) || sessionId.length > 128) {
        return null;
      }

      const metadata = sanitizeMetadata(event.metadata);
      const geo = sanitizeGeo(event.geo);
      const device = sanitizeDevice(event.device);
      const performance = sanitizePerformance(event.performance);

      return {
        eventType,
        sessionId,
        timestamp,
        userId: session?.convexUserId as Id<"users"> | undefined,
        metadata,
        geo,
        device,
        performance,
      };
    });

    // Validate each event
    if (sanitizedEvents.some((event) => event === null)) {
        return NextResponse.json(
          { error: 'Invalid event: missing required fields' },
          { status: 400 }
        );
    }

    // Send to Convex
    await convex.mutation(api.analytics.logBatch, {
      events: sanitizedEvents.filter(
        (
          event,
        ): event is NonNullable<typeof event> => event !== null,
      ),
    });

    return NextResponse.json({
      success: true,
      count: sanitizedEvents.length,
    });
  } catch (error) {
    console.error('Analytics batch ingestion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function sanitizeMetadata(value: unknown) {
  if (value === null || value === undefined) {
    return undefined;
  }

  try {
    const serialized = JSON.stringify(value);
    if (!serialized || serialized.length > MAX_METADATA_CHARS) {
      return undefined;
    }

    return JSON.parse(serialized) as unknown;
  } catch {
    return undefined;
  }
}

function sanitizeGeo(value: unknown) {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const geo = value as Record<string, unknown>;
  if (typeof geo.lat !== "number" || typeof geo.lng !== "number") {
    return undefined;
  }

  return {
    lat: clamp(geo.lat, -90, 90),
    lng: clamp(geo.lng, -180, 180),
    accuracy: typeof geo.accuracy === "number" ? Math.max(0, geo.accuracy) : undefined,
    city: typeof geo.city === "string" ? geo.city.slice(0, 80) : undefined,
    country: typeof geo.country === "string" ? geo.country.slice(0, 80) : undefined,
  };
}

function sanitizeDevice(value: unknown) {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const device = value as Record<string, unknown>;
  return {
    userAgent:
      typeof device.userAgent === "string"
        ? device.userAgent.slice(0, 256)
        : undefined,
    platform:
      typeof device.platform === "string"
        ? device.platform.slice(0, 80)
        : undefined,
    isMobile:
      typeof device.isMobile === "boolean" ? device.isMobile : undefined,
    screenWidth:
      typeof device.screenWidth === "number"
        ? Math.max(0, device.screenWidth)
        : undefined,
    screenHeight:
      typeof device.screenHeight === "number"
        ? Math.max(0, device.screenHeight)
        : undefined,
  };
}

function sanitizePerformance(value: unknown) {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const performance = value as Record<string, unknown>;
  return {
    loadTime:
      typeof performance.loadTime === "number"
        ? Math.max(0, performance.loadTime)
        : undefined,
    renderTime:
      typeof performance.renderTime === "number"
        ? Math.max(0, performance.renderTime)
        : undefined,
    networkLatency:
      typeof performance.networkLatency === "number"
        ? Math.max(0, performance.networkLatency)
        : undefined,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json(
    { error: 'Not found' },
    { status: 404 }
  );
}
