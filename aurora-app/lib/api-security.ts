import crypto from "crypto";
import { ConvexHttpClient } from "convex/browser";
import type { NextRequest } from "next/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { readSession, type AuroraSession } from "@/lib/server-session";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

type AdminAuthorization =
  | {
      authorized: true;
      session: AuroraSession | null;
      userId?: Id<"users">;
      via: "session" | "api-key";
    }
  | {
      authorized: false;
    };

export function isTrustedAppRequest(request: NextRequest): boolean {
  const expectedOrigin = request.nextUrl.origin;
  const origin = request.headers.get("origin");

  if (origin) {
    return origin === expectedOrigin;
  }

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).origin === expectedOrigin;
    } catch {
      return false;
    }
  }

  const secFetchSite = request.headers.get("sec-fetch-site");
  return secFetchSite === "same-origin" || secFetchSite === "same-site";
}

export async function readRequestSession(
  request: NextRequest,
): Promise<AuroraSession | null> {
  return readSession(request.cookies);
}

export function hasValidAdminApiKey(request: NextRequest): boolean {
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) {
    return false;
  }

  return request.headers.get("authorization") === `Bearer ${adminKey}`;
}

export async function authorizeAdminRequest(
  request: NextRequest,
  options: { allowApiKey?: boolean } = {},
): Promise<AdminAuthorization> {
  if (options.allowApiKey !== false && hasValidAdminApiKey(request)) {
    return {
      authorized: true,
      session: null,
      via: "api-key",
    };
  }

  const session = await readRequestSession(request);
  if (!session) {
    return { authorized: false };
  }

  const userId = session.convexUserId as Id<"users">;
  const isAdmin = await convex.query(api.admin.isAdmin, { userId });

  if (!isAdmin) {
    return { authorized: false };
  }

  return {
    authorized: true,
    session,
    userId,
    via: "session",
  };
}

export async function checkRequestRateLimit(
  request: NextRequest,
  actionType: string,
  options: {
    isPremium?: boolean;
    session?: AuroraSession | null;
  } = {},
) {
  const session = options.session ?? (await readRequestSession(request));
  const identifier = createRateLimitIdentifier(request, session);

  const result = await convex.mutation(api.rateLimit.checkRateLimit, {
    identifier,
    actionType,
    isPremium: options.isPremium ?? false,
  });

  return {
    ...result,
    identifier,
    session,
  };
}

function createRateLimitIdentifier(
  request: NextRequest,
  session: AuroraSession | null,
): string {
  if (session) {
    return `user:${session.convexUserId}`;
  }

  const ip = getClientIp(request);
  const fingerprint = ip || request.headers.get("user-agent") || "unknown";
  return `ip:${hashValue(fingerprint)}`;
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "";
  }

  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-vercel-forwarded-for") ||
    ""
  );
}

function hashValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex").slice(0, 24);
}
